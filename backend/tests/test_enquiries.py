"""
Royal Knot OS — Enquiries & Client Conversion Unit Tests.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_create_and_fetch_enquiry(client: TestClient) -> None:
    payload = {
        "bride_name": "Meera Patel",
        "groom_name": "Devansh Singhania",
        "contact_email": "meera@singhania.com",
        "contact_phone": "+91 94140 12345",
        "enquiry_source": "WhatsApp",
        "package_type": "Full-Service",
        "destination": "Udaipur",
        "estimated_guests": 350,
        "theme": "Lakeside Chic",
        "estimated_budget": 28000000.0,
    }
    res = client.post("/api/v1/enquiries", json=payload)
    assert res.status_code == 201
    data = res.json()["data"]
    enquiry_id = data["id"]
    assert data["destination"] == "Udaipur"

    # Fetch
    res_get = client.get(f"/api/v1/enquiries/{enquiry_id}")
    assert res_get.status_code == 200
    assert res_get.json()["data"]["bride_name"] == "Meera Patel"


def test_cannot_convert_enquiry_twice(client: TestClient) -> None:
    payload = {
        "bride_name": "Rhea Kapoor",
        "groom_name": "Karan Johar",
        "contact_email": "rhea@kapoor.com",
        "contact_phone": "+91 99280 12345",
        "destination": "Jaipur",
        "estimated_budget": 20000000.0,
    }
    enq = client.post("/api/v1/enquiries", json=payload).json()["data"]
    eid = enq["id"]

    # First conversion
    res1 = client.post(f"/api/v1/enquiries/{eid}/convert", json={})
    assert res1.status_code == 200

    # Second conversion attempt must be rejected with 400
    res2 = client.post(f"/api/v1/enquiries/{eid}/convert", json={})
    assert res2.status_code == 400
    assert res2.json()["error"]["code"] == "ENQUIRY_ALREADY_CONVERTED"
