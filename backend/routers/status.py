from fastapi import APIRouter, HTTPException, Request
from services.queue import get_job
from models import JobStatus
import redis.asyncio as aioredis

router = APIRouter()


@router.get('/status/{job_id}', response_model=JobStatus)
async def get_status(job_id: str, request: Request):
    r: aioredis.Redis = request.app.state.redis
    job = await get_job(r, job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job
