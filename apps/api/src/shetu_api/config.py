"""Application settings, read from environment variables prefixed with SHETU_."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

API_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SHETU_", env_file=".env", extra="ignore")

    environment: Literal["local", "test", "production"] = "local"
    database_url: str = f"sqlite:///{API_ROOT / 'shetu.db'}"
    cors_origins: list[str] = ["http://localhost:3000"]

    # AI provider. "replay" serves recorded replies and never calls a network model.
    ai_provider: Literal["gemini", "anthropic", "replay"] = "replay"
    ai_record: bool = False
    replay_dir: Path = API_ROOT / "fixtures" / "replay"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5-5"

    seed_on_startup: bool = True

    @field_validator("database_url")
    @classmethod
    def _use_psycopg_driver(cls, value: str) -> str:
        # Managed Postgres providers hand out postgres:// or postgresql:// URLs.
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value.removeprefix(prefix)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
