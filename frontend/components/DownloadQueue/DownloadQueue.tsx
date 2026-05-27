'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react'
import type { JobStatus } from '@/lib/types'
import { formatBytes } from '@/lib/api'
import { cancelJob } from '@/lib/api'

interface DownloadQueueProps {
  jobs: { jobId: string; status: JobStatus | null; filename?: string }[]
  onRemove: (jobId: string) => void
}

function StepProgress({ status }: { status: JobStatus }) {
  return (
    <div className="space-y-1 mt-2">
      {status.steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
            {step.status === 'done' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />}
            {step.status === 'active' && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--violet)' }} />}
            {step.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }} />}
            {step.status === 'error' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--error)' }} />}
          </div>
          <span
            className="text-xs font-mono"
            style={{
              color: step.status === 'active' ? 'var(--violet-light)'
                : step.status === 'done' ? 'var(--text-secondary)'
                : step.status === 'error' ? 'var(--error)'
                : 'var(--text-muted)',
            }}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DownloadQueue({ jobs, onRemove }: DownloadQueueProps) {
  if (jobs.length === 0) return null

  return (
    <div className="w-full space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
        <Download className="w-4 h-4" />
        Download Queue
      </h3>
      <AnimatePresence>
        {jobs.map(({ jobId, status }) => (
          <motion.div
            key={jobId}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                {status?.status === 'done' && <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />}
                {status?.status === 'error' && <AlertCircle className="w-4 h-4" style={{ color: 'var(--error)' }} />}
                {(status?.status === 'processing' || status?.status === 'queued') && (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--violet-light)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                    {status?.filename || jobId.slice(0, 8) + '...'}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    {status?.speed_mbps != null && (
                      <span className="text-xs font-mono" style={{ color: 'var(--cyan)' }}>
                        {status.speed_mbps.toFixed(1)} MB/s
                      </span>
                    )}
                    {status?.eta_seconds != null && (
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        {status.eta_seconds}s
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    className="h-full progress-bar"
                    animate={{ width: `${status?.progress ?? 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Steps */}
                {status && status.status !== 'done' && status.status !== 'error' && (
                  <StepProgress status={status} />
                )}

                {/* Done — download link */}
                {status?.status === 'done' && status.file_url && (
                  <div className="flex gap-2">
                    <a
                      href={status.file_url}
                      download
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                      style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)' }}
                    >
                      <Download className="w-3 h-3" />
                      Download — {formatBytes(status.filesize_bytes)}
                    </a>
                    <a
                      href={`/inspect/${jobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                      style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--violet-light)', border: '1px solid rgba(124,58,237,0.25)' }}
                    >
                      Share Page
                    </a>
                  </div>
                )}

                {/* Error */}
                {status?.status === 'error' && (
                  <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{status.error}</p>
                )}
              </div>

              <button
                onClick={async () => {
                  await cancelJob(jobId).catch(() => {})
                  onRemove(jobId)
                }}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
