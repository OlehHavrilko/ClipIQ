'use client'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import type { ExtractResponse } from '@/lib/types'
import { formatDuration } from '@/lib/api'

interface InspectorProps {
  data: ExtractResponse
}

interface Row {
  label: string
  value: string | null | undefined
}

export function Inspector({ data }: InspectorProps) {
  const fmt = data.formats[0]
  const rows: Row[] = [
    { label: 'Codec', value: fmt?.codec?.toUpperCase() },
    { label: 'Container', value: data.inspector.container?.toUpperCase() },
    { label: 'FPS', value: fmt?.fps ? `${fmt.fps} fps` : null },
    { label: 'Audio', value: fmt?.audio_codec ? `${fmt.audio_codec.toUpperCase()} ${fmt.audio_bitrate ?? ''}kbps` : null },
    { label: 'Bitrate', value: fmt?.bitrate_kbps ? `${(fmt.bitrate_kbps / 1000).toFixed(1)} Mbps` : null },
    { label: 'Duration', value: data.duration ? formatDuration(data.duration) : null },
    { label: 'Dimensions', value: data.inspector.dimensions },
    { label: 'CDN', value: data.inspector.cdn },
    { label: 'Hashtags', value: data.hashtags.length ? data.hashtags.map(h => `#${h}`).join(' ') : null },
    { label: 'Music', value: data.music },
    { label: 'Upload', value: data.inspector.upload_ts ? new Date(data.inspector.upload_ts).toLocaleString() : data.upload_date },
  ].filter(r => r.value)

  return (
    <motion.div
      className="glass rounded-2xl p-5 w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Search className="w-4 h-4" style={{ color: 'var(--cyan)' }} />
        Media Inspector
      </h3>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            className="flex items-start gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.03 }}
          >
            <span
              className="text-xs font-mono flex-shrink-0 w-20"
              style={{ color: 'var(--text-muted)' }}
            >
              {row.label}
            </span>
            <span
              className="text-xs font-mono break-all"
              style={{ color: 'var(--cyan-light)' }}
            >
              {row.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
