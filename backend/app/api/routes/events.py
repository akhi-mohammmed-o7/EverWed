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
    if payload.date < wedding["start_date"] or payload.date > wedding["end_date"]:
        raise RoyalKnotException(status_code=422, detail="Event date must fall within the wedding dates.", error_code="EVENT_DATE_OUT_OF_RANGE")
    if current_user.get("role") == "couple":
        # Couples create same-day functions. Agency staff may record an
        # overnight function whose end time falls after midnight.
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
    current_user: dict = Depends(require_role("admin", "planner", "couple")),
    __: dict = Depends(require_event_access),
):
    """Update event coordinator, venue hall, timing, or status.

    Couples may edit the functions they own, but the server keeps the recorded
    coordinator identity and validates dates and times against the wedding.
    """
    event = store.events.get(event_id)
    if not event:
        raise RoyalKnotException(status_code=404, detail="Event not found.", error_code="EVENT_NOT_FOUND")
    wedding = store.weddings.get(event["wedding_id"])
    if not wedding:
        raise RoyalKnotException(status_code=404, detail="Wedding not found.", error_code="WEDDING_NOT_FOUND")

    updates = payload.model_dump(exclude_unset=True)
    if current_user.get("role") == "couple":
        account = store.users.get(current_user.get("user_id"), {})
        updates["coordinator_name"] = account.get("name", "Couple")
        updates["coordinator_phone"] = account.get("phone")
        updates["guest_estimate"] = wedding.get("guest_estimate", event.get("guest_estimate"))
        if "status" in updates and updates["status"] not in {"scheduled", "in_progress", "completed", "delayed"}:
            raise RoyalKnotException(
                status_code=422,
                detail="Event status is not valid.",
                error_code="EVENT_STATUS_INVALID",
            )
    payload = EventUpdate(**updates)

    event_date = payload.date or event.get("date", "")
    if event_date < wedding.get("start_date", "") or event_date > wedding.get("end_date", ""):
        raise RoyalKnotException(
            status_code=422,
            detail="Event date must fall within the wedding dates.",
            error_code="EVENT_DATE_OUT_OF_RANGE",
        )
    start_time = payload.start_time or event.get("start_time", "")
    end_time = payload.end_time or event.get("end_time", "")
    if end_time <= start_time:
        raise RoyalKnotException(
            status_code=422,
            detail="Event end time must be after its start time.",
            error_code="EVENT_TIME_INVALID",
        )

    data = EventService.update_event(event_id, payload)
    return APIResponse(success=True, data=data)


@router.delete("/api/v1/events/{event_id}", response_model=APIResponse)
async def delete_event(
    event_id: str,
    _: dict = Depends(require_role("admin", "planner", "couple")),
    __: dict = Depends(require_event_access),
):
    """Delete a function; its generated preparation tasks are removed with it."""
    EventService.delete_event(event_id)
    return APIResponse(success=True, data={"deleted": True})

