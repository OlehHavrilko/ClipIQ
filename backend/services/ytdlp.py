import yt_dlp
import asyncio
import re
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse
from models import FormatInfo, InspectorInfo


PLATFORM_PATTERNS = {
    'tiktok': r'tiktok\.com',
    'instagram': r'instagram\.com|instagr\.am',
    'youtube': r'youtube\.com|youtu\.be',
    'twitter': r'twitter\.com|x\.com',
    'reddit': r'reddit\.com|redd\.it',
}


def detect_platform(url: str) -> str:
    for platform, pattern in PLATFORM_PATTERNS.items():
        if re.search(pattern, url, re.IGNORECASE):
            return platform
    return 'unknown'


def _quality_label(fmt: Dict[str, Any]) -> str:
    h = fmt.get('height')
    if not h:
        vcodec = fmt.get('vcodec', '')
        if vcodec == 'none' or not vcodec:
            return 'audio'
        return 'unknown'
    if h >= 1080:
        return '1080p'
    elif h >= 720:
        return '720p'
    elif h >= 480:
        return '480p'
    elif h >= 360:
        return '360p'
    else:
        return f'{h}p'


def _format_note(fmt: Dict[str, Any], idx: int) -> str:
    notes = []
    h = fmt.get('height')
    tbr = fmt.get('tbr', 0) or 0
    if h and h >= 1080:
        notes.append('High quality')
    elif h and h >= 720:
        notes.append('Fast')
    elif h and h < 480:
        notes.append('Lightweight')
    if not notes:
        notes.append('Standard')
    return notes[0]


def _has_watermark(fmt: Dict[str, Any], platform: str) -> bool:
    if platform == 'tiktok':
        fid = fmt.get('format_id', '')
        url = fmt.get('url', '')
        if 'watermark' in fid.lower() or 'watermark' in url.lower():
            return True
        # TikTok: formats without 'bytevc' or 'h265' tend to be watermarked
    return False


def extract_formats(info: Dict[str, Any], platform: str) -> List[FormatInfo]:
    formats = info.get('formats', [])
    seen_qualities = set()
    result = []

    # Sort by quality descending
    def sort_key(f):
        h = f.get('height') or 0
        tbr = f.get('tbr') or 0
        return (h, tbr)

    sorted_formats = sorted(formats, key=sort_key, reverse=True)

    has_audio_only = False
    for i, fmt in enumerate(sorted_formats):
        vcodec = fmt.get('vcodec', '')
        acodec = fmt.get('acodec', '')
        height = fmt.get('height')
        ext = fmt.get('ext', 'mp4')

        # Skip video-only formats (no audio)
        if acodec == 'none' and vcodec != 'none':
            continue
        # Skip storyboard/thumbnails
        if fmt.get('format_note', '').lower() in ('storyboard', 'sb0', 'sb1', 'sb2', 'sb3'):
            continue
        if 'storyboard' in fmt.get('format_id', '').lower():
            continue

        quality = _quality_label(fmt)

        # Deduplicate by quality
        if quality != 'audio' and quality in seen_qualities:
            continue
        if quality == 'audio' and has_audio_only:
            continue

        if quality == 'audio':
            has_audio_only = True
        else:
            seen_qualities.add(quality)

        tbr = fmt.get('tbr')
        abr = fmt.get('abr')
        fps = fmt.get('fps')
        if fps:
            fps = int(fps)

        filesize = fmt.get('filesize') or fmt.get('filesize_approx')

        vcodec_clean = vcodec.split('.')[0] if vcodec and vcodec != 'none' else None
        acodec_clean = acodec.split('.')[0] if acodec and acodec != 'none' else None

        result.append(FormatInfo(
            format_id=fmt.get('format_id', str(i)),
            quality=quality,
            ext='mp3' if quality == 'audio' else ext,
            codec=vcodec_clean,
            fps=fps,
            bitrate_kbps=int(tbr) if tbr else None,
            filesize_bytes=filesize,
            audio_codec=acodec_clean,
            audio_bitrate=int(abr) if abr else None,
            watermark=_has_watermark(fmt, platform),
            note=_format_note(fmt, i),
        ))

        if len(result) >= 6:
            break

    return result


def extract_inspector(info: Dict[str, Any]) -> InspectorInfo:
    # CDN detection from URL
    cdn = None
    formats = info.get('formats', [])
    if formats:
        url = formats[-1].get('url', '')
        try:
            hostname = urlparse(url).hostname or ''
            parts = hostname.split('.')
            if len(parts) >= 2:
                cdn = '.'.join(parts[-2:])
        except Exception:
            pass

    width = info.get('width')
    height = info.get('height')
    dimensions = f'{width}x{height}' if width and height else None

    upload_ts = None
    upload_date = info.get('upload_date')
    if upload_date and len(upload_date) == 8:
        try:
            upload_ts = f'{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:8]}T00:00:00Z'
        except Exception:
            pass

    container = None
    if formats:
        container = formats[-1].get('ext')

    return InspectorInfo(
        container=container,
        dimensions=dimensions,
        cdn=cdn,
        upload_ts=upload_ts,
    )


async def extract_info(url: str) -> Dict[str, Any]:
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
        'noplaylist': True,
    }
    loop = asyncio.get_event_loop()

    def _extract():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            return ydl.extract_info(url, download=False)

    return await loop.run_in_executor(None, _extract)
