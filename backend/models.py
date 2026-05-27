from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class ExtractRequest(BaseModel):
    url: str


class FormatInfo(BaseModel):
    format_id: str
    quality: str  # e.g. '1080p', '720p', 'audio'
    ext: str
    codec: Optional[str] = None
    fps: Optional[int] = None
    bitrate_kbps: Optional[int] = None
    filesize_bytes: Optional[int] = None
    audio_codec: Optional[str] = None
    audio_bitrate: Optional[int] = None
    watermark: bool = False
    note: Optional[str] = None  # 'No watermark', 'Fast', etc.


class InspectorInfo(BaseModel):
    container: Optional[str] = None
    dimensions: Optional[str] = None
    cdn: Optional[str] = None
    upload_ts: Optional[str] = None


class ExtractResponse(BaseModel):
    url: str
    platform: str
    title: str
    author: Optional[str] = None
    thumbnail: Optional[str] = None
    blurhash: Optional[str] = None
    duration: Optional[int] = None
    views: Optional[int] = None
    likes: Optional[int] = None
    upload_date: Optional[str] = None
    music: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)
    formats: List[FormatInfo] = Field(default_factory=list)
    inspector: InspectorInfo = Field(default_factory=InspectorInfo)


class DownloadRequest(BaseModel):
    url: str
    format_id: str
    platform: str


class JobStep(BaseModel):
    label: str
    status: str  # 'pending', 'active', 'done', 'error'
    duration_ms: Optional[int] = None


class JobStatus(BaseModel):
    job_id: str
    status: str  # 'queued', 'processing', 'done', 'error', 'cancelled'
    progress: float = 0.0  # 0.0 to 100.0
    steps: List[JobStep] = Field(default_factory=list)
    file_url: Optional[str] = None
    filename: Optional[str] = None
    filesize_bytes: Optional[int] = None
    speed_mbps: Optional[float] = None
    eta_seconds: Optional[int] = None
    error: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Optional[dict] = None
