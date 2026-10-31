"""
Royal Knot OS — Event API Routes.
"""

from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, status

from app.api.dependencies import require_event_access, require_role, require_wedding_access
from app.core.exceptions import RoyalKnotException
from app.schemas.common import APIResponse
from app.schemas.wedding import EventCreate, EventResponse, EventUpdate
from app.services.event_service import EventService
from app.services.store import store

router = APIRouter(tags=["events"])


@router.post("/api/v1/weddings/{wedding_id}/events", response_model=APIResponse[EventResponse], status_code=status.HTTP_201_CREATED)
async def create_event(
    wedding_id: str,
    payload: EventCreate,
    current_user: dict = Depends(require_role("admin", "planner", "couple")),
    wedding: dict = Depends(require_wedding_access),
):
    """Create a new event (e.g. Mehendi, Sangeet, Ceremony, Reception) under a wedding."""
    if current_user.get("role") == "couple":
        if payload.date < wedding["start_date"] or payload.date > wedding["end_date"]:
            raise RoyalKnotException(status_code=422, detail="Event date must fall within the wedding dates.", error_code="EVENT_DATE_OUT_OF_RANGE")
        if payload.end_time <= payload.start_time:
            raise RoyalKnotException(status_code=422, detail="Event end time must be after its start time.", error_code="EVENT_TIME_INVALID")
        account = store.users.get(current_user.get("user_id"), {})
        payload = payload.model_copy(update={
            "coordinator_name": account.get("name", "Couple"),
            "coordinator_phone": account.get("phone"),
            "guest_estimate": wedding["guest_estimate"],
        })
    data = EventService.create_event(wedding_id, payload)
    return APIResponse(success=True, data=data)


@router.get("/api/v1/weddings/{wedding_id}/events", response_model=APIResponse[List[EventResponse]])
async def list_events_for_wedding(wedding_id: str, _: dict = Depends(require_wedding_access)):
    """Retrieve all chronological events belonging to a wedding."""
    data = EventService.list_events_for_wedding(wedding_id)
    return APIResponse(success=True, data=data)


@router.get("/api/v1/events/{event_id}", response_model=APIResponse[EventResponse])
async def get_event(event_id: str, _: dict = Depends(require_event_access)):
    """Retrieve details for a specific event."""
    data = EventService.get_event(event_id)
    return APIResponse(success=True, data=data)


@router.patch("/api/v1/events/{event_id}", response_model=APIResponse[EventResponse])
async def update_event(
    event_id: str,
    payload: EventUpdate,
    _: dict = Depends(require_role("admin", "planner")),
    __: dict = Depends(require_event_access),
):
    """Update event coordinator, venue hall, timing, or status."""
    data = EventService.update_event(event_id, payload)
    return APIResponse(success=True, data=data)

