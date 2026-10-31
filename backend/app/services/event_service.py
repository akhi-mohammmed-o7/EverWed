"""
Royal Knot OS — Event Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List

from app.core.config import get_settings
from app.core.exceptions import OdooRecordNotFound
from app.integrations.odoo.client import get_odoo_client
from app.schemas.wedding import EventCreate, EventResponse, EventUpdate
from app.services.store import store

logger = logging.getLogger("royal_knot.event_service")


class EventService:
    @staticmethod
    def create_event(wedding_id: str, payload: EventCreate) -> EventResponse:
        wedding = store.weddings.get(wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Parent Wedding '{wedding_id}' does not exist")

        event_id = f"evt-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # Odoo Task/Sub-project sync if configured
        odoo_task_id = None
        settings = get_settings()
        if settings.odoo_configured and wedding.get("odoo_project_id"):
            try:
                client = get_odoo_client()
                client.authenticate()
                task_vals = {
                    "name": f"Event: {payload.name} ({payload.date})",
                    "project_id": wedding["odoo_project_id"],
                    "description": f"Venue: {payload.venue_hall} | Coordinator: {payload.coordinator_name}",
                }
                odoo_task_id = client.create("project.task", task_vals)
            except Exception as exc:
                logger.warning("Could not sync event to Odoo task: %s", exc)

        data = {
            "id": event_id,
            "wedding_id": wedding_id,
            "name": payload.name,
            "date": payload.date,
            "start_time": payload.start_time,
            "end_time": payload.end_time,
            "venue_hall": payload.venue_hall,
            "coordinator_name": payload.coordinator_name,
            "coordinator_phone": payload.coordinator_phone,
            "guest_estimate": payload.guest_estimate,
            "status": "scheduled",
            "notes": payload.notes,
            "odoo_task_id": odoo_task_id,
            "created_at": now,
            "updated_at": now,
        }
        with store.transaction():
            store.events[event_id] = data
            wedding["events_count"] = sum(
                1 for e in store.events.values() if e.get("wedding_id") == wedding_id
            )
            store.weddings[wedding_id] = wedding
        return EventResponse(**data)

    @staticmethod
    def list_events_for_wedding(wedding_id: str) -> List[EventResponse]:
        wedding = store.weddings.get(wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Parent Wedding '{wedding_id}' does not exist")

        results = [
            EventResponse(**e) for e in store.events.values()
            if e.get("wedding_id") == wedding_id
        ]
        # Sort chronologically by date and start_time
        results.sort(key=lambda x: (x.date, x.start_time))
        return results

    @staticmethod
    def get_event(event_id: str) -> EventResponse:
        data = store.events.get(event_id)
        if not data:
            raise OdooRecordNotFound(detail=f"Event with ID '{event_id}' not found")
        return EventResponse(**data)

    @staticmethod
    def update_event(event_id: str, payload: EventUpdate) -> EventResponse:
        data = store.events.get(event_id)
        if not data:
            raise OdooRecordNotFound(detail=f"Event with ID '{event_id}' not found")

        now = datetime.now(timezone.utc)
        for field, val in payload.model_dump(exclude_unset=True).items():
            data[field] = val
        data["updated_at"] = now
        store.events[event_id] = data
        return EventResponse(**data)

