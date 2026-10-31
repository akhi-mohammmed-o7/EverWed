from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.core.exceptions import OdooRecordNotFound
from app.schemas.guest import GuestCreate, GuestResponse, GuestUpdate
from app.services.store import store


class GuestService:
    @staticmethod
    def get(guest_id: str) -> dict:
        guest = store.guests.get(guest_id)
        if not guest:
            raise OdooRecordNotFound(detail=f"Guest '{guest_id}' not found")
        return guest

    @staticmethod
    def list_for_wedding(wedding_id: str) -> list[GuestResponse]:
        return [
            GuestResponse(**guest)
            for guest in store.guests.values()
            if guest.get("wedding_id") == wedding_id
        ]

    @staticmethod
    def create(wedding_id: str, payload: GuestCreate) -> GuestResponse:
        if wedding_id not in store.weddings:
            raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' not found")
        now = datetime.now(timezone.utc)
        data = {
            "id": f"guest-{uuid.uuid4().hex[:10]}",
            "wedding_id": wedding_id,
            **payload.model_dump(),
            "created_at": now,
            "updated_at": now,
        }
        store.guests[data["id"]] = data
        return GuestResponse(**data)

    @staticmethod
    def update(guest_id: str, payload: GuestUpdate) -> GuestResponse:
        data = store.guests.get(guest_id)
        if not data:
            raise OdooRecordNotFound(detail=f"Guest '{guest_id}' not found")
        data.update(payload.model_dump(exclude_unset=True))
        data["updated_at"] = datetime.now(timezone.utc)
        store.guests[guest_id] = data
        return GuestResponse(**data)

    @staticmethod
    def delete(guest_id: str) -> None:
        if guest_id not in store.guests:
            raise OdooRecordNotFound(detail=f"Guest '{guest_id}' not found")
        del store.guests[guest_id]
