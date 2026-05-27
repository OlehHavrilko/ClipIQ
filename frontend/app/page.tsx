'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Github } from 'lucide-react'
import toast from 'react-hot-toast'
import { UrlInput } from '@/components/UrlInput/UrlInput'
import { MediaCard } from '@/components/MediaCard/MediaCard'
import { QualityPicker } from '@/components/QualityPicker/QualityPicker'
import { Inspector } from '@/components/Inspector/Inspector'
import { DownloadQueue } from '@/components/DownloadQueue/DownloadQueue'
import { useSSE } from '@/lib/sse'
import { extractMedia, startDownload } from '@/lib/api'
import type { ExtractResponse, FormatInfo, JobStatus } from '@/lib/types'

interface QueueItem {
  jobId: string
  status: JobStatus | null
}

function JobStatusWrapper({ jobId, onUpdate }: { jobId: string; onUpdate: (id: string, s: JobStatus | null) => void }) {
  const { jobStatus } = useSSE(jobId)
  if (jobStatus) onUpdate(jobId, jobStatus)
  return null
}

export default function HomePage() {
  const [mediaData, setMediaData] = useState<ExtractResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [activeFormatId, setActiveFormatId] = useState<string | null>(null)

  const handleExtract = useCallback(async (url: string) => {
    setIsLoading(true)
    setMediaData(null)
    setActiveFormatId(null)
    try {
      const data = await extractMedia(url)
      setMediaData(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to extract media')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDownload = useCallback(async (format: FormatInfo) => {
    if (!mediaData) return
    setActiveFormatId(format.format_id)
    try {
      const { job_id } = await startDownload(mediaData.url, format.format_id, mediaData.platform)
      setQueue(prev => [...prev, { jobId: job_id, status: null }])
      toast.success('Download queued!')
    } catch {
      toast.error('Failed to start download')
      setActiveFormatId(null)
    }
  }, [mediaData])

  const updateJobStatus = useCallback((id: string, status: JobStatus | null) => {
    setQueue(prev => prev.map(j => j.jobId === id ? { ...j, status } : j))
    if (status?.status === 'done') setActiveFormatId(null)
  }, [])

  const removeJob = useCallback((id: string) => {
    setQueue(prev => prev.filter(j => j.jobId !== id))
  }, [])

  return (
    <main className="min-h-screen px-4 py-8">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between max-w-5xl mx-auto mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold gradient-text">ClipIQ</span>
            <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Media Intelligence</span>
          </div>
        </div>
        <a
          href="https://github.com/OlehHavrilko/ClipIQ"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Github className="w-4 h-4" />
          GitHub
        </a>
      </motion.header>

      {/* Hero */}
      <motion.div
        className="text-center max-w-2xl mx-auto mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">Inspect.</span>{' '}
          <span style={{ color: 'var(--text-primary)' }}>Preview.</span>{' '}
          <span className="gradient-text">Download.</span>
        </h1>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Drop any TikTok, Instagram, YouTube, X, or Reddit link — get codec details, quality options, and instant download.
        </p>
      </motion.div>

      {/* URL Input */}
      <motion.div
        className="max-w-2xl mx-auto mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <UrlInput onExtract={handleExtract} isLoading={isLoading} />
      </motion.div>

      {/* Loading skeleton */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <div className="lg:col-span-2 space-y-4">
              <div className="glass rounded-2xl p-4 h-44 flex gap-4">
                <div className="skeleton w-32 h-full rounded-xl" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
              </div>
              <div className="glass rounded-2xl p-5 space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            </div>
            <div className="glass rounded-2xl p-5 space-y-3">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-4 rounded" />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {mediaData && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <div className="lg:col-span-2 space-y-4">
              <MediaCard data={mediaData} />
              <QualityPicker
                formats={mediaData.formats}
                platform={mediaData.platform}
                url={mediaData.url}
                onDownload={handleDownload}
                isDownloading={activeFormatId !== null}
                activeFormatId={activeFormatId}
              />
              {queue.length > 0 && (
                <div>
                  {queue.map(({ jobId }) => (
                    <JobStatusWrapper key={jobId} jobId={jobId} onUpdate={updateJobStatus} />
                  ))}
                  <DownloadQueue jobs={queue} onRemove={removeJob} />
                </div>
              )}
            </div>
            <div>
              <Inspector data={mediaData} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {!mediaData && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-8"
          >
            <div className="flex justify-center gap-6 flex-wrap">
              {['TikTok', 'Instagram', 'YouTube', 'X / Twitter', 'Reddit'].map(p => (
                <div
                  key={p}
                  className="px-4 py-2 rounded-xl text-xs"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
