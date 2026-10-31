"""
Royal Knot OS — Application configuration.

Uses pydantic-settings to load from environment variables / .env file.
All secrets (passwords, keys) are read from env vars — never hardcoded.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import List

from pydantic import field_validator
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
    odoo_db: str = "royal_knot"
    odoo_username: str = "admin"
    odoo_password: str = "admin"

    # ── Application ──────────────────────────────────────────────────
    app_name: str = "Royal Knot OS"
    app_version: str = "0.1.0"
    secret_key: str = "change-this-to-a-random-secret-key"
    debug: bool = True

    # ── CORS ─────────────────────────────────────────────────────────
    cors_origins: List[str] = ["http://localhost:5173"]

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

    # ── Helpers ──────────────────────────────────────────────────────

    @property
    def odoo_configured(self) -> bool:
        """Return ``True`` if all four Odoo connection params are non-empty."""
        return all([
            self.odoo_url,
            self.odoo_db,
            self.odoo_username,
            self.odoo_password,
        ])


@lru_cache
def get_settings() -> Settings:
    """Return a cached :class:`Settings` singleton."""
    return Settings()
