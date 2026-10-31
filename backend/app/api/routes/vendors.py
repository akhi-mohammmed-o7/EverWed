"""
Royal Knot OS — Vendor API Routes.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Query, status

from app.schemas.common import APIResponse
from app.schemas.vendor import VendorCreate, VendorResponse, VendorUpdate
from app.services.vendor_service import VendorService

router = APIRouter(prefix="/api/v1/vendors", tags=["vendors"])


@router.get("", response_model=APIResponse[List[VendorResponse]])
async def list_vendors(
    category: Optional[str] = Query(None, description="Filter by category (Catering, Decor, Photography, Entertainment/DJ, etc.)"),
    city: Optional[str] = Query(None, description="Filter by city (Jaipur, Udaipur, etc.)"),
):
    """Retrieve verified vendor directory."""
    data = VendorService.list_vendors(category=category, city=city)
    return APIResponse(success=True, data=data)


@router.post("", response_model=APIResponse[VendorResponse], status_code=status.HTTP_201_CREATED)
async def create_vendor(payload: VendorCreate):
    """Register a new vendor."""
    data = VendorService.create_vendor(payload)
    return APIResponse(success=True, data=data)


@router.get("/{vendor_id}", response_model=APIResponse[VendorResponse])
async def get_vendor(vendor_id: str):
    """Retrieve details for a specific vendor."""
    data = VendorService.get_vendor(vendor_id)
    return APIResponse(success=True, data=data)


@router.patch("/{vendor_id}", response_model=APIResponse[VendorResponse])
async def update_vendor(vendor_id: str, payload: VendorUpdate):
    """Update vendor contact details or services."""
    data = VendorService.update_vendor(vendor_id, payload)
    return APIResponse(success=True, data=data)
