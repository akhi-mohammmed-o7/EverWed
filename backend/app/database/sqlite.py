"""SQLite persistence for the local-first EverWed backend.

The business services use mapping-style collections for backwards
compatibility. Each collection is stored in its own SQLite table with JSON
payloads, indexed relationship columns, and foreign-key enforcement.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from contextlib import contextmanager
from contextvars import ContextVar, Token
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterator, Mapping

from app.core.exceptions import DuplicateRecordError, RoyalKnotException
from app.core.money import from_paise, to_paise

logger = logging.getLogger("everwed.database")

SCHEMA_VERSION = 4

# Fields copied from the JSON payload into indexed SQLite columns. Relations
# also carry foreign keys so application-level checks have a database backstop.
COLLECTIONS: dict[str, tuple[tuple[str, ...], dict[str, str]]] = {
    "users": (("uid", "email", "role", "active"), {}),
    "guests": (("wedding_id", "email", "rsvp_status"), {"wedding_id": "weddings"}),
    "sessions": (("user_id", "expires_at", "revoked"), {"user_id": "users"}),
    "enquiries": (("status", "contact_email", "contact_phone"), {}),
    "weddings": (
        ("enquiry_id", "status", "assigned_planner_id"),
        {"enquiry_id": "enquiries", "assigned_planner_id": "users"},
    ),
    "events": (("wedding_id", "status", "date"), {"wedding_id": "weddings"}),
    "vendors": (("category", "city", "email"), {}),
    "quotes": (
        ("wedding_id", "vendor_id", "event_id", "status", "category"),
        {"wedding_id": "weddings", "vendor_id": "vendors", "event_id": "events"},
    ),
    "tasks": (("wedding_id", "event_id", "status"), {"wedding_id": "weddings", "event_id": "events"}),
    "schedules": (("wedding_id", "event_id", "status"), {"wedding_id": "weddings", "event_id": "events"}),
    "vendor_arrivals": (
        ("wedding_id", "event_id", "vendor_id", "status"),
        {"wedding_id": "weddings", "event_id": "events", "vendor_id": "vendors"},
    ),
    "operational_issues": (
        ("wedding_id", "event_id", "status"),
        {"wedding_id": "weddings", "event_id": "events"},
    ),
    "client_payments": (
        ("wedding_id", "transaction_reference"),
        {"wedding_id": "weddings"},
    ),
    "vendor_bills": (
        ("wedding_id", "vendor_id", "event_id", "quote_id", "bill_number", "status"),
        {"wedding_id": "weddings", "vendor_id": "vendors", "event_id": "events", "quote_id": "quotes"},
    ),
    "vendor_payments": (
        ("bill_id", "vendor_id", "transaction_reference"),
        {"bill_id": "vendor_bills", "vendor_id": "vendors"},
    ),
}

# API-compatible INR fields are encoded into integer paise in the JSON payload.
# Services can keep their response shapes while persisted monetary values stay exact.
MONEY_FIELDS: dict[str, dict[str, str]] = {
    "enquiries": {"estimated_budget": "estimated_budget_paise"},
    "weddings": {
        "budget_allocated": "budget_allocated_paise",
        "package_fee": "package_fee_paise",
        "total_agreed_vendor_cost": "total_agreed_vendor_cost_paise",
        "total_paid_by_client": "total_paid_by_client_paise",
        "total_paid_to_vendors": "total_paid_to_vendors_paise",
    },
    "quotes": {
        "unit_price": "unit_price_paise",
        "normalized_total": "normalized_total_paise",
        "extra_hour_rate": "extra_hour_rate_paise",
    },
    "client_payments": {"amount": "amount_paise"},
    "vendor_bills": {
        "agreed_amount": "agreed_amount_paise",
        "billed_amount": "billed_amount_paise",
        "variance": "variance_paise",
        "total_paid": "total_paid_paise",
        "outstanding_balance": "outstanding_balance_paise",
    },
    "vendor_payments": {"amount": "amount_paise"},
}


def _encode(value: Any) -> str:
    def encode_special(item: Any) -> Any:
        if isinstance(item, datetime):
            return {"__everwed_type__": "datetime", "value": item.isoformat()}
        if isinstance(item, date):
            return {"__everwed_type__": "date", "value": item.isoformat()}
        raise TypeError(f"Unsupported value for JSON persistence: {type(item).__name__}")

    return json.dumps(value, default=encode_special, separators=(",", ":"), ensure_ascii=False)


def _decode(payload: str) -> dict[str, Any]:
    def decode_special(item: dict[str, Any]) -> Any:
        kind = item.get("__everwed_type__")
        if kind == "datetime":
            return datetime.fromisoformat(item["value"])
        if kind == "date":
            return date.fromisoformat(item["value"])
        return item

    value = json.loads(payload, object_hook=decode_special)
    if not isinstance(value, dict):
        raise ValueError("Persisted record payload must be a JSON object")
    return value


def _store_money_fields(collection: str, record: Mapping[str, Any]) -> dict[str, Any]:
    stored = dict(record)
    for api_field, paise_field in MONEY_FIELDS.get(collection, {}).items():
        value = stored.pop(api_field, None)
        if value is None:
            stored.pop(paise_field, None)
        else:
            stored[paise_field] = to_paise(value)
    return stored


def _restore_money_fields(collection: str, record: dict[str, Any]) -> dict[str, Any]:
    for api_field, paise_field in MONEY_FIELDS.get(collection, {}).items():
        value = record.pop(paise_field, None)
        if value is not None:
            record[api_field] = from_paise(value)
    return record


class SQLiteDatabase:
    """Small connection-per-operation SQLite database with unit-of-work support."""

    def __init__(self, path: str | Path, busy_timeout_ms: int = 5000) -> None:
        requested_path = Path(path)
        if not requested_path.is_absolute():
            backend_root = Path(__file__).resolve().parents[2]
            requested_path = backend_root / requested_path
        self.path = requested_path.resolve()
        self.busy_timeout_ms = busy_timeout_ms
        self._active_connection: ContextVar[sqlite3.Connection | None] = ContextVar(
            f"everwed_sqlite_connection_{id(self)}", default=None
        )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(
            str(self.path),
            timeout=self.busy_timeout_ms / 1000,
            isolation_level=None,
        )
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute(f"PRAGMA busy_timeout={int(self.busy_timeout_ms)}")
        return connection

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        active = self._active_connection.get()
        if active is not None:
            yield active
            return
        connection = self._connect()
        try:
            yield connection
        finally:
            connection.close()

    @contextmanager
    def transaction(self, *, immediate: bool = False) -> Iterator[None]:
        """Run related writes atomically; immediate mode serializes read/check/write flows."""
        if self._active_connection.get() is not None:
            raise RuntimeError("Nested database transactions are not supported")
        connection = self._connect()
        token: Token[sqlite3.Connection | None] = self._active_connection.set(connection)
        try:
            connection.execute("BEGIN IMMEDIATE" if immediate else "BEGIN")
            yield
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
        finally:
            self._active_connection.reset(token)
            connection.close()

    def initialize(self) -> None:
        """Create the current schema and indexes without replacing any records."""
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = self._connect()
        try:
            connection.execute("PRAGMA journal_mode=WAL")
            version = int(connection.execute("PRAGMA user_version").fetchone()[0])
            if version > SCHEMA_VERSION:
                raise RuntimeError(
                    f"Database schema version {version} is newer than this application supports"
                )
            for collection, (fields, foreign_keys) in COLLECTIONS.items():
                columns = ["id TEXT PRIMARY KEY", "payload TEXT NOT NULL"]
                for field in fields:
                    references = foreign_keys.get(field)
                    definition = f'"{field}" TEXT'
                    if references:
                        definition += f' REFERENCES "{references}"(id) ON DELETE RESTRICT'
                    columns.append(definition)
                if collection == "vendor_bills":
                    columns.append('UNIQUE("vendor_id", "bill_number")')
                connection.execute(
                    f'CREATE TABLE IF NOT EXISTS "{collection}" ({", ".join(columns)})'
                )
                existing_columns = {
                    row["name"] for row in connection.execute(f'PRAGMA table_info("{collection}")')
                }
                for field in fields:
                    if field in existing_columns:
                        continue
                    references = foreign_keys.get(field)
                    definition = f'ALTER TABLE "{collection}" ADD COLUMN "{field}" TEXT'
                    if references:
                        definition += f' REFERENCES "{references}"(id) ON DELETE RESTRICT'
                    connection.execute(definition)
                for field in fields:
                    index_name = f"idx_{collection}_{field}"
                    connection.execute(
                        f'CREATE INDEX IF NOT EXISTS "{index_name}" ON "{collection}"("{field}")'
                    )
                if collection == "users":
                    connection.execute(
                        'CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_email" ON "users"("email")'
                    )
                if collection in {"client_payments", "vendor_payments"}:
                    connection.execute(
                        f'CREATE UNIQUE INDEX IF NOT EXISTS "uq_{collection}_transaction_reference" '
                        f'ON "{collection}"("transaction_reference") '
                        'WHERE "transaction_reference" IS NOT NULL AND "transaction_reference" <> \'\''
                    )
            if version < 2:
                # Convert existing INR JSON fields before marking the migration complete.
                for collection in MONEY_FIELDS:
                    rows = connection.execute(
                        f'SELECT id, payload FROM "{collection}"'
                    ).fetchall()
                    for row in rows:
                        legacy_record = _decode(row["payload"])
                        canonical_record = _store_money_fields(collection, legacy_record)
                        connection.execute(
                            f'UPDATE "{collection}" SET payload=? WHERE id=?',
                            (_encode(canonical_record), row["id"]),
                        )
            connection.execute(f"PRAGMA user_version={SCHEMA_VERSION}")
        finally:
            connection.close()

    def ping(self) -> bool:
        with self.connection() as connection:
            return connection.execute("SELECT 1").fetchone()[0] == 1

    def close(self) -> None:
        """Checkpoint the write-ahead log; individual connections close per operation."""
        with self.connection() as connection:
            connection.execute("PRAGMA wal_checkpoint(PASSIVE)")

    def get(self, collection: str, record_id: str) -> dict[str, Any] | None:
        with self.connection() as connection:
            row = connection.execute(
                f'SELECT payload FROM "{collection}" WHERE id=?', (record_id,)
            ).fetchone()
        return _restore_money_fields(collection, _decode(row[0])) if row else None

    def all(self, collection: str, *, ids_only: bool = False) -> list[Any]:
        column = "id" if ids_only else "payload"
        with self.connection() as connection:
            rows = connection.execute(f'SELECT {column} FROM "{collection}" ORDER BY rowid').fetchall()
        if ids_only:
            return [row[0] for row in rows]
        return [_restore_money_fields(collection, _decode(row[0])) for row in rows]

    def count(self, collection: str) -> int:
        with self.connection() as connection:
            return int(connection.execute(f'SELECT COUNT(*) FROM "{collection}"').fetchone()[0])

    def upsert(self, collection: str, record_id: str, record: Mapping[str, Any]) -> None:
        fields, _ = COLLECTIONS[collection]
        columns = ["id", "payload", *fields]
        values = [record_id, _encode(_store_money_fields(collection, record)), *(record.get(field) for field in fields)]
        quoted_columns = ", ".join('"' + column + '"' for column in columns)
        placeholders = ", ".join("?" for _ in columns)
        update = ", ".join(f'"{column}"=excluded."{column}"' for column in columns[1:])
        statement = (
            f'INSERT INTO "{collection}" ({quoted_columns}) '
            f"VALUES ({placeholders}) ON CONFLICT(id) DO UPDATE SET {update}"
        )
        try:
            with self.connection() as connection:
                connection.execute(statement, values)
        except sqlite3.IntegrityError as exc:
            message = str(exc).lower()
            if "unique constraint" in message or "primary key" in message:
                raise DuplicateRecordError("The record conflicts with an existing identifier or reference") from exc
            if "foreign key constraint" in message:
                raise RoyalKnotException(
                    status_code=409,
                    detail="The record references a related record that does not exist.",
                    error_code="INVALID_RELATIONSHIP",
                ) from exc
            raise RoyalKnotException(
                status_code=409,
                detail="The record could not be saved because it violates a data integrity rule.",
                error_code="DATA_INTEGRITY_ERROR",
            ) from exc
        except sqlite3.Error as exc:
            logger.exception("SQLite write failed for collection %s", collection)
            raise RoyalKnotException(
                status_code=503,
                detail="The database could not save the record.",
                error_code="DATABASE_ERROR",
            ) from exc

    def delete(self, collection: str, record_id: str) -> bool:
        try:
            with self.connection() as connection:
                cursor = connection.execute(
                    f'DELETE FROM "{collection}" WHERE id=?', (record_id,)
                )
                return cursor.rowcount > 0
        except sqlite3.IntegrityError as exc:
            raise RoyalKnotException(
                status_code=409,
                detail="The record is still referenced and cannot be deleted.",
                error_code="RECORD_IN_USE",
            ) from exc
        except sqlite3.Error as exc:
            logger.exception("SQLite delete failed for collection %s", collection)
            raise RoyalKnotException(
                status_code=503,
                detail="The database could not delete the record.",
                error_code="DATABASE_ERROR",
            ) from exc
