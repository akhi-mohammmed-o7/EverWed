"""Persisted client payment links and idempotent Razorpay webhook processing."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.config import Settings
from app.core.exceptions import OdooRecordNotFound, RoyalKnotException
from app.core.money import from_paise, sum_paise, to_paise
from app.integrations.razorpay.client import PaymentProviderError, RazorpayClient
from app.schemas.finance import ClientPaymentLinkResponse
from app.services.store import store

logger = logging.getLogger("everwed.payments")
PAYMENT_STAGES = {"booking_deposit", "advance_payment", "final_settlement"}
ACTIVE_LINK_STATES = {"creating", "created", "partially_paid", "creation_unknown"}


def _link_response(record: dict[str, Any]) -> ClientPaymentLinkResponse:
    amount = from_paise(int(record.get("amount_paise", 0)))
    amount_paid = from_paise(int(record.get("amount_paid_paise", 0)))
    amount_due = from_paise(max(0, int(record.get("amount_paise", 0)) - int(record.get("amount_paid_paise", 0))))
    return ClientPaymentLinkResponse(
        id=record["id"],
        wedding_id=record["wedding_id"],
        amount=amount,
        amount_paid=amount_paid,
        amount_due=amount_due,
        status=record["status"],
        provider_link_id=record.get("provider_link_id"),
        short_url=record.get("short_url"),
        stage=record["stage"],
        created_at=record["created_at"],
        expires_at=record.get("expires_at"),
    )


class PaymentService:
    @staticmethod
    async def create_payment_link(
        *, wedding_id: str, user_id: str, stage: str, request_id: str, settings: Settings,
    ) -> ClientPaymentLinkResponse:
        if stage not in PAYMENT_STAGES:
            raise RoyalKnotException(status_code=422, detail="Choose a valid contract payment stage.", error_code="INVALID_PAYMENT_STAGE")
        if not re.fullmatch(r"[A-Za-z0-9_-]{8,100}", request_id):
            raise RoyalKnotException(status_code=422, detail="A valid idempotency key is required.", error_code="INVALID_IDEMPOTENCY_KEY")
        # Fail before reserving a database intent when the account is not ready.
        gateway = RazorpayClient(settings)
        now = datetime.now(timezone.utc)
        intent: dict[str, Any] | None = None
        with store.transaction(immediate=True):
            wedding = store.weddings.get(wedding_id)
            if not wedding:
                raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' not found")
            existing_request = next((
                item for item in store.payment_links.values()
                if item.get("wedding_id") == wedding_id and item.get("client_request_id") == request_id
            ), None)
            if existing_request:
                if existing_request["status"] in {"created", "partially_paid", "paid"}:
                    return _link_response(existing_request)
                raise RoyalKnotException(
                    status_code=409,
                    detail="This payment attempt is already being processed. Refresh the payment page before retrying.",
                    error_code="PAYMENT_ATTEMPT_IN_PROGRESS",
                )

            active_link = next((
                item for item in store.payment_links.values()
                if item.get("wedding_id") == wedding_id
                and item.get("status") in ACTIVE_LINK_STATES
                and item.get("expires_at")
                and item["expires_at"] > now
                and int(item.get("amount_paise", 0)) > int(item.get("amount_paid_paise", 0))
            ), None)
            if active_link:
                if active_link["status"] == "creation_unknown":
                    raise RoyalKnotException(
                        status_code=409,
                        detail="A payment-link request has an unknown provider outcome. Contact the Founder before creating another link.",
                        error_code="PAYMENT_LINK_RECONCILIATION_REQUIRED",
                    )
                if active_link["status"] == "creating":
                    raise RoyalKnotException(status_code=409, detail="A payment link is being created. Refresh shortly.", error_code="PAYMENT_ATTEMPT_IN_PROGRESS")
                return _link_response(active_link)

            package_fee = wedding.get("package_fee")
            if package_fee is None or to_paise(package_fee) <= 0:
                raise RoyalKnotException(
                    status_code=409,
                    detail="Your planner must record the agreed contract fee before online payment is available.",
                    error_code="CONTRACT_FEE_NOT_SET",
                )
            paid_paise = sum_paise((
                payment for payment in store.client_payments.values()
                if payment.get("wedding_id") == wedding_id and payment.get("status") in {"received", "verified"}
            ), "amount")
            pending_offline_paise = sum_paise((
                payment for payment in store.client_payments.values()
                if payment.get("wedding_id") == wedding_id and payment.get("status") == "pending"
            ), "amount")
            if pending_offline_paise:
                raise RoyalKnotException(
                    status_code=409,
                    detail="A couple-reported offline payment is awaiting Planner verification. Review it before creating an online link.",
                    error_code="PENDING_OFFLINE_PAYMENT_REVIEW",
                )
            outstanding_paise = max(0, to_paise(package_fee) - paid_paise)
            if outstanding_paise <= 0:
                raise RoyalKnotException(status_code=409, detail="The recorded contract balance is already paid.", error_code="CONTRACT_ALREADY_PAID")
            if outstanding_paise < 100:
                raise RoyalKnotException(status_code=422, detail="Online payment links require a minimum remaining balance of ₹1.00.", error_code="PAYMENT_BELOW_GATEWAY_MINIMUM")

            link_id = f"pl-{uuid.uuid4().hex}"
            expires_at = now + timedelta(hours=24)
            intent = {
                "id": link_id,
                "wedding_id": wedding_id,
                "created_by_user_id": user_id,
                "provider_link_id": None,
                "reference_id": link_id,
                "client_request_id": request_id,
                "status": "creating",
                "amount_paise": outstanding_paise,
                "amount_paid_paise": 0,
                "currency": "INR",
                "stage": stage,
                "short_url": None,
                "created_at": now,
                "updated_at": now,
                "expires_at": expires_at,
            }
            store.payment_links[link_id] = intent

        assert intent is not None
        customer = store.users.get(user_id, {})
        payload = {
            "amount": intent["amount_paise"],
            "currency": "INR",
            "accept_partial": True,
            "first_min_partial_amount": 100,
            "expire_by": int(intent["expires_at"].timestamp()),
            "reference_id": intent["reference_id"],
            "description": f"EverWed contract payment {wedding_id}",
            "customer": {
                "name": customer.get("name", "EverWed couple")[:50],
                "email": customer.get("email", ""),
                "contact": customer.get("phone", ""),
            },
            "notify": {"sms": False, "email": False},
            "reminder_enable": False,
            "notes": {"everwed_wedding_id": wedding_id, "everwed_stage": stage},
        }
        try:
            remote = await gateway.create_payment_link(payload)
        except PaymentProviderError as exc:
            with store.transaction(immediate=True):
                current = store.payment_links.get(intent["id"])
                if current and current["status"] == "creating":
                    current["status"] = "creation_unknown" if exc.outcome_unknown else "failed"
                    current["updated_at"] = datetime.now(timezone.utc)
                    store.payment_links[current["id"]] = current
            raise RoyalKnotException(
                status_code=502,
                detail=("The payment provider response is uncertain. Do not retry; contact the Founder to reconcile this attempt." if exc.outcome_unknown else str(exc)),
                error_code="PAYMENT_PROVIDER_ERROR",
            ) from exc

        with store.transaction(immediate=True):
            current = store.payment_links.get(intent["id"])
            if not current or current["status"] != "creating":
                raise RoyalKnotException(status_code=503, detail="The payment link was created but could not be reconciled locally.", error_code="PAYMENT_LINK_RECONCILIATION_REQUIRED")
            current["provider_link_id"] = str(remote["id"])
            current["short_url"] = str(remote["short_url"])
            current["status"] = "created"
            current["updated_at"] = datetime.now(timezone.utc)
            store.payment_links[current["id"]] = current
        return _link_response(current)

    @staticmethod
    def list_payment_links(wedding_id: str) -> list[ClientPaymentLinkResponse]:
        now = datetime.now(timezone.utc)
        with store.transaction(immediate=True):
            for link in store.payment_links.values():
                if link.get("wedding_id") == wedding_id and link.get("status") in {"created", "partially_paid"} and link.get("expires_at") and link["expires_at"] <= now:
                    link["status"] = "expired"
                    link["updated_at"] = now
                    store.payment_links[link["id"]] = link
        links = [item for item in store.payment_links.values() if item.get("wedding_id") == wedding_id]
        links.sort(key=lambda item: item.get("created_at", datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
        return [_link_response(item) for item in links]

    @staticmethod
    def verify_webhook_signature(raw_body: bytes, signature: str, secret: str) -> bool:
        if not signature or not re.fullmatch(r"[0-9a-fA-F]{64}", signature):
            return False
        expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature.lower())

    @staticmethod
    def process_webhook(raw_body: bytes, event_id: str, event_type: str) -> dict[str, Any]:
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,120}", event_id or ""):
            raise RoyalKnotException(status_code=400, detail="Invalid Razorpay event identifier.", error_code="INVALID_WEBHOOK_EVENT")
        try:
            body = json.loads(raw_body)
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise RoyalKnotException(status_code=400, detail="Invalid webhook JSON.", error_code="INVALID_WEBHOOK_JSON") from exc
        if not isinstance(body, dict) or body.get("event") != event_type:
            raise RoyalKnotException(status_code=400, detail="Webhook event header and body do not match.", error_code="INVALID_WEBHOOK_EVENT")
        supported = {"payment_link.paid", "payment_link.partially_paid", "payment_link.cancelled", "payment_link.expired"}
        if event_type not in supported:
            return {"accepted": True, "ignored": True}

        payload = body.get("payload") or {}
        entity = ((payload.get("payment_link") or {}).get("entity") or {})
        provider_link_id = entity.get("id")
        reference_id = entity.get("reference_id")
        if not provider_link_id or not reference_id:
            raise RoyalKnotException(status_code=400, detail="Payment Link identifiers are missing from the webhook.", error_code="INVALID_WEBHOOK_PAYLOAD")

        with store.transaction(immediate=True):
            if any(item.get("provider_event_id") == event_id for item in store.payment_webhook_events.values()):
                return {"accepted": True, "duplicate": True}
            link = store.payment_links.get(str(reference_id))
            if not link or link.get("provider_link_id") != str(provider_link_id):
                raise RoyalKnotException(status_code=400, detail="This payment link is not registered to EverWed.", error_code="UNKNOWN_PAYMENT_LINK")
            if int(entity.get("amount", -1)) != int(link["amount_paise"]) or entity.get("currency", "INR") != "INR":
                raise RoyalKnotException(status_code=400, detail="Payment amount or currency does not match the recorded contract link.", error_code="PAYMENT_AMOUNT_MISMATCH")

            payments = entity.get("payments") or []
            paid_total = int(entity.get("amount_paid", 0))
            if not isinstance(payments, list) or paid_total < int(link.get("amount_paid_paise", 0)):
                raise RoyalKnotException(status_code=503, detail="The payment notification is incomplete; retry delivery.", error_code="PAYMENT_WEBHOOK_INCOMPLETE")

            added_total = 0
            now = datetime.now(timezone.utc)
            for payment in payments:
                if not isinstance(payment, dict) or payment.get("status") not in {"captured", "success"}:
                    continue
                payment_id = str(payment.get("payment_id", ""))
                amount_paise = int(payment.get("amount", 0))
                if not payment_id or amount_paise <= 0:
                    raise RoyalKnotException(status_code=503, detail="The captured payment details are incomplete; retry delivery.", error_code="PAYMENT_WEBHOOK_INCOMPLETE")
                exists = any(
                    item.get("provider_payment_id") == payment_id
                    or item.get("transaction_reference") == payment_id
                    for item in store.client_payments.values()
                )
                if exists:
                    continue
                created_at = datetime.fromtimestamp(int(payment.get("created_at", int(now.timestamp()))), tz=timezone.utc)
                method = str(payment.get("method", "online")).replace("_", " ").title()
                record = {
                    "id": f"pay-client-{uuid.uuid4().hex}",
                    "wedding_id": link["wedding_id"],
                    "stage": link["stage"],
                    "amount": from_paise(amount_paise),
                    "payment_method": f"Razorpay {method}"[:80],
                    "transaction_reference": payment_id,
                    "payment_date": created_at.date().isoformat(),
                    "status": "received",
                    "notes": "Captured online through Razorpay.",
                    "provider": "razorpay",
                    "provider_payment_id": payment_id,
                    "provider_payment_link_id": str(provider_link_id),
                    "created_at": created_at,
                }
                store.client_payments[record["id"]] = record
                added_total += amount_paise

            link_paid_total = sum_paise((
                item for item in store.client_payments.values()
                if item.get("provider_payment_link_id") == str(provider_link_id)
                and item.get("status") in {"received", "verified"}
            ), "amount")
            if link_paid_total != paid_total:
                raise RoyalKnotException(status_code=503, detail="Captured Razorpay payments do not reconcile to the link total; retry delivery.", error_code="PAYMENT_RECONCILIATION_REQUIRED")
            if paid_total > int(link["amount_paise"]):
                raise RoyalKnotException(status_code=400, detail="Razorpay reports payment beyond the issued link amount.", error_code="PAYMENT_AMOUNT_MISMATCH")

            link["amount_paid_paise"] = paid_total
            link["updated_at"] = now
            if event_type == "payment_link.paid" or entity.get("status") == "paid":
                link["status"] = "paid"
            elif event_type == "payment_link.partially_paid" or entity.get("status") == "partially_paid":
                link["status"] = "partially_paid"
            elif link.get("status") != "paid" and event_type == "payment_link.cancelled":
                link["status"] = "cancelled"
            elif link.get("status") != "paid" and event_type == "payment_link.expired":
                link["status"] = "expired"
            store.payment_links[link["id"]] = link
            store.payment_webhook_events[event_id] = {
                "id": event_id,
                "provider_event_id": event_id,
                "event_type": event_type,
                "processed_at": now,
            }
            logger.info("Processed Razorpay event %s for a saved wedding payment link", event_type)
            return {"accepted": True, "payments_recorded": added_total > 0}
