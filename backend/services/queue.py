import redis.asyncio as aioredis
import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from models import JobStatus, JobStep


JOB_PREFIX = 'clipiq:job:'
QUEUE_KEY = 'clipiq:queue'
PUBSUB_PREFIX = 'clipiq:events:'


async def get_redis(redis_url: str) -> aioredis.Redis:
    return await aioredis.from_url(redis_url, encoding='utf-8', decode_responses=True)


async def create_job(r: aioredis.Redis, url: str, format_id: str, platform: str, ttl: int) -> str:
    job_id = str(uuid.uuid4())
    job = JobStatus(
        job_id=job_id,
        status='queued',
        progress=0.0,
        steps=[
            JobStep(label='Extracting metadata...', status='pending'),
            JobStep(label='Fetching media streams...', status='pending'),
            JobStep(label='Selecting best quality...', status='pending'),
            JobStep(label='Downloading...', status='pending'),
            JobStep(label='Optimizing...', status='pending'),
        ],
        metadata={'url': url, 'format_id': format_id, 'platform': platform},
        created_at=datetime.utcnow().isoformat(),
    )
    await r.set(f'{JOB_PREFIX}{job_id}', job.model_dump_json(), ex=ttl)
    await r.rpush(QUEUE_KEY, job_id)
    return job_id


async def get_job(r: aioredis.Redis, job_id: str) -> Optional[JobStatus]:
    data = await r.get(f'{JOB_PREFIX}{job_id}')
    if not data:
        return None
    return JobStatus.model_validate_json(data)


async def update_job(r: aioredis.Redis, job: JobStatus, ttl: int):
    await r.set(f'{JOB_PREFIX}{job.job_id}', job.model_dump_json(), ex=ttl)
    # Publish event for SSE
    await r.publish(f'{PUBSUB_PREFIX}{job.job_id}', job.model_dump_json())


async def cancel_job(r: aioredis.Redis, job_id: str):
    job = await get_job(r, job_id)
    if job:
        job.status = 'cancelled'
        await r.set(f'{JOB_PREFIX}{job_id}', job.model_dump_json(), ex=60)
        await r.publish(f'{PUBSUB_PREFIX}{job_id}', job.model_dump_json())


async def delete_job(r: aioredis.Redis, job_id: str):
    await r.delete(f'{JOB_PREFIX}{job_id}')
