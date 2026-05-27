'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, X, Loader2, Zap } from 'lucide-react'
import clsx from 'clsx'

const PLATFORM_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  tiktok: { name: 'TikTok', color: '#ff0050', icon: '♪' },
  instagram: { name: 'Instagram', color: '#e1306c', icon: '◎' },
  youtube: { name: 'YouTube', color: '#ff0000', icon: '▶' },
  twitter: { name: 'X / Twitter', color: '#1d9bf0', icon: '✕' },
  reddit: { name: 'Reddit', color: '#ff4500', icon: '●' },
  unknown: { name: 'Media URL', color: '#94a3b8', icon: '◈' },
}

function detectPlatform(url: string): string {
  if (/tiktok\.com/i.test(url)) return 'tiktok'
  if (/instagram\.com|instagr\.am/i.test(url)) return 'instagram'
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube'
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter'
  if (/reddit\.com|redd\.it/i.test(url)) return 'reddit'
  return 'unknown'
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

interface UrlInputProps {
  onExtract: (url: string) => void
  isLoading: boolean
}

export function UrlInput({ onExtract, isLoading }: UrlInputProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [platform, setPlatform] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback((v: string) => {
    setValue(v)
    if (isValidUrl(v)) {
      const p = detectPlatform(v)
      setPlatform(p)
    } else {
      setPlatform(null)
    }
  }, [])

  const handleSubmit = useCallback((url: string) => {
    if (isValidUrl(url) && !isLoading) {
      onExtract(url)
    }
  }, [onExtract, isLoading])

  // Global paste listener
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') || ''
      if (isValidUrl(text) && document.activeElement !== inputRef.current) {
        e.preventDefault()
        setValue(text)
        const p = detectPlatform(text)
        setPlatform(p)
        setTimeout(() => handleSubmit(text), 100)
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [handleSubmit])

  const platformInfo = platform ? PLATFORM_CONFIG[platform] : null

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className={clsx(
          'relative rounded-2xl transition-all duration-300',
          focused || value ? 'glow-violet' : ''
        )}
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="glass-strong rounded-2xl overflow-hidden"
          style={{
            border: focused
              ? '1px solid rgba(124,58,237,0.5)'
              : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex-shrink-0">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Loader2 className="w-5 h-5 text-violet-light animate-spin" />
                  </motion.div>
                ) : platformInfo ? (
                  <motion.span
                    key={platform}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-lg"
                    style={{ color: platformInfo.color }}
                  >
                    {platformInfo.icon}
                  </motion.span>
                ) : (
                  <motion.div key="link" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Link className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              ref={inputRef}
              id="url-input"
              type="url"
              value={value}
              onChange={e => handleChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(value)}
              placeholder="Paste URL from TikTok, Instagram, YouTube..."
              className="flex-1 bg-transparent outline-none text-base font-sans"
              style={{ color: 'var(--text-primary)', caretColor: 'var(--violet)' }}
              disabled={isLoading}
              autoComplete="off"
              spellCheck={false}
            />

            <div className="flex items-center gap-2 flex-shrink-0">
              {value && !isLoading && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => { setValue(''); setPlatform(null) }}
                  className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Clear input"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
              <motion.button
                onClick={() => handleSubmit(value)}
                disabled={!isValidUrl(value) || isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  color: 'white',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Zap className="w-4 h-4" />
                <span>Inspect</span>
              </motion.button>
            </div>
          </div>

          {/* Platform hint */}
          <AnimatePresence>
            {platformInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-5 pb-3"
              >
                <span
                  className="text-xs font-mono px-2 py-1 rounded-md border"
                  style={{
                    color: platformInfo.color,
                    borderColor: `${platformInfo.color}40`,
                    background: `${platformInfo.color}10`,
                  }}
                >
                  {platformInfo.name} detected
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.p
        className="text-center mt-3 text-xs"
        style={{ color: 'var(--text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Zap className="w-3 h-3 inline mr-1" style={{ color: 'var(--violet-light)' }} />
        Zero-click — just paste anywhere on the page
      </motion.p>
    </div>
  )
}
