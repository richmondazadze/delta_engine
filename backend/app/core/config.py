"""
Delta Engine — Application Configuration
Loads environment variables with validation and defaults.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List
from functools import lru_cache

REPO_ROOT = Path(__file__).resolve().parents[3]
ROOT_ENV_FILE = REPO_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(ROOT_ENV_FILE) if ROOT_ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- App ----
    app_name: str = "Delta Engine"
    app_version: str = "1.0.0"
    api_env: str = Field(default="development", alias="API_ENV")
    api_debug: bool = Field(default=True, alias="API_DEBUG")
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    api_cors_origins: str = Field(
        default="http://localhost:3000", alias="API_CORS_ORIGINS"
    )

    # ---- Supabase ----
    supabase_url: str = Field(..., alias="SUPABASE_URL")
    supabase_anon_key: str = Field(..., alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(..., alias="SUPABASE_JWT_SECRET")

    # ---- Encryption ----
    encryption_key: str = Field(..., alias="ENCRYPTION_KEY")

    # ---- Worker internal auth ----
    worker_api_key: str = Field(..., alias="WORKER_API_KEY")

    # ---- Stripe ----
    stripe_secret_key: str = Field(default="", alias="STRIPE_SECRET_KEY")
    stripe_webhook_secret: str = Field(default="", alias="STRIPE_WEBHOOK_SECRET")

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated CORS origins."""
        return [origin.strip() for origin in self.api_cors_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.api_env == "production"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — loaded once per process."""
    return Settings()
