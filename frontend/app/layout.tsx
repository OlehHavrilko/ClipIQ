import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'ClipIQ — Media Intelligence Downloader',
  description: 'Inspect, preview, and download media from TikTok, Instagram, YouTube, Twitter and Reddit. No watermarks, smart quality picker, real-time progress.',
  keywords: ['media downloader', 'tiktok downloader', 'instagram downloader', 'youtube downloader', 'no watermark'],
  openGraph: {
    title: 'ClipIQ — Media Intelligence Downloader',
    description: 'Inspect, preview, and download media from any platform.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
