"""
Royal Knot OS — FastAPI Application Entry Point.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
            "Odoo is not configured; local-first SQLite storage is active."
        )

    from app.services.store import store
    from app.services.seed import seed_demo_data

    if not store.ping():
        raise RuntimeError("The configured SQLite database failed its startup ping")
    if settings.seed_demo_data_on_startup:
        seed_result = seed_demo_data()
        logger.info("EverWed demo data status: %s", seed_result.get("message"))
    else:
        logger.info("Startup demo seeding is disabled; stored application data was preserved")

    try:
        yield
    finally:
        store.close()


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title="EverWed OS API",
        version=settings.app_version,
        description="Unified Wedding Management Platform for EverWed luxury agency — Jaipur & Udaipur.",
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

    @application.middleware("http")
    async def verify_cookie_request_origin(request, call_next):
        """Reject cross-origin state changes made with a browser session cookie."""
        if request.method not in {"GET", "HEAD", "OPTIONS"} and request.cookies.get("everwed_session"):
            origin = request.headers.get("origin")
            allowed = {value.rstrip("/") for value in settings.cors_origins}
            if origin and origin.rstrip("/") not in allowed:
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "error": {
                            "code": "CSRF_ORIGIN_REJECTED",
                            "message": "Request origin is not allowed.",
                            "detail": "",
                        },
                    },
                )
        return await call_next(request)

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
    from app.api.routes.guests import router as guests_router

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
    application.include_router(guests_router)

    # ── Demo Seeder Endpoint ─────────────────────────────────────────
    from app.schemas.common import APIResponse
    from app.services.seed import seed_demo_data
    from app.api.dependencies import require_role

    @application.post("/api/v1/demo/seed", response_model=APIResponse, tags=["demo"])
    async def seed_data(_: dict = Depends(require_role("admin"))):
        """Populate realistic luxury wedding demonstration data for The Royal Knot."""
        res = seed_demo_data()
        return APIResponse(success=True, data=res)

    return application


app = create_app()
