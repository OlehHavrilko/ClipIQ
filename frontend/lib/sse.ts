'use client'
import { useState, useEffect, useRef } from 'react'
import type { JobStatus } from './types'

export function useSSE(jobId: string | null) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!jobId) return

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'
    const es = new EventSource(`${API_BASE}/stream/${jobId}`)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const data: JobStatus = JSON.parse(e.data)
        setJobStatus(data)
        if (data.status === 'done' || data.status === 'error' || data.status === 'cancelled') {
          es.close()
        }
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      es.close()
    }

    return () => {
      es.close()
    }
  }, [jobId])

  return { jobStatus }
}
