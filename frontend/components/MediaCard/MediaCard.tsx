'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Heart, Clock, Music, Calendar } from 'lucide-react'
import type { ExtractResponse } from '@/lib/types'
import { formatViews, formatDuration } from '@/lib/api'

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#ff0050', instagram: '#e1306c', youtube: '#ff0000',
  twitter: '#1d9bf0', reddit: '#ff4500', unknown: '#94a3b8',
}

const PLATFORM_NAMES: Record<string, string> = {
  tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube',
  twitter: 'X / Twitter', reddit: 'Reddit', unknown: 'Unknown',
}

interface MediaCardProps {
  data: ExtractResponse
}

export function MediaCard({ data }: MediaCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const platformColor = PLATFORM_COLORS[data.platform] || '#94a3b8'

  return (
    <motion.div
      className="glass rounded-2xl overflow-hidden w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex gap-0">
        {/* Thumbnail */}
        <div className="relative w-32 h-44 flex-shrink-0 overflow-hidden bg-black">
          {/* Skeleton placeholder */}
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          {data.thumbnail && (
            <motion.img
              src={data.thumbnail}
              alt={data.title}
              className="w-full h-full object-cover"
              onLoad={() => setImgLoaded(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: imgLoaded ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
          {/* Duration badge */}
          {data.duration && (
            <div
              className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-xs font-mono font-medium flex items-center gap-0.5"
              style={{ background: 'rgba(0,0,0,0.75)', color: 'white' }}
            >
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(data.duration)}
            </div>
          )}
          {/* Platform badge */}
          <div
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-xs font-medium"
            style={{
              background: `${platformColor}25`,
              color: platformColor,
              border: `1px solid ${platformColor}40`,
            }}
          >
            {PLATFORM_NAMES[data.platform] || 'Media'}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-4 min-w-0">
          <div className="mb-1">
            <h3
              className="text-sm font-semibold leading-snug line-clamp-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {data.title}
            </h3>
          </div>

          {data.author && (
            <p className="text-xs mb-2" style={{ color: 'var(--violet-light)' }}>
              @{data.author.replace('@', '')}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {data.views != null && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Eye className="w-3 h-3" />{formatViews(data.views)}
              </span>
            )}
            {data.likes != null && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Heart className="w-3 h-3" />{formatViews(data.likes)}
              </span>
            )}
            {data.upload_date && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-3 h-3" />{data.upload_date}
              </span>
            )}
          </div>

          {/* Music */}
          {data.music && (
            <div className="flex items-center gap-1.5 mb-2">
              <Music className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--cyan)' }} />
              <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {data.music}
              </span>
            </div>
          )}

          {/* Hashtags */}
          {data.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.hashtags.slice(0, 5).map(tag => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded-md"
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    color: 'var(--violet-light)',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  #{tag}
                </span>
              ))}
              {data.hashtags.length > 5 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md"
                  style={{ color: 'var(--text-muted)' }}
                >
                  +{data.hashtags.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
