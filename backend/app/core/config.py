"""
Application configuration settings using Pydantic Settings.
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""

    # Application
    APP_NAME: str = "Horserace Prediction API"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL database URL with asyncpg driver"
    )

    # Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )

    # KRA API (한국마사회 공공데이터)
    KRA_API_KEY: str = Field(..., description="KRA API key from data.go.kr")
    KRA_API_BASE_URL: str = Field(
        default="https://apis.data.go.kr/B551015",
        description="KRA API base URL"
    )
    KRA_API_TIMEOUT: int = Field(default=30, description="API timeout in seconds")
    KRA_API_MAX_RETRIES: int = Field(default=3, description="Max retry attempts")

    # Prediction Service
    PREDICTION_SERVICE_URL: str = Field(
        default="http://localhost:8001",
        description="LLM Prediction Service URL"
    )

    # Security
    SECRET_KEY: str = Field(..., description="Secret key for JWT encoding")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        description="Access token expiration time"
    )

    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="Allowed CORS origins"
    )

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
