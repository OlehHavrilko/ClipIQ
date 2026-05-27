'use client'
import { motion } from 'framer-motion'
import { Download, Shield, ShieldOff, Headphones, Film } from 'lucide-react'
import type { FormatInfo } from '@/lib/types'
import { formatBytes } from '@/lib/api'

interface QualityPickerProps {
  formats: FormatInfo[]
  platform: string
  url: string
  onDownload: (format: FormatInfo) => void
  isDownloading: boolean
  activeFormatId: string | null
}

export function QualityPicker({ formats, platform, url, onDownload, isDownloading, activeFormatId }: QualityPickerProps) {
  return (
    <div className="glass rounded-2xl p-5 w-full">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Film className="w-4 h-4" style={{ color: 'var(--violet-light)' }} />
        Quality Options
      </h3>
      <div className="space-y-2">
        {formats.map((fmt, i) => (
          <motion.div
            key={fmt.format_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group"
            style={{
              background: activeFormatId === fmt.format_id
                ? 'rgba(124,58,237,0.15)'
                : 'rgba(255,255,255,0.03)',
              border: activeFormatId === fmt.format_id
                ? '1px solid rgba(124,58,237,0.3)'
                : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Quality dot */}
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: fmt.quality === 'audio'
                  ? 'var(--cyan)'
                  : i === 0 ? 'var(--violet)' : 'var(--text-muted)',
              }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {fmt.quality}
                </span>
                {fmt.watermark ? (
                  <span className="flex items-center gap-0.5 text-xs" style={{ color: '#f59e0b' }}>
                    <ShieldOff className="w-3 h-3" /> Watermark
                  </span>
                ) : fmt.quality !== 'audio' ? (
                  <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--success)' }}>
                    <Shield className="w-3 h-3" /> Clean
                  </span>
                ) : null}
                {fmt.note && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>• {fmt.note}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {fmt.codec && <span>{fmt.codec.toUpperCase()}</span>}
                {fmt.fps && <span>• {fmt.fps}fps</span>}
                {fmt.bitrate_kbps && <span>• {(fmt.bitrate_kbps / 1000).toFixed(1)} Mbps</span>}
                {fmt.filesize_bytes && <span>• {formatBytes(fmt.filesize_bytes)}</span>}
                {fmt.audio_bitrate && !fmt.fps && <span>• {fmt.audio_bitrate}kbps</span>}
              </div>
            </div>

            {/* Download button */}
            <motion.button
              onClick={() => onDownload(fmt)}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-40 flex-shrink-0"
              style={{
                background: fmt.quality === 'audio'
                  ? 'linear-gradient(135deg, #0e7490, #06b6d4)'
                  : 'linear-gradient(135deg, #5b21b6, #7c3aed)',
                color: 'white',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {fmt.quality === 'audio' ? <Headphones className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>Get</span>
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
