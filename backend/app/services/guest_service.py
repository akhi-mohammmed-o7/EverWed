from __future__ import annotations

import csv
import io
import re
import uuid
from datetime import datetime, timezone

from pydantic import ValidationError

from app.core.exceptions import DuplicateRecordError, OdooRecordNotFound, RoyalKnotException
from app.schemas.guest import GuestCreate, GuestImportRowError, GuestResponse, GuestUpdate
from app.services.store import store

_HEADER_ALIASES = {
    "name": {"name", "guest name", "full name", "guest"},
    "email": {"email", "email address"},
    "phone": {"phone", "phone number", "mobile", "mobile number"},
    "side": {"side", "family side"},
    "rsvp_status": {"rsvp", "rsvp status", "status", "attending"},
    "meal_preference": {"meal", "meal preference", "dietary preference", "diet"},
    "table_number": {"table", "table number", "seating", "table assignment"},
    "is_vip": {"vip", "is vip"},
    "plus_ones": {"plus ones", "plus ones count", "plus one count"},
    "notes": {"notes", "note"},
}


def _text(value: object) -> str:
    return str(value).strip() if value is not None else ""


def _guest_identity(email: str | None, phone: str | None, name: str) -> tuple[str, str]:
    """Return a stable duplicate key for a guest.

    Email is the strongest identity. Without one, a normalised phone number is
    used, then the normalised guest name.
    """
    if email and email.strip():
        return ("email", email.strip().lower())
    if phone and phone.strip():
        return ("phone", re.sub(r"\D", "", phone))
    return ("name", " ".join(name.lower().split()))


def _assert_not_duplicate(wedding_id: str, payload: GuestCreate, *, exclude_id: str | None = None) -> None:
    key = _guest_identity(payload.email, payload.phone, payload.name)
    for guest in store.guests.values():
        if guest.get("wedding_id") != wedding_id or guest.get("id") == exclude_id:
            continue
        if _guest_identity(guest.get("email"), guest.get("phone"), guest.get("name", "")) == key:
            raise DuplicateRecordError(
                "A guest with the same email, phone, or name already exists for this wedding."
            )


def _normalise_row(row: dict[str, str], header_map: dict[str, str]) -> dict:
    values = {field: _text(row.get(source, "")) for field, source in header_map.items()}
    side = values.get("side", "").lower()
    side = {"bride": "bride", "bride side": "bride", "bride's side": "bride",
            "groom": "groom", "groom side": "groom", "groom's side": "groom"}.get(side, "mutual")
    rsvp = values.get("rsvp_status", "").lower()
    rsvp = {"": "pending", "pending": "pending", "maybe": "pending",
            "yes": "confirmed", "confirmed": "confirmed", "attending": "confirmed",
            "no": "declined", "declined": "declined", "not attending": "declined"}.get(rsvp)
    if rsvp is None:
        raise ValueError("RSVP status must be pending, confirmed, or declined")
    plus_raw = values.get("plus_ones", "")
    try:
        plus_ones = int(float(plus_raw)) if plus_raw else 0
    except ValueError as exc:
        raise ValueError("Plus ones must be a whole number") from exc
    vip = values.get("is_vip", "").lower() in {"1", "true", "yes", "y", "vip"}
    return {
        "name": values.get("name", ""),
        "email": values.get("email") or None,
        "phone": values.get("phone") or None,
        "side": side,
        "rsvp_status": rsvp,
        "meal_preference": values.get("meal_preference") or None,
        "table_number": values.get("table_number") or None,
        "is_vip": vip,
        "plus_ones": plus_ones,
        "notes": values.get("notes") or None,
    }


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
        _assert_not_duplicate(wedding_id, payload)
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
        merged = {**data, **payload.model_dump(exclude_unset=True)}
        _assert_not_duplicate(
            data["wedding_id"],
            GuestCreate(
                name=merged["name"],
                email=merged.get("email"),
                phone=merged.get("phone"),
                side=merged.get("side", "mutual"),
                rsvp_status=merged.get("rsvp_status", "pending"),
                meal_preference=merged.get("meal_preference"),
                table_number=merged.get("table_number"),
                is_vip=bool(merged.get("is_vip", False)),
                plus_ones=int(merged.get("plus_ones", 0)),
                notes=merged.get("notes"),
            ),
            exclude_id=guest_id,
        )
        data.update(payload.model_dump(exclude_unset=True))
        data["updated_at"] = datetime.now(timezone.utc)
        store.guests[guest_id] = data
        return GuestResponse(**data)

    @staticmethod
    def delete(guest_id: str) -> None:
        if guest_id not in store.guests:
            raise OdooRecordNotFound(detail=f"Guest '{guest_id}' not found")
        del store.guests[guest_id]

    @staticmethod
    def import_csv(wedding_id: str, csv_text: str) -> dict:
        """Import guests from CSV text, skipping duplicates and invalid rows."""
        if wedding_id not in store.weddings:
            raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' not found")
        if not csv_text.strip():
            raise RoyalKnotException(status_code=422, detail="The CSV file is empty.", error_code="EMPTY_CSV")

        reader = csv.DictReader(io.StringIO(csv_text))
        if not reader.fieldnames:
            raise RoyalKnotException(status_code=422, detail="The CSV file needs a header row.", error_code="CSV_HEADER_REQUIRED")

        header_map: dict[str, str] = {}
        for raw_header in reader.fieldnames:
            normalized = " ".join(raw_header.lstrip("\ufeff").strip().lower().replace("_", " ").split())
            for field, aliases in _HEADER_ALIASES.items():
                if normalized in aliases:
                    header_map[field] = raw_header
                    break
        if "name" not in header_map:
            raise RoyalKnotException(
                status_code=422,
                detail="The CSV must include a name column (or Guest Name / Full Name).",
                error_code="CSV_NAME_COLUMN_REQUIRED",
            )

        seen = {
            _guest_identity(guest.get("email"), guest.get("phone"), guest.get("name", ""))
            for guest in store.guests.values()
            if guest.get("wedding_id") == wedding_id
        }
        valid: list[GuestCreate] = []
        errors: list[GuestImportRowError] = []
        skipped = 0
        for row_number, row in enumerate(reader, start=2):
            if not any(_text(value) for value in row.values()):
                continue
            try:
                payload = GuestCreate(**_normalise_row(row, header_map))
            except (ValidationError, ValueError) as exc:
                if isinstance(exc, ValidationError):
                    message = exc.errors()[0].get("msg", "Invalid guest row")
                else:
                    message = str(exc)
                errors.append(GuestImportRowError(row=row_number, message=message))
                continue
            identity = _guest_identity(payload.email, payload.phone, payload.name)
            if identity in seen:
                skipped += 1
                continue
            seen.add(identity)
            valid.append(payload)

        with store.transaction(immediate=True):
            for payload in valid:
                GuestService.create(wedding_id, payload)

        return {
            "created": len(valid),
            "skipped": skipped,
            "errors": [error.model_dump() for error in errors[:50]],
            "error_count": len(errors),
        }
