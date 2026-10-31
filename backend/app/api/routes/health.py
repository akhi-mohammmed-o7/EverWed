"""
Royal Knot OS — Health-check route.

Public endpoint (no authentication required) used by load-balancers,
monitoring tools, and the front-end to verify the API and Odoo are alive.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings
from app.integrations.odoo.client import get_odoo_client
from app.schemas.common import HealthResponse
from app.services.store import store

logger = logging.getLogger("royal_knot.health")

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Return the current health status of the API.

    If Odoo is configured the endpoint also probes Odoo connectivity and
    reports the Odoo server version.  Connection failures are caught
    gracefully — the endpoint still returns ``200`` but with
    ``odoo_connected=false``.
    """
    settings = get_settings()
    database_connected = False
    try:
        database_connected = store.ping()
    except Exception as exc:
        logger.error("SQLite health probe failed: %s", exc)

    odoo_connected = False
    odoo_version: str | None = None

    if settings.odoo_configured:
        try:
            client = get_odoo_client()
            version_info = client.check_connection()
            odoo_connected = True
            odoo_version = version_info.get("server_version")
        except Exception as exc:
            logger.warning("Odoo health probe failed: %s", exc)

    return HealthResponse(
        status="healthy" if database_connected else "unhealthy",
        version=settings.app_version,
        database_connected=database_connected,
        odoo_connected=odoo_connected,
        odoo_version=odoo_version,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
