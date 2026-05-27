'use client'
import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react'

interface PlayerProps {
  src: string
  poster?: string
}

export function Player({ src, poster }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loop, setLoop] = useState(false)

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0)
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    v.currentTime = (x / rect.width) * v.duration
  }, [])

  const toggleFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen()
  }, [])

  const toggleLoop = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.loop = !v.loop
    setLoop(v.loop)
  }, [])

  return (
    <motion.div
      className="glass rounded-2xl overflow-hidden w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="relative bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full max-h-72 object-contain"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaying(false)}
          onClick={togglePlay}
          style={{ cursor: 'pointer' }}
        />
        {!playing && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
              <Play className="w-6 h-6 text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3">
        {/* Scrubber */}
        <div
          className="h-1.5 rounded-full mb-3 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          onClick={handleSeek}
        >
          <div
            className="h-full progress-bar rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-primary)' }}>
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={toggleMute} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleLoop}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: loop ? 'var(--violet-light)' : 'var(--text-muted)' }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
