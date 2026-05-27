import asyncio
import os
import uuid
import json
import time
import logging
from datetime import datetime

import redis.asyncio as aioredis
import yt_dlp

from models import JobStatus, JobStep
from services.queue import (
    get_redis, get_job, update_job,
    QUEUE_KEY, JOB_PREFIX
)
from config import settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('clipiq.worker')

sem = asyncio.Semaphore(settings.max_parallel_jobs)


def _make_step(label: str, status: str = 'pending') -> JobStep:
    return JobStep(label=label, status=status)


INITIAL_STEPS = [
    'Extracting metadata...',
    'Fetching media streams...',
    'Selecting best quality...',
    'Downloading...',
    'Optimizing...',
]


async def process_job(r: aioredis.Redis, job_id: str):
    async with sem:
        job = await get_job(r, job_id)
        if not job or job.status == 'cancelled':
            return

        log.info(f'Processing job {job_id}')
        meta = job.metadata or {}
        url = meta.get('url', '')
        format_id = meta.get('format_id', 'best')
        platform = meta.get('platform', 'unknown')

        # Reset steps
        job.steps = [JobStep(label=s, status='pending') for s in INITIAL_STEPS]
        job.status = 'processing'
        job.progress = 0.0
        await update_job(r, job, settings.file_ttl_seconds + 300)

        start_ts = time.time()

        async def set_step(idx: int, status: str, duration_ms: int = None):
            for i, s in enumerate(job.steps):
                if i < idx:
                    job.steps[i].status = 'done'
                elif i == idx:
                    job.steps[i].status = status
                    if duration_ms:
                        job.steps[i].duration_ms = duration_ms
                else:
                    break
            await update_job(r, job, settings.file_ttl_seconds + 300)

        try:
            # Step 0: Extracting metadata
            await set_step(0, 'active')
            t0 = time.time()

            file_uuid = str(uuid.uuid4())
            out_dir = os.path.join(settings.temp_dir, file_uuid)
            os.makedirs(out_dir, exist_ok=True)

            progress_data = {'downloaded': 0, 'total': 0, 'speed': 0, 'eta': 0}

            def progress_hook(d):
                if d['status'] == 'downloading':
                    downloaded = d.get('downloaded_bytes', 0) or 0
                    total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                    speed = d.get('speed') or 0
                    eta = d.get('eta') or 0
                    progress_data.update({
                        'downloaded': downloaded,
                        'total': total,
                        'speed': speed,
                        'eta': eta,
                    })

            # Step 1: Fetching streams
            await set_step(1, 'active', int((time.time() - t0) * 1000))

            # Build yt-dlp options
            # If the format_id is audio, let's download the best audio format
            if format_id == 'audio':
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'outtmpl': os.path.join(out_dir, '%(title)s.%(ext)s'),
                    'noplaylist': True,
                    'quiet': True,
                    'no_warnings': True,
                    'progress_hooks': [progress_hook],
                    'extract_audio': True,
                    'audio_format': 'mp3',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192',
                    }],
                    'max_filesize': settings.max_file_size_mb * 1024 * 1024,
                }
            else:
                ydl_opts = {
                    'format': format_id if format_id != 'best' else 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                    'outtmpl': os.path.join(out_dir, '%(title)s.%(ext)s'),
                    'noplaylist': True,
                    'quiet': True,
                    'no_warnings': True,
                    'progress_hooks': [progress_hook],
                    'remuxvideo': 'mp4',  # remux only, no transcoding
                    'merge_output_format': 'mp4',
                    'max_filesize': settings.max_file_size_mb * 1024 * 1024,
                    'writethumbnail': False,
                    'writesubtitles': False,
                }

            # Step 2: Selecting quality
            await set_step(2, 'active')
            await asyncio.sleep(0.1)
            await set_step(2, 'done')

            # Step 3: Downloading
            await set_step(3, 'active')
            job.progress = 5.0
            await update_job(r, job, settings.file_ttl_seconds + 300)

            loop = asyncio.get_event_loop()

            async def do_download():
                def _dl():
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.download([url])
                await loop.run_in_executor(None, _dl)

            # Run download with progress updates
            download_task = asyncio.create_task(do_download())

            while not download_task.done():
                await asyncio.sleep(0.5)
                # Check for cancellation
                current_job = await get_job(r, job_id)
                if current_job and current_job.status == 'cancelled':
                    download_task.cancel()
                    log.info(f'Job {job_id} cancelled during download.')
                    return

                if progress_data['total'] > 0:
                    pct = min(90.0, 5.0 + (progress_data['downloaded'] / progress_data['total']) * 80.0)
                    job.progress = pct
                    speed_mbps = (progress_data['speed'] or 0) / (1024 * 1024)
                    job.speed_mbps = round(speed_mbps, 2)
                    job.eta_seconds = progress_data.get('eta')
                await update_job(r, job, settings.file_ttl_seconds + 300)

            await download_task  # Re-raise any exceptions

            # Step 4: Optimizing
            await set_step(4, 'active')
            job.progress = 95.0
            await update_job(r, job, settings.file_ttl_seconds + 300)
            await asyncio.sleep(0.3)

            # Find downloaded file
            files = os.listdir(out_dir)
            if not files:
                raise RuntimeError('No file was downloaded')

            filename = files[0]
            file_path = os.path.join(out_dir, filename)
            filesize = os.path.getsize(file_path)

            file_url = f'/files/temp/{file_uuid}/{filename}'

            # Done!
            for s in job.steps:
                s.status = 'done'
            job.status = 'done'
            job.progress = 100.0
            job.file_url = file_url
            job.filename = filename
            job.filesize_bytes = filesize
            job.speed_mbps = None
            job.eta_seconds = None
            if job.metadata is None:
                job.metadata = {}
            job.metadata['file_path'] = file_path

            await update_job(r, job, settings.file_ttl_seconds)
            log.info(f'Job {job_id} done: {filename} ({filesize} bytes)')

            # Schedule file cleanup
            asyncio.create_task(cleanup_file(file_path, out_dir, settings.file_ttl_seconds))

        except Exception as e:
            log.error(f'Job {job_id} failed: {e}')
            job.status = 'error'
            job.error = str(e)
            for s in job.steps:
                if s.status in ('active', 'pending'):
                    s.status = 'error'
                    break
            await update_job(r, job, 300)  # Keep error state for 5 min


async def cleanup_file(file_path: str, dir_path: str, ttl: int):
    await asyncio.sleep(ttl)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.isdir(dir_path) and not os.listdir(dir_path):
            os.rmdir(dir_path)
        log.info(f'Cleaned up: {file_path}')
    except Exception as e:
        log.warning(f'Cleanup failed for {file_path}: {e}')


async def main():
    log.info('ClipIQ Worker starting...')
    r = await get_redis(settings.redis_url)
    log.info(f'Connected to Redis: {settings.redis_url}')

    while True:
        try:
            # Blocking pop with 1s timeout
            result = await r.blpop(QUEUE_KEY, timeout=1)
            if result:
                _, job_id = result
                asyncio.create_task(process_job(r, job_id))
        except Exception as e:
            log.error(f'Queue error: {e}')
            await asyncio.sleep(1)


if __name__ == '__main__':
    asyncio.run(main())
