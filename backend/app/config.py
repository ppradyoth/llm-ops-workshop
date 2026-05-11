from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    app_name: str = "AI Resume Analyzer API"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")

    gemini_api_key: str | None = Field(default=None, validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", validation_alias="GEMINI_MODEL")
    gemini_timeout_seconds: int = Field(default=30, validation_alias="GEMINI_TIMEOUT_SECONDS")
    gemini_retry_attempts: int = Field(default=3, validation_alias="GEMINI_RETRY_ATTEMPTS")
    gemini_retry_base_delay_seconds: float = Field(
        default=1.0,
        validation_alias="GEMINI_RETRY_BASE_DELAY_SECONDS",
    )
    enable_ai_fallback: bool = Field(default=True, validation_alias="ENABLE_AI_FALLBACK")

    cors_origins: str = Field(default="http://localhost:5173", validation_alias="CORS_ORIGINS")
    max_resume_chars: int = Field(default=20000, validation_alias="MAX_RESUME_CHARS")
    max_upload_mb: int = Field(default=5, validation_alias="MAX_UPLOAD_MB")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
