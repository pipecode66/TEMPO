from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Tempo API"
    environment: str = "development"
    debug: bool = False
    api_prefix: str = "/v1"
    database_url: str = "sqlite:///./tempo.db"
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://127.0.0.1:3000", "http://localhost:3000"]
    )

    jwt_secret_key: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    access_cookie_name: str = "tempo_access_token"
    refresh_cookie_name: str = "tempo_refresh_token"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    rate_limit_window_seconds: int = 60
    rate_limit_requests: int = 120

    seed_company_name: str = "Tempo Demo SAS"
    seed_company_nit: str = "900000001-1"
    seed_admin_name: str = "Administrador Tempo"
    seed_admin_email: str = "admin@empresa.com"
    seed_admin_password: str = "Admin123!"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if not value:
            return []
        return [item.strip() for item in value.split(",") if item.strip()]

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug_flag(cls, value: object) -> bool:
        if isinstance(value, bool):
            return value
        normalized = str(value or "").strip().lower()
        return normalized in {"1", "true", "yes", "on", "debug", "development"}

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> str:
        database_url = str(value or "").strip()
        if not database_url:
            return "sqlite:///./tempo.db"

        if database_url.startswith("postgres://"):
            return database_url.replace("postgres://", "postgresql+psycopg://", 1)

        if database_url.startswith("postgresql://"):
            return database_url.replace("postgresql://", "postgresql+psycopg://", 1)

        return database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
