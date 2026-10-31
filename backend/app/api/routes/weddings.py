"""
Royal Knot OS — Wedding API Routes.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import can_access_wedding, get_current_user, require_role, require_wedding_access
from app.core.exceptions import PermissionDeniedError, RoyalKnotException
from app.schemas.common import APIResponse
from app.schemas.wedding import CoupleWeddingOnboarding, WeddingCreate, WeddingPlannerAssignment, WeddingResponse, WeddingUpdate
from app.services.wedding_service import WeddingService
from app.services.store import store

router = APIRouter(prefix="/api/v1/weddings", tags=["weddings"])


@router.post("/onboarding", response_model=APIResponse[WeddingResponse], status_code=status.HTTP_201_CREATED)
async def couple_onboarding(
    payload: CoupleWeddingOnboarding,
    current_user: dict = Depends(require_role("couple")),
):
    """Create and link the authenticated couple's first wedding workspace."""
    account = store.users.get(current_user["user_id"])
    if not account or account.get("wedding_id"):
        raise PermissionDeniedError("This account already has a wedding workspace")
    partner_one = account.get("partner_one_name")
    partner_two = account.get("partner_two_name")
    if not partner_one or not partner_two or not account.get("phone"):
        raise RoyalKnotException(
            status_code=422,
            detail="Complete couple names and phone number before wedding setup.",
            error_code="COUPLE_PROFILE_INCOMPLETE",
        )
    wedding = WeddingCreate(
        title=f"{partner_one} & {partner_two}",
        bride_name=partner_one,
        groom_name=partner_two,
        contact_phone=account["phone"],
        contact_email=account["email"],
        destination=payload.destination,
        primary_venue=payload.primary_venue,
        package_type="Couple planned",
        guest_estimate=payload.guest_estimate,
        theme=payload.theme,
        budget_allocated=payload.budget_allocated,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    functions = [item.model_dump() for item in payload.functions]
    if any(item["date"] < payload.start_date or item["date"] > payload.end_date for item in functions):
        raise RoyalKnotException(status_code=422, detail="Each function date must fall within the wedding dates.", error_code="FUNCTION_DATE_OUT_OF_RANGE")
    data = WeddingService.create_wedding(
        wedding, couple_user_id=account["id"], tradition=payload.tradition.strip() or None,
        regional_customization=payload.regional_customization.strip() or None, functions=functions,
    )
    return APIResponse(success=True, data=data)


@router.post("/{wedding_id}/planner-assignment", response_model=APIResponse[WeddingResponse])
async def assign_planner(
    wedding_id: str,
    payload: WeddingPlannerAssignment,
    _: dict = Depends(require_role("admin")),
):
    """Assign an active planner account to a wedding; only Founders can change ownership."""
    data = WeddingService.assign_planner(wedding_id, payload.planner_email)
    return APIResponse(success=True, data=data)


@router.post("", response_model=APIResponse[WeddingResponse], status_code=status.HTTP_201_CREATED)
async def create_wedding(payload: WeddingCreate, _: dict = Depends(require_role("admin", "planner"))):
    """Create a new luxury wedding record."""
    data = WeddingService.create_wedding(payload)
    return APIResponse(success=True, data=data)


@router.get("", response_model=APIResponse[List[WeddingResponse]])
async def list_weddings(
    status: Optional[str] = Query(None, description="Filter by status (planning, in_progress, completed)"),
    current_user: dict = Depends(get_current_user),
):
    """List all weddings with dynamic metrics."""
    data = [
        wedding for wedding in WeddingService.list_weddings(status=status)
        if can_access_wedding(current_user, wedding.id)
    ]
    return APIResponse(success=True, data=data)


@router.get("/{wedding_id}", response_model=APIResponse[WeddingResponse])
async def get_wedding(wedding_id: str, _: dict = Depends(require_wedding_access)):
    """Retrieve wedding details with live summary counts."""
    data = WeddingService.get_wedding(wedding_id)
    return APIResponse(success=True, data=data)


@router.patch("/{wedding_id}", response_model=APIResponse[WeddingResponse])
async def update_wedding(
    wedding_id: str,
    payload: WeddingUpdate,
    _: dict = Depends(require_role("admin", "planner")),
    __: dict = Depends(require_wedding_access),
):
    """Update wedding specifications or status."""
    data = WeddingService.update_wedding(wedding_id, payload)
    return APIResponse(success=True, data=data)

