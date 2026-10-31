"""
Royal Knot OS — Centralised exception handlers for FastAPI.

Registers handlers that convert :class:`RoyalKnotException` (and its
subclasses) as well as unhandled ``Exception`` into uniform JSON responses.
"""

from __future__ import annotations

import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import RoyalKnotException

logger = logging.getLogger("royal_knot.error_handler")


async def _handle_royal_knot_exception(
    request: Request,
    exc: RoyalKnotException,
) -> JSONResponse:
    """Return a structured JSON error for known application exceptions."""
    logger.warning(
        "RoyalKnotException [%s] %s — %s %s",
        exc.error_code,
        exc.detail,
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "detail": None,
            },
        },
    )


async def _handle_unhandled_exception(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """
    Catch-all for unexpected errors.

    The full traceback is logged server-side but **never** sent to the client.
    """
    logger.error(
        "Unhandled exception on %s %s:\n%s",
        request.method,
        request.url.path,
        traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected internal error occurred",
                "detail": None,
            },
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Attach all custom exception handlers to the FastAPI application."""
    app.add_exception_handler(RoyalKnotException, _handle_royal_knot_exception)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _handle_unhandled_exception)  # type: ignore[arg-type]
