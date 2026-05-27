from fastapi import APIRouter, HTTPException, Request
from services.queue import cancel_job, delete_job, get_job
import redis.asyncio as aioredis
import os

router = APIRouter()


@router.delete('/job/{job_id}')
async def remove_job(job_id: str, request: Request):
    r: aioredis.Redis = request.app.state.redis
    job = await get_job(r, job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')

    # Delete temp file if exists
    if job.file_url:
        from config import settings
        file_path = job.metadata.get('file_path') if job.metadata else None
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

    await cancel_job(r, job_id)
    await delete_job(r, job_id)
    return {'status': 'deleted'}
