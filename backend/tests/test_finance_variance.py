"""
Royal Knot OS — Financial Management, Variance Rules & Double-Counting Prevention Tests.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_variance_explanation_and_overpayment_protection(client: TestClient) -> None:
    # 1. Setup wedding
    w_payload = {
        "title": "Finance Test Wedding",
        "bride_name": "Simran",
        "groom_name": "Raj",
        "contact_phone": "+91 98290 55443",
        "contact_email": "simran@test.com",
        "destination": "Jaipur",
        "primary_venue": "Chomu Palace",
        "budget_allocated": 10000000.0,  # 1 Crore
        "start_date": "2026-12-15",
        "end_date": "2026-12-17",
    }
    wid = client.post("/api/v1/weddings", json=w_payload).json()["data"]["id"]

    # 2. Client Payment duplicate protection
    p1 = {
        "wedding_id": wid,
        "stage": "booking_deposit",
        "amount": 2500000.0,
        "transaction_reference": "TXN-TEST-SIMRAN-01",
        "payment_date": "2026-11-01",
    }
    res_p1 = client.post("/api/v1/finance/client-payments", json=p1)
    assert res_p1.status_code == 201

    # Duplicate must fail with 409
    res_dup = client.post("/api/v1/finance/client-payments", json=p1)
    assert res_dup.status_code == 409
    assert res_dup.json()["error"]["code"] == "DUPLICATE_RECORD"

    # 3. Vendor Bill Variance Enforcement:
    # Agreed quote is ₹1,000,000. Vendor bills ₹1,200,000 without explanation -> Must be 422
    unexplained_bill = {
        "wedding_id": wid,
        "vendor_id": "v-royal-palace-caterers",
        "bill_number": "INV-TEST-001",
        "agreed_amount": 1000000.0,
        "billed_amount": 1200000.0,
        "variance_reason": None,
        "bill_date": "2026-12-18",
        "due_date": "2026-12-30",
    }
    res_b_fail = client.post("/api/v1/finance/vendor-bills", json=unexplained_bill)
    assert res_b_fail.status_code == 422
    assert res_b_fail.json()["error"]["code"] == "VARIANCE_EXPLANATION_REQUIRED"

    # With explanation -> Succeeds
    explained_bill = {
        "wedding_id": wid,
        "vendor_id": "v-royal-palace-caterers",
        "bill_number": "INV-TEST-001",
        "agreed_amount": 1000000.0,
        "billed_amount": 1200000.0,
        "variance_reason": "Extra 50 plates for unannounced VIP family delegates",
        "bill_date": "2026-12-18",
        "due_date": "2026-12-30",
    }
    res_b_ok = client.post("/api/v1/finance/vendor-bills", json=explained_bill)
    assert res_b_ok.status_code == 201
    bill_id = res_b_ok.json()["data"]["id"]

    # 4. Overpayment protection
    # Billed amount is ₹1,200,000. Paying ₹1,500,000 must fail with 400
    res_overpay = client.post(
        "/api/v1/finance/vendor-payments",
        json={
            "bill_id": bill_id,
            "amount": 1500000.0,
            "payment_type": "final",
            "transaction_reference": "TXN-OVER-001",
            "payment_date": "2026-12-20",
        },
    )
    assert res_overpay.status_code == 400
    assert res_overpay.json()["error"]["code"] == "OVERPAYMENT_PROHIBITED"

    # Exact payment -> Succeeds and marks bill paid
    res_pay = client.post(
        "/api/v1/finance/vendor-payments",
        json={
            "bill_id": bill_id,
            "amount": 1200000.0,
            "payment_type": "final",
            "transaction_reference": "TXN-EXACT-001",
            "payment_date": "2026-12-20",
        },
    )
    assert res_pay.status_code == 201

    # Check financial summary
    res_fin = client.get(f"/api/v1/finance/weddings/{wid}/summary")
    assert res_fin.status_code == 200
    fin = res_fin.json()["data"]
    assert fin["total_contract_value"] == 10000000.0
    assert fin["client_paid_amount"] == 2500000.0
    assert fin["client_outstanding_receivable"] == 7500000.0
    assert fin["actual_vendor_bills_total"] == 1200000.0
    assert fin["vendor_paid_amount"] == 1200000.0
    assert fin["vendor_outstanding_payable"] == 0.0
    assert fin["net_agency_profit"] == 10000000.0 - 1200000.0
