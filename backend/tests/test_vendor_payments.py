from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def _wedding_payload(suffix: str) -> dict:
    return {
        "title": f"Payment workflow {suffix}", "bride_name": "Partner A", "groom_name": "Partner B",
        "contact_phone": "+1 415 555 0102", "contact_email": f"couple-{suffix}@example.com",
        "destination": "Toronto", "primary_venue": "Garden Hall", "guest_estimate": 80,
        "budget_allocated": 300000, "package_fee": 200000,
        "start_date": "2027-08-10", "end_date": "2027-08-12",
    }


def _vendor(client: TestClient, suffix: str) -> str:
    response = client.post("/api/v1/vendors", json={
        "name": f"Payment Vendor {suffix}", "category": "Catering", "contact_person": "Accounts",
        "phone": "+1 415 555 0171", "email": f"vendor-{suffix}@example.com", "city": "Toronto",
        "bank_account_details": "private bank detail for role-sanitization test",
    })
    assert response.status_code == 201, response.text
    return response.json()["data"]["id"]


def _bill(client: TestClient, wedding_id: str, vendor_id: str, suffix: str) -> str:
    response = client.post("/api/v1/finance/vendor-bills", json={
        "wedding_id": wedding_id, "vendor_id": vendor_id, "bill_number": f"INV-{suffix}",
        "agreed_amount": 100.11, "billed_amount": 100.11,
        "bill_date": "2027-08-01", "due_date": "2027-08-20",
    })
    assert response.status_code == 201, response.text
    return response.json()["data"]["id"]


def test_vendor_partial_and_full_payments_persist_and_balance_is_derived(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:10]
    wedding = client.post("/api/v1/weddings", json=_wedding_payload(suffix)).json()["data"]
    vendor_id = _vendor(client, suffix)
    bill_id = _bill(client, wedding["id"], vendor_id, suffix)

    partial_payload = {
        "bill_id": bill_id, "amount": 40.05, "payment_type": "partial", "payment_method": "UPI",
        "transaction_reference": f"UPI-{suffix}", "payment_date": "2027-08-05", "notes": "First instalment",
    }
    partial = client.post("/api/v1/finance/vendor-payments", json=partial_payload)
    assert partial.status_code == 201, partial.text
    assert partial.json()["data"]["payment_method"] == "UPI"
    assert partial.json()["data"]["payment_date"] == "2027-08-05"
    assert partial.json()["data"]["notes"] == "First instalment"

    duplicate = client.post("/api/v1/finance/vendor-payments", json={
        **partial_payload, "transaction_reference": partial_payload["transaction_reference"].lower(),
    })
    assert duplicate.status_code == 409

    invalid_precision = client.post("/api/v1/finance/vendor-payments", json={
        **partial_payload, "transaction_reference": f"PREC-{suffix}", "amount": 0.001,
    })
    assert invalid_precision.status_code == 422
    invalid_date = client.post("/api/v1/finance/vendor-payments", json={
        **partial_payload, "transaction_reference": f"DATE-{suffix}", "payment_date": "not-a-date",
    })
    assert invalid_date.status_code == 422

    overpayment = client.post("/api/v1/finance/vendor-payments", json={
        **partial_payload, "amount": 60.07, "transaction_reference": f"OVER-{suffix}",
    })
    assert overpayment.status_code == 400

    after_partial = client.get(f"/api/v1/finance/vendor-bills?wedding_id={wedding['id']}").json()["data"][0]
    assert after_partial["status"] == "partially_paid"
    assert after_partial["total_paid"] == 40.05
    assert after_partial["outstanding_balance"] == 60.06
    assert len(after_partial["payments"]) == 1

    final = client.post("/api/v1/finance/vendor-payments", json={
        **partial_payload, "amount": 60.06, "payment_type": "final", "payment_method": "Bank Transfer",
        "transaction_reference": f"BANK-{suffix}", "payment_date": "2027-08-08", "notes": "Final settlement",
    })
    assert final.status_code == 201, final.text
    bill = client.get(f"/api/v1/finance/vendor-bills?wedding_id={wedding['id']}").json()["data"][0]
    assert bill["status"] == "paid"
    assert bill["total_paid"] == 100.11
    assert bill["outstanding_balance"] == 0
    assert [payment["payment_date"] for payment in bill["payments"]] == ["2027-08-05", "2027-08-08"]

    from app.services.store import Store, store
    from app.database.sqlite import SQLiteDatabase

    restarted = Store(SQLiteDatabase(store.database.path))
    persisted = restarted.vendor_payments[partial.json()["data"]["id"]]
    assert persisted["amount"] == 40.05
    assert persisted["notes"] == "First instalment"
    assert restarted.vendor_bills[bill_id]["status"] == "paid"
    restarted.close()


