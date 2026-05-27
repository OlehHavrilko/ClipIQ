import httpx
import asyncio
import io
from typing import Optional


async def fetch_blurhash(thumbnail_url: str) -> Optional[str]:
    """Download thumbnail and compute blurhash."""
    try:
        import blurhash
        from PIL import Image

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(thumbnail_url)
            resp.raise_for_status()
            img = Image.open(io.BytesIO(resp.content))
            img = img.convert('RGB')
            img.thumbnail((100, 100))
            hash_val = blurhash.encode(img, components_x=4, components_y=3)
            return hash_val
    except Exception:
        return None


def extract_hashtags(description: str) -> list[str]:
    import re
    if not description:
        return []
    return re.findall(r'#(\w+)', description)


def extract_music(info: dict) -> Optional[str]:
    # TikTok music info
    music = info.get('music') or info.get('track')
    artist = info.get('artist') or info.get('creator')
    if music and artist:
        return f'{music} - {artist}'
    if music:
        return music
    return None
