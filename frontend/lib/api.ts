import type { ExtractResponse, JobStatus } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export async function extractMedia(url: string): Promise<ExtractResponse> {
  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail || 'Failed to extract media')
  }
  return res.json()
}

export async function startDownload(url: string, format_id: string, platform: string): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, format_id, platform }),
  })
  if (!res.ok) throw new Error('Failed to start download')
  return res.json()
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/status/${jobId}`)
  if (!res.ok) throw new Error('Job not found')
  return res.json()
}

export async function cancelJob(jobId: string): Promise<void> {
  await fetch(`${API_BASE}/job/${jobId}`, { method: 'DELETE' })
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return 'Unknown'
  const mb = bytes / (1024 * 1024)
  return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `~${mb.toFixed(1)} MB`
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function formatViews(n: number | null): string {
  if (!n) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}
