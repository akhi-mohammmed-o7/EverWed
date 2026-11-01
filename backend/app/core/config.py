"""
EverWed OS — Application configuration.

Uses pydantic-settings to load from environment variables / .env file.
All secrets (passwords, keys) are read from env vars — never hardcoded.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Odoo Connection ──────────────────────────────────────────────
    odoo_url: str = "http://localhost:8069"
    # Keep Odoo opt-in: local/demo workflows should not repeatedly attempt
    # connections using placeholder administrator credentials.
    odoo_db: str = ""
    odoo_username: str = ""
    odoo_password: str = ""

    # ── Application ──────────────────────────────────────────────────
    app_name: str = "EverWed OS"
    app_version: str = "0.1.0"
    secret_key: str = "change-this-to-a-random-secret-key"
    debug: bool = True

    # ── CORS ─────────────────────────────────────────────────────────
    cors_origins: List[str] = ["http://localhost:5173"]

    # Local-first persistent application database confirmed by the project
    # requirements document. Relative paths resolve from the backend folder.
    database_path: str = "data/everwed.sqlite3"
    database_busy_timeout_ms: int = 5000
    session_ttl_minutes: int = 480
    seed_demo_data_on_startup: bool = False

    # Razorpay credentials are optional in development. Online payment
    # collection remains unavailable until API and webhook secrets are set.
    razorpay_key_id: str = ""
    razorpay_key_secret: SecretStr = SecretStr("")
    razorpay_webhook_secret: SecretStr = SecretStr("")
    razorpay_api_timeout_seconds: float = 10.0

    # ── Timeouts ─────────────────────────────────────────────────────
    odoo_timeout: int = 10  # seconds for XML-RPC calls

    # ── Validators ───────────────────────────────────────────────────

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v: object) -> List[str]:
        """Accept a JSON array string *or* an actual list."""
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, TypeError):
                # Treat comma-separated string as fallback
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # type: ignore[return-value]

    @field_validator("debug", mode="before")
    @classmethod
    def _parse_debug_mode(cls, value: object) -> object:
        """Accept common deployment labels as well as boolean values."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"production", "prod", "release"}:
                return False
            if normalized in {"development", "dev"}:
                return True
        return value

    # ── Helpers ──────────────────────────────────────────────────────

    @property
    def odoo_configured(self) -> bool:
        """Return ``True`` only when every Odoo connection value is supplied."""
        return all([
            self.odoo_url,
            self.odoo_db,
            self.odoo_username,
            self.odoo_password,
        ])

    @property
    def razorpay_configured(self) -> bool:
        return bool(
            self.razorpay_key_id.strip()
            and self.razorpay_key_secret.get_secret_value()
            and self.razorpay_webhook_secret.get_secret_value()
        )


@lru_cache
def get_settings() -> Settings:
    """Return a cached :class:`Settings` singleton."""
    return Settings()
