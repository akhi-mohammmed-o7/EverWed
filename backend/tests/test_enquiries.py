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

    client.patch(f"/api/v1/enquiries/{eid}", json={"agreement_signed": True})
    conversion = {
        "primary_venue": "Jaipur venue",
        "confirmed_package_fee": 12000000,
        "wedding_start_date": "2027-02-01",
        "wedding_end_date": "2027-02-02",
    }
    # First conversion
    res1 = client.post(f"/api/v1/enquiries/{eid}/convert", json=conversion)
    assert res1.status_code == 200

    # Second conversion attempt must be rejected with 400
    res2 = client.post(f"/api/v1/enquiries/{eid}/convert", json=conversion)
    assert res2.status_code == 400
    assert res2.json()["error"]["code"] == "ENQUIRY_ALREADY_CONVERTED"


def test_conversion_requires_signed_agreement_and_complete_setup(client: TestClient) -> None:
    enquiry = client.post("/api/v1/enquiries", json={
        "bride_name": "Ari", "groom_name": "Sam", "contact_email": "ari@example.com",
        "contact_phone": "+91 90000 00000", "estimated_budget": 5000000,
    }).json()["data"]
    path = f"/api/v1/enquiries/{enquiry['id']}/convert"
    body = {"primary_venue": "Garden", "confirmed_package_fee": 5000000, "wedding_end_date": "2027-04-11"}
    unsigned = client.post(path, json=body)
    assert unsigned.status_code == 422
    assert unsigned.json()["error"]["code"] == "SIGNED_AGREEMENT_REQUIRED"

    client.patch(f"/api/v1/enquiries/{enquiry['id']}", json={"agreement_signed": True})
    incomplete = client.post(path, json=body)
    assert incomplete.status_code == 422
    assert incomplete.json()["error"]["code"] == "WEDDING_SETUP_INCOMPLETE"