def test_planner_vendor_payments_are_limited_to_assigned_weddings_and_couples_cannot_read_agency_finance(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:10]
    vendor_id = _vendor(client, suffix)
    planner_email = f"planner-{suffix}@example.com"
    other_planner_email = f"other-planner-{suffix}@example.com"
    for name, email, password in [
        ("Assigned Planner", planner_email, "Planner-Payment-8!"),
        ("Other Planner", other_planner_email, "Other-Planner-8!"),
    ]:
        planner = client.post("/api/v1/auth/users", json={
            "name": name, "email": email, "password": password, "role": "planner",
        })
        assert planner.status_code == 201, planner.text
    assigned_wedding = client.post("/api/v1/weddings", json=_wedding_payload(f"a-{suffix}")).json()["data"]
    other_wedding = client.post("/api/v1/weddings", json=_wedding_payload(f"b-{suffix}")).json()["data"]
    assigned_bill = _bill(client, assigned_wedding["id"], vendor_id, f"a-{suffix}")
    other_bill = _bill(client, other_wedding["id"], vendor_id, f"b-{suffix}")

    assigned = client.post(f"/api/v1/weddings/{assigned_wedding['id']}/planner-assignment", json={"planner_email": planner_email})
    assert assigned.status_code == 200, assigned.text
    other_assigned = client.post(f"/api/v1/weddings/{other_wedding['id']}/planner-assignment", json={"planner_email": other_planner_email})
    assert other_assigned.status_code == 200, other_assigned.text

    planner_client = TestClient(client.app)
    login = planner_client.post("/api/v1/auth/login", json={"username": planner_email, "password": "Planner-Payment-8!"})
    assert login.status_code == 200
    payment = {
        "bill_id": assigned_bill, "amount": 10, "payment_type": "partial", "payment_method": "Cheque",
        "transaction_reference": f"PLANNER-{suffix}", "payment_date": "2027-08-06",
    }
    assert planner_client.post("/api/v1/finance/vendor-payments", json=payment).status_code == 201
    assert planner_client.get(f"/api/v1/finance/vendor-bills?wedding_id={assigned_wedding['id']}").status_code == 200
    assert planner_client.get(f"/api/v1/finance/vendor-bills?wedding_id={other_wedding['id']}").status_code == 403
    denied = planner_client.post("/api/v1/finance/vendor-payments", json={**payment, "bill_id": other_bill, "transaction_reference": f"DENIED-{suffix}"})
    assert denied.status_code == 403

    couple = client.post("/api/v1/auth/users", json={
        "name": "Partner One & Partner Two", "email": f"couple-{suffix}@example.com",
        "password": "Couple-Payment-9!", "role": "couple", "wedding_id": assigned_wedding["id"],
    })
    assert couple.status_code == 201, couple.text
    couple_client = TestClient(client.app)
    assert couple_client.post("/api/v1/auth/login", json={"username": f"couple-{suffix}@example.com", "password": "Couple-Payment-9!"}).status_code == 200
    assert couple_client.get(f"/api/v1/finance/vendor-bills?wedding_id={assigned_wedding['id']}").status_code == 403
    assert couple_client.get(f"/api/v1/finance/weddings/{assigned_wedding['id']}/summary").status_code == 403
    assert couple_client.post("/api/v1/finance/vendor-payments", json={**payment, "transaction_reference": f"COUPLE-{suffix}"}).status_code == 403

    vendor_listing = planner_client.get("/api/v1/vendors")
    assert vendor_listing.status_code == 200
    returned_vendor = next(item for item in vendor_listing.json()["data"] if item["id"] == vendor_id)
    assert returned_vendor["bank_account_details"] is None


