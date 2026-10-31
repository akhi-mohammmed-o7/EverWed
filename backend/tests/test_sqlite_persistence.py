from __future__ import annotations

from datetime import datetime, timezone
import json
import sqlite3

import pytest

from app.core.exceptions import DuplicateRecordError, RoyalKnotException
from app.database.sqlite import SQLiteDatabase
from app.services.store import Store


def test_business_records_survive_store_restart(tmp_path) -> None:
    database_path = tmp_path / "everwed.sqlite3"
    first = Store(SQLiteDatabase(database_path))
    now = datetime(2026, 10, 31, 12, 0, tzinfo=timezone.utc)

    first.enquiries["enq-db-test"] = {"id": "enq-db-test", "status": "confirmed", "created_at": now}
    first.weddings["wed-db-test"] = {
        "id": "wed-db-test", "enquiry_id": "enq-db-test", "title": "Persistence Test",
        "status": "planning", "created_at": now,
    }
    first.events["evt-db-test"] = {"id": "evt-db-test", "wedding_id": "wed-db-test", "status": "scheduled"}
    first.vendors["vendor-db-test"] = {"id": "vendor-db-test", "name": "Persistence Vendor"}
    first.tasks["task-db-test"] = {
        "id": "task-db-test", "wedding_id": "wed-db-test", "event_id": "evt-db-test", "status": "to_plan",
    }
    first.quotes["quote-db-test"] = {
        "id": "quote-db-test", "wedding_id": "wed-db-test", "vendor_id": "vendor-db-test",
        "event_id": "evt-db-test", "status": "draft",
    }
    first.schedules["schedule-db-test"] = {
        "id": "schedule-db-test", "wedding_id": "wed-db-test", "event_id": "evt-db-test", "status": "pending",
    }
    first.vendor_arrivals["arrival-db-test"] = {
        "id": "arrival-db-test", "wedding_id": "wed-db-test", "event_id": "evt-db-test",
        "vendor_id": "vendor-db-test", "status": "arrived",
    }
    first.operational_issues["issue-db-test"] = {
        "id": "issue-db-test", "wedding_id": "wed-db-test", "event_id": "evt-db-test", "status": "open",
    }
    first.client_payments["client-payment-db-test"] = {
        "id": "client-payment-db-test", "wedding_id": "wed-db-test", "transaction_reference": "CLIENT-DB-TEST",
    }
    first.vendor_bills["bill-db-test"] = {
        "id": "bill-db-test", "wedding_id": "wed-db-test", "vendor_id": "vendor-db-test",
        "event_id": "evt-db-test", "bill_number": "DB-TEST-1", "status": "pending",
    }
    first.vendor_payments["vendor-payment-db-test"] = {
        "id": "vendor-payment-db-test", "bill_id": "bill-db-test",
        "vendor_id": "vendor-db-test", "transaction_reference": "VENDOR-DB-TEST",
    }

    assert first.ping() is True
    first.close()

    reopened = Store(SQLiteDatabase(database_path))
    assert reopened.enquiries["enq-db-test"]["created_at"] == now
    assert reopened.weddings["wed-db-test"]["enquiry_id"] == "enq-db-test"
    assert reopened.events["evt-db-test"]["wedding_id"] == "wed-db-test"
    assert reopened.tasks["task-db-test"]["event_id"] == "evt-db-test"
    assert reopened.vendors["vendor-db-test"]["name"]
    assert reopened.quotes["quote-db-test"]["status"] == "draft"
    assert reopened.schedules["schedule-db-test"]["status"] == "pending"
    assert reopened.vendor_arrivals["arrival-db-test"]["status"] == "arrived"
    assert reopened.operational_issues["issue-db-test"]["status"] == "open"
    assert reopened.client_payments["client-payment-db-test"]["transaction_reference"] == "CLIENT-DB-TEST"
    assert reopened.vendor_bills["bill-db-test"]["bill_number"] == "DB-TEST-1"
    assert reopened.vendor_payments["vendor-payment-db-test"]["transaction_reference"] == "VENDOR-DB-TEST"


def test_relations_and_transaction_rollback_are_enforced(tmp_path) -> None:
    store = Store(SQLiteDatabase(tmp_path / "integrity.sqlite3"))

    with pytest.raises(RoyalKnotException):
        store.events["orphan-event"] = {"id": "orphan-event", "wedding_id": "missing-wedding"}

    with pytest.raises(RoyalKnotException):
        with store.transaction():
            store.weddings["rolled-back"] = {"id": "rolled-back", "enquiry_id": "missing-enquiry"}

    assert "orphan-event" not in store.events
    assert "rolled-back" not in store.weddings


def test_payment_references_are_unique(tmp_path) -> None:
    store = Store(SQLiteDatabase(tmp_path / "unique.sqlite3"))
    store.enquiries["enq-unique"] = {"id": "enq-unique"}
    store.weddings["wed-unique"] = {"id": "wed-unique", "enquiry_id": "enq-unique"}
    store.client_payments["payment-one"] = {
        "id": "payment-one", "wedding_id": "wed-unique", "transaction_reference": "UNIQUE-REFERENCE",
    }

    with pytest.raises(DuplicateRecordError):
        store.client_payments["payment-two"] = {
            "id": "payment-two", "wedding_id": "wed-unique", "transaction_reference": "UNIQUE-REFERENCE",
        }


