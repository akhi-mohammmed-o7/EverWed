"""
Royal Knot OS — Event Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List

from app.core.config import get_settings
from app.core.exceptions import OdooRecordNotFound, RoyalKnotException
from app.integrations.odoo.client import get_odoo_client
from app.schemas.wedding import EventCreate, EventResponse, EventUpdate
from app.services.plan_service import generate_event_tasks
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
            # Every selected function gets its own preparation tasks. The
            # generator skips a function that already has them, so retries and
            # later edits never duplicate or overwrite manual tasks.
            generate_event_tasks(wedding_id, event_id)
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
    def delete_event(event_id: str) -> None:
        """Remove a function while preserving unrelated planning records.

        Generated preparation tasks for this function are removed with it. A
        manually added task is kept but unlinked so it does not become an
        orphaned reference. Day-of operational records block the delete rather
        than silently disappearing.
        """
        event = store.events.get(event_id)
        if not event:
            raise OdooRecordNotFound(detail=f"Event with ID '{event_id}' not found")

        blocking = [
            item for collection in (store.schedules, store.vendor_arrivals, store.operational_issues)
            for item in collection.values()
            if item.get("event_id") == event_id
        ]
        if blocking:
            raise RoyalKnotException(
                status_code=409,
                detail="This function still has day-of schedule, arrival or issue records. Remove those first.",
                error_code="EVENT_STILL_IN_USE",
            )

        with store.transaction(immediate=True):
            now = datetime.now(timezone.utc)
            for task in store.tasks.values():
                if task.get("event_id") != event_id:
                    continue
                if task.get("generated_from_plan"):
                    del store.tasks[task["id"]]
                else:
                    task["event_id"] = None
                    task["updated_at"] = now
                    store.tasks[task["id"]] = task
            for quote in store.quotes.values():
                if quote.get("event_id") == event_id:
                    quote["event_id"] = None
                    quote["updated_at"] = now
                    store.quotes[quote["id"]] = quote
            del store.events[event_id]
            wedding = store.weddings.get(event["wedding_id"])
            if wedding:
                wedding["events_count"] = sum(
                    1 for item in store.events.values()
                    if item.get("wedding_id") == wedding["id"]
                )
                wedding["updated_at"] = now
                store.weddings[wedding["id"]] = wedding

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