def test_planner_created_wedding_is_assigned_and_immediately_accessible(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:10]
    planner_email = f"new-planner-{suffix}@example.com"
    created_user = client.post("/api/v1/auth/users", json={
        "name": "Wedding Planner", "email": planner_email,
        "password": "Planner-Create-8!", "role": "planner",
    })
    assert created_user.status_code == 201, created_user.text

    planner_client = TestClient(client.app)
    login = planner_client.post("/api/v1/auth/login", json={
        "username": planner_email, "password": "Planner-Create-8!",
    })
    assert login.status_code == 200

    created = planner_client.post("/api/v1/weddings", json=_wedding_payload(suffix))
    assert created.status_code == 201, created.text
    wedding = created.json()["data"]
    assert wedding["id"]
    assert planner_client.get(f"/api/v1/weddings/{wedding['id']}").status_code == 200
    listed = planner_client.get("/api/v1/weddings").json()["data"]
    assert any(item["id"] == wedding["id"] for item in listed)


def test_assigned_planner_can_record_client_payment_and_vendor_invoice(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:10]
    wedding_payload = _wedding_payload(f"ledger-{suffix}")
    wedding_payload["package_fee"] = None
    wedding = client.post("/api/v1/weddings", json=wedding_payload).json()["data"]
    vendor_id = _vendor(client, f"ledger-{suffix}")
    email = f"ledger-planner-{suffix}@example.com"
    created = client.post("/api/v1/auth/users", json={
        "name": "Ledger Planner", "email": email,
        "password": "Ledger-Planner-8!", "role": "planner",
    })
    assert created.status_code == 201, created.text
    assignment = client.post(
        f"/api/v1/weddings/{wedding['id']}/planner-assignment",
        json={"planner_email": email},
    )
    assert assignment.status_code == 200, assignment.text

    planner = TestClient(client.app)
    login = planner.post("/api/v1/auth/login", json={"username": email, "password": "Ledger-Planner-8!"})
    assert login.status_code == 200, login.text
    contract = planner.patch(f"/api/v1/weddings/{wedding['id']}", json={"package_fee": 120000})
    assert contract.status_code == 200, contract.text
    payment = planner.post("/api/v1/finance/client-payments", json={
        "wedding_id": wedding["id"], "stage": "advance_payment", "amount": 25000,
        "payment_method": "Bank Transfer", "transaction_reference": f"CLIENT-{suffix}",
        "payment_date": "2027-08-05",
    })
    assert payment.status_code == 201, payment.text
    payment_history = planner.get(f"/api/v1/finance/client-payments?wedding_id={wedding['id']}")
    assert payment_history.status_code == 200, payment_history.text
    assert payment_history.json()["data"][0]["amount"] == 25000

    bill = planner.post("/api/v1/finance/vendor-bills", json={
        "wedding_id": wedding["id"], "vendor_id": vendor_id,
        "bill_number": f"PLANNER-INV-{suffix}", "agreed_amount": 70000,
        "billed_amount": 70000, "bill_date": "2027-08-01", "due_date": "2027-08-20",
    })
    assert bill.status_code == 201, bill.text
    listed_bills = planner.get(f"/api/v1/finance/vendor-bills?wedding_id={wedding['id']}")
    assert listed_bills.status_code == 200, listed_bills.text
    assert listed_bills.json()["data"][0]["bill_number"] == f"PLANNER-INV-{suffix}"
