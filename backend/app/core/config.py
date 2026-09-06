import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CorridorOps"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "corridorops-secret-key-super-secure-sih-26027"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database configuration
    # Uses async sqlite for quick local testing/dev, or Postgres async string in production
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "sqlite+aiosqlite:///./corridorops.db"
    )
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
