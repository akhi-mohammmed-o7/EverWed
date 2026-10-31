from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.dependencies import ensure_wedding_access, require_role, require_wedding_access
from app.schemas.common import APIResponse
from app.schemas.guest import GuestCreate, GuestImportRequest, GuestImportResult, GuestResponse, GuestUpdate
from app.services.guest_service import GuestService

router = APIRouter(tags=["guests"])


@router.get("/api/v1/weddings/{wedding_id}/guests", response_model=APIResponse[list[GuestResponse]])
async def list_guests(wedding_id: str, _: dict = Depends(require_wedding_access)):
    return APIResponse(success=True, data=GuestService.list_for_wedding(wedding_id))


@router.post("/api/v1/weddings/{wedding_id}/guests", response_model=APIResponse[GuestResponse], status_code=status.HTTP_201_CREATED)
async def create_guest(
    wedding_id: str,
    payload: GuestCreate,
    user: dict = Depends(require_role("admin", "planner", "couple")),
):
    ensure_wedding_access(user, wedding_id)
    return APIResponse(success=True, data=GuestService.create(wedding_id, payload))


@router.post(
    "/api/v1/weddings/{wedding_id}/guests/import",
    response_model=APIResponse[GuestImportResult],
)
async def import_guests(
    wedding_id: str,
    payload: GuestImportRequest,
    user: dict = Depends(require_role("admin", "planner", "couple")),
):
    """Bulk import guests from CSV text; duplicates and invalid rows are reported."""
    ensure_wedding_access(user, wedding_id)
    return APIResponse(success=True, data=GuestService.import_csv(wedding_id, payload.csv))


@router.patch("/api/v1/guests/{guest_id}", response_model=APIResponse[GuestResponse])
async def update_guest(
    guest_id: str,
    payload: GuestUpdate,
    user: dict = Depends(require_role("admin", "planner", "couple")),
):
    current = GuestService.get(guest_id)
    ensure_wedding_access(user, current["wedding_id"])
    return APIResponse(success=True, data=GuestService.update(guest_id, payload))


@router.delete("/api/v1/guests/{guest_id}", response_model=APIResponse)
async def delete_guest(
    guest_id: str,
    user: dict = Depends(require_role("admin", "planner", "couple")),
):
    current = GuestService.get(guest_id)
    ensure_wedding_access(user, current["wedding_id"])
    GuestService.delete(guest_id)
    return APIResponse(success=True, data={"deleted": True})
