"""
Royal Knot OS — Weddings & Events Unit Tests.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_wedding_event_relationship_integrity(client: TestClient) -> None:
    # Attempting to create an event with non-existent wedding must fail
    bad_event = {
        "name": "Cocktail Evening",
        "date": "2026-11-20",
        "start_time": "19:00",
        "end_time": "23:00",
        "venue_hall": "Sunset Terrace",
        "coordinator_name": "Pooja Verma",
    }
    res_bad = client.post("/api/v1/weddings/wed-nonexistent-999/events", json=bad_event)
    assert res_bad.status_code == 404
    assert res_bad.json()["error"]["code"] == "ODOO_RECORD_NOT_FOUND"

    # Create valid wedding
    w_payload = {
        "title": "The Royal Knot: Tanya & Kabir",
        "bride_name": "Tanya Saxena",
        "groom_name": "Kabir Malani",
        "contact_phone": "+91 98290 88776",
        "contact_email": "tanya@malani.in",
        "destination": "Jaipur",
        "primary_venue": "Samode Palace",
        "package_type": "Partial/Day-of",
        "budget_allocated": 15000000.0,
        "start_date": "2026-11-20",
        "end_date": "2026-11-22",
    }
    res_w = client.post("/api/v1/weddings", json=w_payload)
    assert res_w.status_code == 201
    wedding_id = res_w.json()["data"]["id"]

    # Add 2 events
    e1 = {
        "name": "Sangeet Night",
        "date": "2026-11-20",
        "start_time": "20:00",
        "end_time": "02:00",
        "venue_hall": "Darbar Hall",
        "coordinator_name": "Rohan Joshi",
    }
    e2 = {
        "name": "Pheras Ceremony",
        "date": "2026-11-21",
        "start_time": "16:00",
        "end_time": "20:00",
        "venue_hall": "Palace Courtyard",
        "coordinator_name": "Pooja Verma",
    }
    client.post(f"/api/v1/weddings/{wedding_id}/events", json=e1)
    client.post(f"/api/v1/weddings/{wedding_id}/events", json=e2)

    # Check wedding events count is now 2
    res_get_w = client.get(f"/api/v1/weddings/{wedding_id}")
    assert res_get_w.status_code == 200
    assert res_get_w.json()["data"]["events_count"] == 2

