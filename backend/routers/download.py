from fastapi import APIRouter, HTTPException, Request
from models import DownloadRequest
from services.queue import create_job, get_redis
from config import settings
import redis.asyncio as aioredis

router = APIRouter()


@router.post('/download')
async def start_download(req: DownloadRequest, request: Request):
    r: aioredis.Redis = request.app.state.redis
    job_id = await create_job(
        r,
        url=req.url,
        format_id=req.format_id,
        platform=req.platform,
        ttl=settings.file_ttl_seconds + 300,
    )
    return {'job_id': job_id, 'status': 'queued'}
