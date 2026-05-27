from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import settings
from services.queue import get_redis
from routers import extract, download, stream, status, jobs
import redis.asyncio as aioredis


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.redis = await get_redis(settings.redis_url)
    yield
    # Shutdown
    await app.state.redis.aclose()


app = FastAPI(
    title='ClipIQ API',
    description='Media Intelligence Downloader — Backend API',
    version='1.0.0',
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Routers
app.include_router(extract.router, prefix='/api')
app.include_router(download.router, prefix='/api')
app.include_router(stream.router, prefix='/api')
app.include_router(status.router, prefix='/api')
app.include_router(jobs.router, prefix='/api')


@app.get('/health')
async def health():
    return {'status': 'ok', 'service': 'clipiq-backend'}
