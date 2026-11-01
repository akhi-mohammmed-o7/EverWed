"""
Royal Knot OS — Wedding API Routes.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import can_access_wedding, ensure_wedding_access, get_current_user, require_role, require_wedding_access
from app.core.exceptions import PermissionDeniedError, RoyalKnotException
from app.schemas.common import APIResponse
from app.schemas.wedding import CoupleWeddingOnboarding, PlannerDirectoryEntry, WeddingCreate, WeddingPlannerAssignment, WeddingPlannerSelection, WeddingResponse, WeddingUpdate
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
    partner_one = (payload.partner_one_name or account.get("partner_one_name") or "").strip()
    partner_two = (payload.partner_two_name or account.get("partner_two_name") or "").strip()
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
    account["partner_one_name"] = partner_one
    account["partner_two_name"] = partner_two
    account["name"] = f"{partner_one} & {partner_two}"
    store.users[account["id"]] = account
    data = WeddingService.create_wedding(
        wedding, couple_user_id=account["id"], tradition=payload.tradition.strip() or None,
        regional_customization=payload.regional_customization.strip() or None, functions=functions,
        preferred_planner_uid=payload.preferred_planner_uid,
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


@router.patch("/{wedding_id}/planner-selection", response_model=APIResponse[WeddingResponse])
async def couple_select_planner(
    wedding_id: str,
    payload: WeddingPlannerSelection,
    current_user: dict = Depends(require_role("couple")),
):
    """Let a couple choose an active Planner for their own wedding."""
    ensure_wedding_access(current_user, wedding_id)
    data = WeddingService.assign_planner_by_uid(wedding_id, payload.planner_uid)
    return APIResponse(success=True, data=data)


@router.post("", response_model=APIResponse[WeddingResponse], status_code=status.HTTP_201_CREATED)
async def create_wedding(payload: WeddingCreate, current_user: dict = Depends(require_role("admin", "planner"))):
    """Create a new luxury wedding record."""
    data = WeddingService.create_wedding(payload, creator_user=current_user)
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


@router.get("/planners", response_model=APIResponse[List[PlannerDirectoryEntry]])
async def list_planner_directory(
    _: dict = Depends(require_role("couple")),
):
    """Return only public profile details for available, approved Planners."""
    planners = sorted(
        WeddingService._active_planners(),
        key=lambda planner: (planner.get("name", "").casefold(), int(planner.get("uid", 0))),
    )
    data = [PlannerDirectoryEntry(
        uid=int(planner["uid"]),
        name=planner["name"],
        bio=planner.get("planner_bio", ""),
        specialties=planner.get("planner_specialties", []),
        destinations=planner.get("planner_destinations", []),
        languages=planner.get("planner_languages", []),
    ) for planner in planners]
    return APIResponse(success=True, data=data)


@router.get("/{wedding_id}", response_model=APIResponse[WeddingResponse])
async def get_wedding(wedding_id: str, _: dict = Depends(require_wedding_access)):
    """Retrieve wedding details with live summary counts."""
    data = WeddingService.get_wedding(wedding_id)
    return APIResponse(success=True, data=data)


COUPLE_EDITABLE_WEDDING_FIELDS = {
    "title",
    "bride_name",
    "groom_name",
    "destination",
    "primary_venue",
    "guest_estimate",
    "theme",
    "budget_allocated",
    "start_date",
    "end_date",
    "tradition",
    "regional_customization",
}


@router.patch("/{wedding_id}", response_model=APIResponse[WeddingResponse])
async def update_wedding(
    wedding_id: str,
    payload: WeddingUpdate,
    current_user: dict = Depends(require_role("admin", "planner", "couple")),
    __: dict = Depends(require_wedding_access),
):
    """Update wedding specifications, traditions, or status.

    Couples can maintain their own workspace preferences. Contract value and
    lifecycle status remain agency-controlled fields.
    """
    if current_user.get("role") == "couple":
        disallowed = set(payload.model_dump(exclude_unset=True)) - COUPLE_EDITABLE_WEDDING_FIELDS
        if disallowed:
            raise PermissionDeniedError(
                "Couples can update wedding details and preferences only; contact your planner for contract changes."
            )
    data = WeddingService.update_wedding(wedding_id, payload)
    return APIResponse(success=True, data=data)

