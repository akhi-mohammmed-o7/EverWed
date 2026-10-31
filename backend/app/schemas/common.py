"""
Royal Knot OS — Common response / request schemas.

These Pydantic v2 models provide a uniform API envelope used by every endpoint.
Currency throughout the platform is INR.
"""

from __future__ import annotations

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Structured error information."""

    code: str
    message: str
    detail: Optional[str] = None


class APIResponse(BaseModel, Generic[T]):
    """Generic API response wrapper."""

    success: bool
    data: Optional[T] = None
    error: Optional[dict] = None


class PaginatedResponse(APIResponse):
    """API response with pagination metadata."""

    total: int = 0
    page: int = 1
    page_size: int = 20
    pages: int = 0


class HealthResponse(BaseModel):
    """Response for the ``/health`` endpoint."""

    status: str
    version: str
    odoo_connected: bool
    odoo_version: Optional[str] = None
    timestamp: str
