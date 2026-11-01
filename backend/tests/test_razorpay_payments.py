from __future__ import annotations

import hashlib
import hmac
import uuid

from fastapi.testclient import TestClient


def _onboard(client: TestClient, planner_uid: int) -> str:
    response = client.post("/api/v1/weddings/onboarding", json={
        "destination": "Jaipur", "primary_venue": "Garden Palace", "guest_estimate": 80,
        "budget_allocated": 500000, "start_date": "2027-08-10", "end_date": "2027-08-11",
        "theme": "Garden", "tradition": "Hindu", "regional_customization": "Family customs",
        "preferred_planner_uid": planner_uid,
        "functions": [{"name": "Wedding", "date": "2027-08-10", "start_time": "10:00", "end_time": "12:00"}],
    })
    assert response.status_code == 201, response.text
    return response.json()["data"]["id"]


def _signed_webhook(payload: dict, event_id: str, secret: str) -> tuple[bytes, dict[str, str]]:
    import json

    raw = json.dumps(payload, separators=(",", ":")).encode()
    signature = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    return raw, {"X-Razorpay-Signature": signature, "X-Razorpay-Event-Id": event_id}


def test_razorpay_link_webhooks_update_couple_and_assigned_planner_atomically(client: TestClient, monkeypatch) -> None:
    from app.core.config import get_settings
    from app.integrations.razorpay.client import RazorpayClient

    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_example_key")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "test-secret-not-a-real-credential")
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", "webhook-test-secret")
    get_settings.cache_clear()

    suffix = uuid.uuid4().hex[:10]
    planner_email = f"planner-{suffix}@example.com"
    planner_response = client.post("/api/v1/auth/users", json={
        "name": "Rajasthan Planner", "email": planner_email,
        "password": "Planner-Gateway-8!", "role": "planner",
    })
    assert planner_response.status_code == 201, planner_response.text
    planner_uid = planner_response.json()["data"]["uid"]

    couple = TestClient(client.app)
    couple_signup = couple.post("/api/v1/auth/couple-signup", json={
        "partner_one_name": "Aarav", "partner_two_name": "Meera",
        "email": f"couple-{suffix}@example.com", "phone": "+91 98765 43210",
        "password": "Couple-Gateway-8!", "terms_accepted": True,
    })
    assert couple_signup.status_code == 201, couple_signup.text
    wedding_id = _onboard(couple, planner_uid)
    contract = client.patch(f"/api/v1/weddings/{wedding_id}", json={"package_fee": 1000})
    assert contract.status_code == 200, contract.text

    async def fake_create_link(self, payload):
        assert payload["amount"] == 100000
        assert payload["currency"] == "INR"
        assert payload["accept_partial"] is True
        return {"id": "plink_test_everwed", "short_url": "https://rzp.io/i/everwed-test"}

    monkeypatch.setattr(RazorpayClient, "create_payment_link", fake_create_link)
    key = f"request-{suffix}"
    created = couple.post("/api/v1/finance/client-payment-links", json={
        "wedding_id": wedding_id, "stage": "booking_deposit",
    }, headers={"Idempotency-Key": key})
    assert created.status_code == 201, created.text
    link = created.json()["data"]
    assert link["short_url"] == "https://rzp.io/i/everwed-test"
    assert link["amount_due"] == 1000

    repeated = couple.post("/api/v1/finance/client-payment-links", json={
        "wedding_id": wedding_id, "stage": "booking_deposit",
    }, headers={"Idempotency-Key": key})
    assert repeated.status_code == 201
    assert repeated.json()["data"]["id"] == link["id"]
    assert len(couple.get(f"/api/v1/finance/client-payment-links?wedding_id={wedding_id}").json()["data"]) == 1

    partial_body = {
        "event": "payment_link.partially_paid",
        "payload": {"payment_link": {"entity": {
            "id": link["provider_link_id"], "reference_id": link["id"], "amount": 100000,
            "amount_paid": 25000, "currency": "INR", "status": "partially_paid",
            "payments": [{"payment_id": "pay_test_partial", "amount": 25000, "status": "captured", "method": "upi", "created_at": 1817856000}],
        } } },
    }
    raw_partial, headers_partial = _signed_webhook(partial_body, "evt_partial", "webhook-test-secret")
    bad_signature = couple.post("/api/v1/finance/razorpay/webhook", content=raw_partial, headers={**headers_partial, "X-Razorpay-Signature": "0" * 64})
    assert bad_signature.status_code == 400

    partial = couple.post("/api/v1/finance/razorpay/webhook", content=raw_partial, headers=headers_partial)
    assert partial.status_code == 200, partial.text
    duplicate = couple.post("/api/v1/finance/razorpay/webhook", content=raw_partial, headers=headers_partial)
    assert duplicate.status_code == 200
    assert duplicate.json()["data"]["duplicate"] is True

    planner = TestClient(client.app)
    assert planner.post("/api/v1/auth/login", json={"username": planner_email, "password": "Planner-Gateway-8!"}).status_code == 200
    planner_payments = planner.get(f"/api/v1/finance/client-payments?wedding_id={wedding_id}")
    assert planner_payments.status_code == 200
    assert len(planner_payments.json()["data"]) == 1
    assert planner_payments.json()["data"][0]["provider_payment_id"] == "pay_test_partial"
    current_link = couple.get(f"/api/v1/finance/client-payment-links?wedding_id={wedding_id}").json()["data"][0]
    assert current_link["status"] == "partially_paid"
    assert current_link["amount_paid"] == 250

    paid_body = {
        "event": "payment_link.paid",
        "payload": {"payment_link": {"entity": {
            "id": link["provider_link_id"], "reference_id": link["id"], "amount": 100000,
            "amount_paid": 100000, "currency": "INR", "status": "paid",
            "payments": [
                {"payment_id": "pay_test_partial", "amount": 25000, "status": "captured", "method": "upi", "created_at": 1817856000},
                {"payment_id": "pay_test_final", "amount": 75000, "status": "captured", "method": "card", "created_at": 1817942400},
            ],
        } } },
    }
    raw_paid, headers_paid = _signed_webhook(paid_body, "evt_paid", "webhook-test-secret")
    paid = couple.post("/api/v1/finance/razorpay/webhook", content=raw_paid, headers=headers_paid)
    assert paid.status_code == 200, paid.text
    records = couple.get(f"/api/v1/finance/client-payments?wedding_id={wedding_id}").json()["data"]
    assert len(records) == 2
    assert sum(item["amount"] for item in records) == 1000
    assert {item["status"] for item in records} == {"received"}
    final_link = couple.get(f"/api/v1/finance/client-payment-links?wedding_id={wedding_id}").json()["data"][0]
    assert final_link["status"] == "paid"
    assert final_link["amount_due"] == 0


def test_payment_links_stay_disabled_without_provider_and_webhook_credentials(client: TestClient, monkeypatch) -> None:
    from app.core.config import get_settings

    monkeypatch.setenv("RAZORPAY_KEY_ID", "")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "")
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", "")
    get_settings.cache_clear()
    wedding = client.post("/api/v1/weddings", json={
        "title": "Gateway not configured", "bride_name": "A", "groom_name": "B",
        "contact_phone": "+91 90000 00000", "contact_email": "gateway@example.com",
        "destination": "Jaipur", "primary_venue": "Test Hall", "guest_estimate": 20,
        "budget_allocated": 10000, "package_fee": 10000,
        "start_date": "2027-08-10", "end_date": "2027-08-11",
    }).json()["data"]
    response = client.post("/api/v1/finance/client-payment-links", json={
        "wedding_id": wedding["id"], "stage": "advance_payment",
    }, headers={"Idempotency-Key": "request-disabled"})
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "PAYMENTS_NOT_CONFIGURED"
    links = client.get(f"/api/v1/finance/client-payment-links?wedding_id={wedding['id']}")
    assert links.status_code == 200
    assert links.json()["data"] == []
