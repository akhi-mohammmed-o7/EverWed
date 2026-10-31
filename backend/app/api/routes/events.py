"""
Royal Knot OS — Event API Routes.
"""

from __future__ import annotations

from typing import List
from fastapi import APIRouter, status

from app.schemas.common import APIResponse
from app.schemas.wedding import EventCreate, EventResponse, EventUpdate
from app.services.event_service import EventService

router = APIRouter(tags=["events"])


@router.post("/api/v1/weddings/{wedding_id}/events", response_model=APIResponse[EventResponse], status_code=status.HTTP_201_CREATED)
async def create_event(wedding_id: str, payload: EventCreate):
    """Create a new event (e.g. Mehendi, Sangeet, Ceremony, Reception) under a wedding."""
    data = EventService.create_event(wedding_id, payload)
    return APIResponse(success=True, data=data)


@router.get("/api/v1/weddings/{wedding_id}/events", response_model=APIResponse[List[EventResponse]])
async def list_events_for_wedding(wedding_id: str):
    """Retrieve all chronological events belonging to a wedding."""
    data = EventService.list_events_for_wedding(wedding_id)
    return APIResponse(success=True, data=data)


@router.get("/api/v1/events/{event_id}", response_model=APIResponse[EventResponse])
async def get_event(event_id: str):
    """Retrieve details for a specific event."""
    data = EventService.get_event(event_id)
    return APIResponse(success=True, data=data)


@router.patch("/api/v1/events/{event_id}", response_model=APIResponse[EventResponse])
async def update_event(event_id: str, payload: EventUpdate):
    """Update event coordinator, venue hall, timing, or status."""
    data = EventService.update_event(event_id, payload)
    return APIResponse(success=True, data=data)

