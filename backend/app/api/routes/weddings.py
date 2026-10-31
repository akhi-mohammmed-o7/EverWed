"""
Royal Knot OS — Wedding API Routes.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Query, status

from app.schemas.common import APIResponse
from app.schemas.wedding import WeddingCreate, WeddingResponse, WeddingUpdate
from app.services.wedding_service import WeddingService

router = APIRouter(prefix="/api/v1/weddings", tags=["weddings"])


@router.post("", response_model=APIResponse[WeddingResponse], status_code=status.HTTP_201_CREATED)
async def create_wedding(payload: WeddingCreate):
    """Create a new luxury wedding record."""
    data = WeddingService.create_wedding(payload)
    return APIResponse(success=True, data=data)


@router.get("", response_model=APIResponse[List[WeddingResponse]])
async def list_weddings(status: Optional[str] = Query(None, description="Filter by status (planning, in_progress, completed)")):
    """List all weddings with dynamic metrics."""
    data = WeddingService.list_weddings(status=status)
    return APIResponse(success=True, data=data)


@router.get("/{wedding_id}", response_model=APIResponse[WeddingResponse])
async def get_wedding(wedding_id: str):
    """Retrieve wedding details with live summary counts."""
    data = WeddingService.get_wedding(wedding_id)
    return APIResponse(success=True, data=data)


@router.patch("/{wedding_id}", response_model=APIResponse[WeddingResponse])
async def update_wedding(wedding_id: str, payload: WeddingUpdate):
    """Update wedding specifications or status."""
    data = WeddingService.update_wedding(wedding_id, payload)
    return APIResponse(success=True, data=data)
