from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient


def test_legacy_client_receipts_are_reconciled_then_partial_and_full_payments_update_every_view(client: TestClient) -> None:
    from app.services.store import store

    suffix = uuid.uuid4().hex[:10]
    wedding = client.post("/api/v1/weddings", json={
        "title": f"Reconciliation {suffix}", "bride_name": "Partner A", "groom_name": "Partner B",
        "contact_phone": "+91 90000 00000", "contact_email": f"couple-{suffix}@example.com",
        "destination": "Jaipur", "primary_venue": "Test venue", "guest_estimate": 60,
        "budget_allocated": 500000, "start_date": "2027-08-10", "end_date": "2027-08-11",
    }).json()["data"]
    wedding_id = wedding["id"]

    dashboard_before = client.get("/api/v1/dashboard/overview").json()["data"]
    # Simulate a preserved legacy ledger entry created before contract validation existed.
    store.client_payments[f"legacy-{suffix}"] = {
        "id": f"legacy-{suffix}", "wedding_id": wedding_id, "stage": "booking_deposit",
        "amount": 200000.0, "payment_method": "Bank Transfer", "transaction_reference": f"OLD-{suffix}",
        "payment_date": "2027-08-01", "status": "received", "created_at": datetime.now(timezone.utc),
    }

    before_reconciliation = client.get(f"/api/v1/finance/weddings/{wedding_id}/summary").json()["data"]
    assert before_reconciliation["total_contract_value"] == 0
    assert before_reconciliation["client_paid_amount"] == 200000
    assert before_reconciliation["client_contract_missing"] is True
    assert before_reconciliation["client_payment_status"] == "contract_missing"

    missing_fee_payment = client.post("/api/v1/finance/client-payments", json={
        "wedding_id": wedding_id, "stage": "advance_payment", "amount": 1,
        "transaction_reference": f"NO-FEE-{suffix}", "payment_date": "2027-08-02",
    })
    assert missing_fee_payment.status_code == 409
    assert missing_fee_payment.json()["error"]["code"] == "CLIENT_CONTRACT_REQUIRED"

    set_fee = client.patch(f"/api/v1/weddings/{wedding_id}", json={"package_fee": 300000})
    assert set_fee.status_code == 200, set_fee.text
    reconciled = client.get(f"/api/v1/finance/weddings/{wedding_id}/summary").json()["data"]
    assert reconciled["total_contract_value"] == 300000
    assert reconciled["client_paid_amount"] == 200000
    assert reconciled["client_outstanding_receivable"] == 100000
    assert reconciled["client_contract_missing"] is False
    assert reconciled["client_payment_status"] == "partial"

    below_received = client.patch(f"/api/v1/weddings/{wedding_id}", json={"package_fee": 199999})
    assert below_received.status_code == 409
    assert below_received.json()["error"]["code"] == "CONTRACT_BELOW_RECEIVED_PAYMENTS"

    payment_payload = {
        "wedding_id": wedding_id, "stage": "advance_payment", "amount": 80000,
        "payment_method": "UPI", "transaction_reference": f"UPI-{suffix}", "payment_date": "2027-08-05",
    }
    partial = client.post("/api/v1/finance/client-payments", json=payment_payload)
    assert partial.status_code == 201, partial.text
    duplicate = client.post("/api/v1/finance/client-payments", json={
        **payment_payload, "transaction_reference": payment_payload["transaction_reference"].lower(),
    })
    assert duplicate.status_code == 409

    overpayment = client.post("/api/v1/finance/client-payments", json={
        **payment_payload, "amount": 20000.01, "transaction_reference": f"OVER-{suffix}",
    })
    assert overpayment.status_code == 400
    assert overpayment.json()["error"]["code"] == "CLIENT_OVERPAYMENT_PROHIBITED"

    final = client.post("/api/v1/finance/client-payments", json={
        **payment_payload, "stage": "final_settlement", "amount": 20000,
        "transaction_reference": f"FINAL-{suffix}",
    })
    assert final.status_code == 201, final.text
    history = client.get(f"/api/v1/finance/client-payments?wedding_id={wedding_id}").json()["data"]
    assert len(history) == 3
    assert sum(payment["amount"] for payment in history) == 300000

    final_summary = client.get(f"/api/v1/finance/weddings/{wedding_id}/summary").json()["data"]
    assert final_summary["client_paid_amount"] == 300000
    assert final_summary["client_outstanding_receivable"] == 0
    assert final_summary["client_payment_status"] == "paid"
    assert client.get(f"/api/v1/weddings/{wedding_id}").json()["data"]["total_paid_by_client"] == 300000

    couple_email = f"couple-{suffix}@example.com"
    couple_create = client.post("/api/v1/auth/users", json={
        "name": "Partner A & Partner B", "email": couple_email, "password": "Couple-Record-8!",
        "role": "couple", "wedding_id": wedding_id,
    })
    assert couple_create.status_code == 201, couple_create.text
    couple = TestClient(client.app)
    assert couple.post("/api/v1/auth/login", json={"username": couple_email, "password": "Couple-Record-8!"}).status_code == 200
    couple_history = couple.get(f"/api/v1/finance/client-payments?wedding_id={wedding_id}").json()["data"]
    couple_wedding = couple.get(f"/api/v1/weddings/{wedding_id}").json()["data"]
    assert sum(payment["amount"] for payment in couple_history) == couple_wedding["total_paid_by_client"] == 300000

    vendor = client.post("/api/v1/vendors", json={
        "name": f"Reconciliation Vendor {suffix}", "category": "Catering", "contact_person": "Accounts",
        "phone": "+91 90000 00001", "email": f"vendor-{suffix}@example.com", "city": "Jaipur",
    }).json()["data"]
    bill = client.post("/api/v1/finance/vendor-bills", json={
        "wedding_id": wedding_id, "vendor_id": vendor["id"], "bill_number": f"INV-{suffix}",
        "agreed_amount": 120000, "billed_amount": 120000,
        "bill_date": "2027-08-01", "due_date": "2027-08-20",
    })
    assert bill.status_code == 201, bill.text
    vendor_payment = client.post("/api/v1/finance/vendor-payments", json={
        "bill_id": bill.json()["data"]["id"], "amount": 45000, "payment_type": "partial",
        "payment_method": "Bank Transfer", "transaction_reference": f"VENDOR-{suffix}", "payment_date": "2027-08-07",
    })
    assert vendor_payment.status_code == 201, vendor_payment.text

    dashboard_after = client.get("/api/v1/dashboard/overview").json()["data"]
    assert dashboard_after["season_contracted_revenue"] - dashboard_before["season_contracted_revenue"] == 300000
    assert dashboard_after["total_client_payments_received"] - dashboard_before["total_client_payments_received"] == 300000
    assert dashboard_after["total_vendor_bills_recorded"] - dashboard_before["total_vendor_bills_recorded"] == 120000
    assert dashboard_after["total_vendor_payments_made"] - dashboard_before["total_vendor_payments_made"] == 45000
    assert dashboard_after["total_vendor_payables_outstanding"] - dashboard_before["total_vendor_payables_outstanding"] == 75000
    assert dashboard_after["season_estimated_profit"] - dashboard_before["season_estimated_profit"] == 180000
    assert dashboard_after["client_contracts_missing_count"] == dashboard_before["client_contracts_missing_count"] - 1
    assert dashboard_after["client_contract_overpayment_count"] == dashboard_before["client_contract_overpayment_count"]
