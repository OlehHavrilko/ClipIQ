from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from services.queue import get_redis, get_job, PUBSUB_PREFIX
import asyncio
import json
import redis.asyncio as aioredis

router = APIRouter()


@router.get('/stream/{job_id}')
async def stream_job(job_id: str, request: Request):
    r: aioredis.Redis = request.app.state.redis

    async def event_generator():
        # Send current state first
        job = await get_job(r, job_id)
        if not job:
            yield f'event: error\ndata: {{"error": "Job not found"}}\n\n'
            return

        yield f'data: {job.model_dump_json()}\n\n'

        if job.status in ('done', 'error', 'cancelled'):
            return

        # Subscribe to pubsub channel
        pubsub = r.pubsub()
        await pubsub.subscribe(f'{PUBSUB_PREFIX}{job_id}')

        try:
            async for message in pubsub.listen():
                if await request.is_disconnected():
                    break
                if message['type'] == 'message':
                    data = message['data']
                    yield f'data: {data}\n\n'
                    # Check if terminal state
                    try:
                        parsed = json.loads(data)
                        if parsed.get('status') in ('done', 'error', 'cancelled'):
                            break
                    except Exception:
                        pass
        finally:
            await pubsub.unsubscribe(f'{PUBSUB_PREFIX}{job_id}')
            await pubsub.aclose()

    return StreamingResponse(
        event_generator(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
        },
    )
