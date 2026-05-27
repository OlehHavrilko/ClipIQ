'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, CheckCheck, Download, Zap } from 'lucide-react'
import { getJobStatus, formatBytes } from '@/lib/api'
import type { JobStatus } from '@/lib/types'

export function InspectClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobStatus | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getJobStatus(jobId)
      .then(setJob)
      .catch(() => setError('Job not found or expired'))
  }, [jobId])

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <p style={{ color: 'var(--error)' }}>{error}</p>
          <a href="/" className="text-sm mt-4 block" style={{ color: 'var(--violet-light)' }}>← Back to ClipIQ</a>
        </div>
      </main>
    )
  }

  if (!job) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8"><div className="skeleton w-48 h-6 rounded" /></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-12 flex items-center justify-center">
      <motion.div
        className="glass-strong rounded-2xl p-8 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5" style={{ color: 'var(--violet)' }} />
          <span className="font-bold gradient-text">ClipIQ</span>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>Shared media</span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {job.filename || 'Media file'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {formatBytes(job.filesize_bytes)} • Expires in ~1h
          </p>
        </div>

        {job.file_url && (
          <a
            href={job.file_url}
            download
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl mb-6 text-sm font-medium transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white' }}
          >
            <Download className="w-4 h-4" />
            Download File
          </a>
        )}

        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-xl bg-white/5">
            <QRCodeSVG
              value={pageUrl}
              size={140}
              bgColor="transparent"
              fgColor="#a78bfa"
              level="M"
            />
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: copied ? 'var(--success)' : 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs" style={{ color: 'var(--text-muted)' }}>← Back to ClipIQ</a>
        </div>
      </motion.div>
    </main>
  )
}
