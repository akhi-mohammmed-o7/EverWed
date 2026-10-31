"""
Royal Knot OS — Vendor Quotes & Side-by-Side Comparison Unit Tests.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_quote_comparison_and_auto_close_competing(client: TestClient) -> None:
    # Create wedding with 400 guests
    w_payload = {
        "title": "Comparison Test Wedding",
        "bride_name": "Divya",
        "groom_name": "Varun",
        "contact_phone": "+91 94140 99887",
        "contact_email": "divya@test.com",
        "destination": "Jaipur",
        "primary_venue": "Jai Mahal Palace",
        "guest_estimate": 400,
        "budget_allocated": 20000000.0,
        "start_date": "2026-12-05",
        "end_date": "2026-12-07",
    }
    wid = client.post("/api/v1/weddings", json=w_payload).json()["data"]["id"]

    # Caterer A: ₹4,000 per plate * 400 guests = ₹1,600,000
    q_a = {
        "wedding_id": wid,
        "vendor_id": "v-royal-palace-caterers",
        "category": "Catering",
        "pricing_type": "per_plate",
        "unit_price": 4000.0,
        "estimated_quantity": 400,
        "scope_of_work": "Full buffet",
    }
    # Caterer B: ₹4,500 per plate * 400 guests = ₹1,800,000
    q_b = {
        "wedding_id": wid,
        "vendor_id": "v-shahi-caterers-udaipur",
        "category": "Catering",
        "pricing_type": "per_plate",
        "unit_price": 4500.0,
        "estimated_quantity": 400,
        "scope_of_work": "Royal buffet",
    }
    qa_id = client.post("/api/v1/quotes", json=q_a).json()["data"]["id"]
    qb_id = client.post("/api/v1/quotes", json=q_b).json()["data"]["id"]

    # Compare
    res_comp = client.get(f"/api/v1/quotes/compare?wedding_id={wid}&category=Catering")
    assert res_comp.status_code == 200
    comp = res_comp.json()["data"]
    assert comp["lowest_quote_id"] == qa_id

    # Select Caterer A
    res_sel = client.post(f"/api/v1/quotes/{qa_id}/select")
    assert res_sel.status_code == 200

    # Verify Caterer B was automatically closed (rejected)
    res_quotes = client.get(f"/api/v1/quotes?wedding_id={wid}&category=Catering")
    quotes = {q["id"]: q["status"] for q in res_quotes.json()["data"]}
    assert quotes[qa_id] == "selected"
    assert quotes[qb_id] == "rejected"
