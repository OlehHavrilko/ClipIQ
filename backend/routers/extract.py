from fastapi import APIRouter, HTTPException
from models import ExtractRequest, ExtractResponse
from services.ytdlp import extract_info, detect_platform, extract_formats, extract_inspector
from services.metadata import fetch_blurhash, extract_hashtags, extract_music
import asyncio

router = APIRouter()


@router.post('/extract', response_model=ExtractResponse)
async def extract_media(req: ExtractRequest):
    try:
        info = await extract_info(req.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Failed to extract media info: {str(e)}')

    if not info:
        raise HTTPException(status_code=404, detail='No media found at this URL')

    platform = detect_platform(req.url)
    thumbnail = info.get('thumbnail')

    # Blurhash (fire and forget-ish with timeout)
    blurhash = None
    if thumbnail:
        try:
            blurhash = await asyncio.wait_for(fetch_blurhash(thumbnail), timeout=5.0)
        except asyncio.TimeoutError:
            pass

    description = info.get('description', '') or ''
    formats = extract_formats(info, platform)
    inspector = extract_inspector(info)

    upload_date = info.get('upload_date')
    if upload_date and len(upload_date) == 8:
        upload_date = f'{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:8]}'

    return ExtractResponse(
        url=req.url,
        platform=platform,
        title=info.get('title', 'Untitled'),
        author=info.get('uploader') or info.get('creator') or info.get('channel'),
        thumbnail=thumbnail,
        blurhash=blurhash,
        duration=info.get('duration'),
        views=info.get('view_count'),
        likes=info.get('like_count'),
        upload_date=upload_date,
        music=extract_music(info),
        hashtags=extract_hashtags(description),
        formats=formats,
        inspector=inspector,
    )
