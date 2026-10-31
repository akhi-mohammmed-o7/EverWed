"""
Royal Knot OS — Enquiry API Routes.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import require_role
from app.schemas.common import APIResponse
from app.schemas.enquiry import ConvertEnquiryRequest, EnquiryCreate, EnquiryResponse, EnquiryUpdate
from app.services.enquiry_service import EnquiryService

router = APIRouter(prefix="/api/v1/enquiries", tags=["enquiries"])


@router.post("", response_model=APIResponse[EnquiryResponse], status_code=status.HTTP_201_CREATED)
async def create_enquiry(payload: EnquiryCreate):
    """Capture a new couple enquiry with wedding requirements and guest count."""
    data = EnquiryService.create_enquiry(payload)
    return APIResponse(success=True, data=data)


@router.get("", response_model=APIResponse[List[EnquiryResponse]])
async def list_enquiries(
    status: Optional[str] = Query(None, description="Filter by status"),
    _: dict = Depends(require_role("admin")),
):
    """List and search enquiries."""
    data = EnquiryService.list_enquiries(status=status)
    return APIResponse(success=True, data=data)


@router.get("/{enquiry_id}", response_model=APIResponse[EnquiryResponse])
async def get_enquiry(enquiry_id: str, _: dict = Depends(require_role("admin"))):
    """Retrieve details of an enquiry including meetings."""
    data = EnquiryService.get_enquiry(enquiry_id)
    return APIResponse(success=True, data=data)


@router.patch("/{enquiry_id}", response_model=APIResponse[EnquiryResponse])
async def update_enquiry(
    enquiry_id: str,
    payload: EnquiryUpdate,
    _: dict = Depends(require_role("admin")),
):
    """Update enquiry status, record meeting details, or attach signed agreement."""
    data = EnquiryService.update_enquiry(enquiry_id, payload)
    return APIResponse(success=True, data=data)


@router.post("/{enquiry_id}/convert", response_model=APIResponse)
async def convert_enquiry_to_wedding(
    enquiry_id: str,
    payload: ConvertEnquiryRequest,
    _: dict = Depends(require_role("admin")),
):
    """Convert an eligible enquiry; task planning begins after the booking deposit."""
    data = EnquiryService.convert_to_wedding(enquiry_id, payload)
    return APIResponse(success=True, data=data)

