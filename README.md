# ClipIQ — Media Intelligence Downloader

> **Inspect. Preview. Download.** — Not just a downloader: inspect codecs, CDN, bitrate, preview before downloading.

[![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)](https://fastapi.tiangolo.com/)
[![Stack](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=flat-square)](https://nextjs.org/)
[![Stack](https://img.shields.io/badge/Queue-Redis%207-dc382d?style=flat-square)](https://redis.io/)
[![Stack](https://img.shields.io/badge/Proxy-Caddy%202-00adef?style=flat-square)](https://caddyserver.com/)

---

## Features

- **Zero-click paste** — paste URL anywhere on the page, instant extraction
- **Platform detection** — TikTok, Instagram, YouTube, X/Twitter, Reddit
- **Media Inspector** — codec, container, FPS, bitrate, CDN, audio details
- **Smart Quality Picker** — 1080p/720p/480p/audio with filesize estimates and watermark detection
- **Real-time SSE progress** — 5-step pipeline with animated progress
- **Download Queue** — multiple jobs, speed (MB/s), ETA, cancel
- **Shareable pages** — `/inspect/{id}` with QR code, 1-hour TTL
- **No transcoding** — remux only, CPU-friendly on 1 vCPU VPS

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| UI | Framer Motion, Lucide icons, React Query |
| Backend | FastAPI, Python 3.11 |
| Queue | Redis 7 (BLPOP-based job queue) |
| Downloader | yt-dlp (latest) |
| Reverse Proxy | Caddy 2 (HTTP-only, IP mode) |
| Containers | Docker + Docker Compose |
| File Serving | Caddy serves `/files/*` directly |

---

## Project Structure

```
ClipIQ/
├── frontend/               # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx        # Main UI
│   │   ├── inspect/[id]/   # Shareable page with QR code
│   │   └── globals.css     # Dark glassmorphism design
│   ├── components/
│   │   ├── UrlInput/       # Zero-click paste zone
│   │   ├── MediaCard/      # Preview card + metadata
│   │   ├── QualityPicker/  # Format chooser
│   │   ├── Inspector/      # Codec/CDN/bitrate panel
│   │   ├── DownloadQueue/  # Progress pipeline UI
│   │   └── Player/         # Embedded video player
│   └── lib/
│       ├── sse.ts          # SSE client hook
│       ├── api.ts          # API calls + formatters
│       └── types.ts        # TypeScript types
│
├── backend/                # FastAPI
│   ├── main.py
│   ├── models.py           # Pydantic v2 models
│   ├── config.py           # Settings from env
│   ├── routers/            # extract, download, stream, status, jobs
│   ├── services/           # ytdlp wrapper, metadata, redis queue
│   ├── workers/            # Background downloader
│   └── storage/temp/       # Downloaded files (TTL 1h)
│
├── caddy/Caddyfile         # HTTP-only on 188.137.227.70
├── docker-compose.yml
└── .env.example
```

---

## Local Development

```bash
# Clone
git clone https://github.com/OlehHavrilko/ClipIQ
cd ClipIQ

# Copy env
cp .env.example .env

# Start everything
docker compose up -d --build

# View logs
docker compose logs -f
```

App available at: http://localhost (via Caddy)

---

## VPS Deployment (188.137.227.70)

### 1. First login

```bash
ssh root@188.137.227.70

# Update system
apt update && apt upgrade -y
apt install -y curl wget git nano htop ufw fail2ban

# Firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

### 3. Deploy project

```bash
mkdir -p /opt/media-inspector
cd /opt/media-inspector
git clone https://github.com/OlehHavrilko/ClipIQ .

# Configure env
cp .env.example .env
# The defaults are pre-configured for 188.137.227.70

# Start
docker compose up -d --build

# Check status
docker compose ps
```

### 4. Cron for cleanup (temp files)

```bash
crontab -e
# Add:
0 * * * * find /opt/media-inspector/storage/temp -mindepth 2 -mmin +60 -type f -delete
```

### 5. Useful commands

```bash
# Restart all
docker compose restart

# Update code
git pull && docker compose up -d --build

# Logs per service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f worker

# Resource monitoring
docker stats
htop
```

---

## API Reference

```
POST   /api/extract          # Get media metadata by URL
POST   /api/download         # Create download job
GET    /api/stream/{job_id}  # SSE progress stream (text/event-stream)
GET    /api/status/{job_id}  # JSON job status
DELETE /api/job/{job_id}     # Cancel / delete job
GET    /files/temp/{uuid}/*  # Caddy serves files directly
```

### Extract Request
```json
{ "url": "https://www.tiktok.com/@user/video/123" }
```

### SSE Events
```
data: {"job_id":"...","status":"processing","progress":45.0,"steps":[...]}
data: {"job_id":"...","status":"done","file_url":"/files/temp/uuid/video.mp4"}
```

---

## VPS Constraints Respected

- ✅ No FFmpeg transcoding — yt-dlp remux-only (`--remux-video mp4`)
- ✅ 1-hour TTL on temp files (Redis + cron)
- ✅ Max 5 parallel downloads (asyncio.Semaphore)
- ✅ 500 MB file size limit
- ✅ Caddy serves files directly (not through Python)
- ✅ Redis stores metadata only (not file bytes)

---

## Adding TLS / Domain Later

When you have a domain pointing to `188.137.227.70`:

```caddyfile
# Replace in caddy/Caddyfile:
# :80 {
your-domain.com {
    # ... same handlers
}
```

Caddy will auto-provision Let's Encrypt TLS. No other changes needed.

---

## License

MIT
