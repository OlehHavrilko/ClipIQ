export interface FormatInfo {
  format_id: string
  quality: string
  ext: string
  codec: string | null
  fps: number | null
  bitrate_kbps: number | null
  filesize_bytes: number | null
  audio_codec: string | null
  audio_bitrate: number | null
  watermark: boolean
  note: string | null
}

export interface InspectorInfo {
  container: string | null
  dimensions: string | null
  cdn: string | null
  upload_ts: string | null
}

export interface ExtractResponse {
  url: string
  platform: string
  title: string
  author: string | null
  thumbnail: string | null
  blurhash: string | null
  duration: number | null
  views: number | null
  likes: number | null
  upload_date: string | null
  music: string | null
  hashtags: string[]
  formats: FormatInfo[]
  inspector: InspectorInfo
}

export interface JobStep {
  label: string
  status: 'pending' | 'active' | 'done' | 'error'
  duration_ms: number | null
}

export interface JobStatus {
  job_id: string
  status: 'queued' | 'processing' | 'done' | 'error' | 'cancelled'
  progress: number
  steps: JobStep[]
  file_url: string | null
  filename: string | null
  filesize_bytes: number | null
  speed_mbps: number | null
  eta_seconds: number | null
  error: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}
