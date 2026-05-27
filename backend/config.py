from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    redis_url: str = 'redis://redis:6379/0'
    temp_dir: str = '/app/storage/temp'
    file_ttl_seconds: int = 3600
    max_file_size_mb: int = 500
    max_parallel_jobs: int = 5
    allowed_platforms: str = 'tiktok,instagram,youtube,twitter,reddit'
    cors_origins: str = 'http://188.137.227.70'
    base_url: str = 'http://188.137.227.70'

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(',')]

    @property
    def allowed_platforms_list(self) -> List[str]:
        return [p.strip() for p in self.allowed_platforms.split(',')]

    class Config:
        env_file = '.env'
        extra = 'ignore'


settings = Settings()