def test_inr_fields_are_persisted_as_integer_paise_and_round_trip(tmp_path) -> None:
    database = SQLiteDatabase(tmp_path / "money.sqlite3")
    store = Store(database)
    store.enquiries["enq-money"] = {
        "id": "enq-money",
        "estimated_budget": 123.45,
    }

    with database.connection() as connection:
        payload = json.loads(connection.execute(
            'SELECT payload FROM "enquiries" WHERE id=?', ("enq-money",)
        ).fetchone()[0])

    assert payload["estimated_budget_paise"] == 12345
    assert "estimated_budget" not in payload
    assert store.enquiries["enq-money"]["estimated_budget"] == 123.45


def test_financial_collection_payloads_use_integer_paise(tmp_path) -> None:
    database = SQLiteDatabase(tmp_path / "all-money.sqlite3")
    database.initialize()
    examples = {
        "weddings": ("w-money", {"budget_allocated": 1000.01, "package_fee": 0.29}),
        "quotes": ("q-money", {"unit_price": 0.29, "normalized_total": 3.48, "extra_hour_rate": 0.01}),
        "client_payments": ("cp-money", {"amount": 0.29}),
        "vendor_bills": ("vb-money", {"agreed_amount": 1.01, "billed_amount": 1.02, "variance": 0.01, "total_paid": 0.0, "outstanding_balance": 1.02}),
        "vendor_payments": ("vp-money", {"amount": 0.29}),
    }

    for collection, (record_id, amounts) in examples.items():
        database.upsert(collection, record_id, {"id": record_id, **amounts})
        with database.connection() as connection:
            payload = json.loads(connection.execute(
                f'SELECT payload FROM "{collection}" WHERE id=?', (record_id,)
            ).fetchone()[0])
        for rupees_field, rupees_value in amounts.items():
            paise_field = f"{rupees_field}_paise"
            assert payload[paise_field] == round(rupees_value * 100)
            assert type(payload[paise_field]) is int
            assert rupees_field not in payload

    assert database.get("weddings", "w-money")["package_fee"] == 0.29


def test_schema_v1_money_migration_converts_rupees_to_paise(tmp_path) -> None:
    database = SQLiteDatabase(tmp_path / "legacy-money.sqlite3")
    database.initialize()
    with database.connection() as connection:
        connection.execute(
            'INSERT INTO "enquiries" (id, payload) VALUES (?, ?)',
            ("legacy-enquiry", json.dumps({"id": "legacy-enquiry", "estimated_budget": 5.67})),
        )
        connection.execute("PRAGMA user_version=1")

    database.initialize()
    with database.connection() as connection:
        payload = json.loads(connection.execute(
            'SELECT payload FROM "enquiries" WHERE id=?', ("legacy-enquiry",)
        ).fetchone()[0])
        version = connection.execute("PRAGMA user_version").fetchone()[0]

    assert payload["estimated_budget_paise"] == 567
    assert "estimated_budget" not in payload
    assert version == 4
    assert database.get("enquiries", "legacy-enquiry")["estimated_budget"] == 5.67


def test_schema_v2_migration_adds_planner_assignment_foreign_key(tmp_path) -> None:
    path = tmp_path / "legacy-v2.sqlite3"
    connection = sqlite3.connect(path)
    connection.executescript(
        """
        CREATE TABLE users (id TEXT PRIMARY KEY, payload TEXT NOT NULL, uid TEXT, email TEXT, role TEXT, active TEXT);
        CREATE TABLE enquiries (id TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT, contact_email TEXT, contact_phone TEXT);
        CREATE TABLE weddings (id TEXT PRIMARY KEY, payload TEXT NOT NULL, enquiry_id TEXT REFERENCES enquiries(id), status TEXT);
        INSERT INTO weddings (id, payload, status) VALUES ('wed-legacy', '{\"id\":\"wed-legacy\",\"status\":\"planning\"}', 'planning');
        PRAGMA user_version=2;
        """
    )
    connection.close()

    database = SQLiteDatabase(path)
    database.initialize()
    with database.connection() as migrated:
        columns = {row["name"] for row in migrated.execute('PRAGMA table_info("weddings")')}
        foreign_keys = migrated.execute('PRAGMA foreign_key_list("weddings")').fetchall()
        version = migrated.execute("PRAGMA user_version").fetchone()[0]

    assert "assigned_planner_id" in columns
    assert any(row["from"] == "assigned_planner_id" and row["table"] == "users" for row in foreign_keys)
    assert version == 4
    assert database.get("weddings", "wed-legacy")["status"] == "planning"


def test_demo_seed_is_idempotent_and_preserves_existing_data(tmp_path, monkeypatch) -> None:
    from app.services import seed

    isolated_store = Store(SQLiteDatabase(tmp_path / "seed.sqlite3"))
    monkeypatch.setattr(seed, "store", isolated_store)

    first = seed.seed_demo_data()
    wedding = isolated_store.weddings[first["wedding_id"]]
    wedding["title"] = "Keep this edited title"
    isolated_store.weddings[first["wedding_id"]] = wedding

    second = seed.seed_demo_data()
    assert first["already_seeded"] is False
    assert second["already_seeded"] is True
    assert isolated_store.weddings[first["wedding_id"]]["title"] == "Keep this edited title"
