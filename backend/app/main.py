"""
Royal Knot OS — FastAPI Application Entry Point.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.middleware.error_handler import register_exception_handlers

# ── Logging ──────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

logger = logging.getLogger("royal_knot")


# ── Application factory ─────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan context manager for startup and shutdown events."""
    settings = get_settings()
    logger.info(
        "Starting %s v%s | debug=%s | odoo_url=%s | odoo_db=%s",
        settings.app_name,
        settings.app_version,
        settings.debug,
        settings.odoo_url,
        settings.odoo_db,
    )
    if not settings.odoo_configured:
        logger.warning(
            "Odoo connection is NOT fully configured in .env — running with local authoritative state hub."
        )
    yield


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Unified Wedding Management Platform for The Royal Knot luxury agency — Jaipur & Udaipur.",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ───────────────────────────────────────────
    register_exception_handlers(application)

    # ── Routers ──────────────────────────────────────────────────────
    from app.api.routes.health import router as health_router
    from app.api.routes.auth import router as auth_router
    from app.api.routes.enquiries import router as enquiries_router
    from app.api.routes.weddings import router as weddings_router
    from app.api.routes.events import router as events_router
    from app.api.routes.vendors import router as vendors_router
    from app.api.routes.quotes import router as quotes_router
    from app.api.routes.tasks import router as tasks_router
    from app.api.routes.operations import router as operations_router
    from app.api.routes.finance import router as finance_router
    from app.api.routes.dashboard import router as dashboard_router

    application.include_router(health_router)
    application.include_router(auth_router)
    application.include_router(enquiries_router)
    application.include_router(weddings_router)
    application.include_router(events_router)
    application.include_router(vendors_router)
    application.include_router(quotes_router)
    application.include_router(tasks_router)
    application.include_router(operations_router)
    application.include_router(finance_router)
    application.include_router(dashboard_router)

    # ── Demo Seeder Endpoint ─────────────────────────────────────────
    from app.schemas.common import APIResponse
    from app.services.seed import seed_demo_data

    @application.post("/api/v1/demo/seed", response_model=APIResponse, tags=["demo"])
    async def seed_data():
        """Populate realistic luxury wedding demonstration data for The Royal Knot."""
        res = seed_demo_data()
        return APIResponse(success=True, data=res)

    return application


app = create_app()
