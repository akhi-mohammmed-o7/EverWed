"""
Royal Knot OS — Financial Management API Routes.
"""

from __future__ import annotations

import json
from typing import List
from fastapi import APIRouter, Depends, Header, Query, Request, status

from app.api.dependencies import ensure_wedding_access, require_role, require_wedding_query_access
from app.core.config import get_settings
from app.core.exceptions import RoyalKnotException
from app.schemas.common import APIResponse
from app.schemas.finance import (
    ClientPaymentCreate,
    ClientPaymentResponse,
    ClientPaymentLinkCreate,
    ClientPaymentLinkResponse,
    VendorBillCreate,
    VendorBillResponse,
    VendorPaymentCreate,
    VendorPaymentResponse,
    WeddingFinancialSummary,
)
from app.services.finance_service import FinanceService
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])


@router.post("/client-payments", response_model=APIResponse[ClientPaymentResponse], status_code=status.HTTP_201_CREATED)
async def record_client_payment(
    payload: ClientPaymentCreate,
    current_user: dict = Depends(require_role("admin", "planner", "finance")),
):
    """Record a staged client payment (booking_deposit, advance_payment, final_settlement)."""
    ensure_wedding_access(current_user, payload.wedding_id)
    data = FinanceService.record_client_payment(payload)
    return APIResponse(success=True, data=data)


@router.get("/client-payments", response_model=APIResponse[List[ClientPaymentResponse]])
async def list_client_payments(
    wedding_id: str = Query(..., description="Wedding ID"),
    _: dict = Depends(require_wedding_query_access),
):
    """List client payments and transactions for a wedding."""
    data = FinanceService.list_client_payments(wedding_id)
    return APIResponse(success=True, data=data)


@router.get("/client-payment-links", response_model=APIResponse[List[ClientPaymentLinkResponse]])
async def list_client_payment_links(
    wedding_id: str = Query(..., description="Wedding ID"),
    current_user: dict = Depends(require_role("admin", "planner", "finance", "couple")),
):
    ensure_wedding_access(current_user, wedding_id)
    data = PaymentService.list_payment_links(wedding_id)
    return APIResponse(success=True, data=data)


@router.post("/client-payment-links", response_model=APIResponse[ClientPaymentLinkResponse], status_code=status.HTTP_201_CREATED)
async def create_client_payment_link(
    payload: ClientPaymentLinkCreate,
    idempotency_key: str = Header(..., alias="Idempotency-Key", min_length=8, max_length=100),
    current_user: dict = Depends(require_role("admin", "planner", "finance", "couple")),
):
    ensure_wedding_access(current_user, payload.wedding_id)
    data = await PaymentService.create_payment_link(
        wedding_id=payload.wedding_id,
        user_id=current_user["user_id"],
        stage=payload.stage,
        request_id=idempotency_key,
        settings=get_settings(),
    )
    return APIResponse(success=True, data=data)


@router.post("/razorpay/webhook", response_model=APIResponse[dict])
async def razorpay_webhook(
    request: Request,
    signature: str | None = Header(None, alias="X-Razorpay-Signature"),
    event_id: str | None = Header(None, alias="X-Razorpay-Event-Id"),
):
    settings = get_settings()
    webhook_secret = settings.razorpay_webhook_secret.get_secret_value()
    if not webhook_secret:
        raise RoyalKnotException(status_code=503, detail="Payment webhook is not configured.", error_code="PAYMENT_WEBHOOK_NOT_CONFIGURED")
    raw_body = await request.body()
    if len(raw_body) > 1_000_000:
        raise RoyalKnotException(status_code=413, detail="Webhook payload is too large.", error_code="WEBHOOK_PAYLOAD_TOO_LARGE")
    if not PaymentService.verify_webhook_signature(raw_body, signature or "", webhook_secret):
        raise RoyalKnotException(status_code=400, detail="Invalid Razorpay webhook signature.", error_code="INVALID_WEBHOOK_SIGNATURE")
    try:
        envelope = json.loads(raw_body)
        event_type = str(envelope.get("event", "")) if isinstance(envelope, dict) else ""
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise RoyalKnotException(status_code=400, detail="Invalid webhook JSON.", error_code="INVALID_WEBHOOK_JSON") from exc
    if not event_id:
        raise RoyalKnotException(status_code=400, detail="Missing Razorpay event identifier.", error_code="INVALID_WEBHOOK_EVENT")
    data = PaymentService.process_webhook(raw_body, event_id, event_type)
    return APIResponse(success=True, data=data)


@router.post("/vendor-bills", response_model=APIResponse[VendorBillResponse], status_code=status.HTTP_201_CREATED)
async def record_vendor_bill(
    payload: VendorBillCreate,
    current_user: dict = Depends(require_role("admin", "planner", "finance")),
):
    """
    Record an actual vendor invoice.
    Enforces mandatory 'variance_reason' if final billed amount exceeds originally agreed quote price.
    """
    ensure_wedding_access(current_user, payload.wedding_id)
    data = FinanceService.record_vendor_bill(payload)
    return APIResponse(success=True, data=data)


@router.get("/vendor-bills", response_model=APIResponse[List[VendorBillResponse]])
async def list_vendor_bills(
    wedding_id: str = Query(..., description="Wedding ID"),
    current_user: dict = Depends(require_role("admin", "planner", "finance")),
):
    """List vendor bills, payments made, and outstanding balances."""
    ensure_wedding_access(current_user, wedding_id)
    data = FinanceService.list_vendor_bills(wedding_id)
    return APIResponse(success=True, data=data)


@router.post("/vendor-payments", response_model=APIResponse[VendorPaymentResponse], status_code=status.HTTP_201_CREATED)
async def record_vendor_payment(
    payload: VendorPaymentCreate,
    current_user: dict = Depends(require_role("admin", "planner", "finance")),
):
    """Record a real vendor payment already made; this endpoint does not transfer funds."""
    bill = FinanceService.get_vendor_bill(payload.bill_id)
    ensure_wedding_access(current_user, bill["wedding_id"])
    data = FinanceService.record_vendor_payment(payload)
    return APIResponse(success=True, data=data)


@router.get("/weddings/{wedding_id}/summary", response_model=APIResponse[WeddingFinancialSummary])
async def get_wedding_financial_summary(
    wedding_id: str,
    current_user: dict = Depends(require_role("admin", "planner", "finance")),
):
    """
    Retrieve wedding-level financial statement:
    Contracted revenue, client receivables, vendor payables, cost variances, and true agency net profit.
    """
    ensure_wedding_access(current_user, wedding_id)
    data = FinanceService.get_wedding_financial_summary(wedding_id)
    return APIResponse(success=True, data=data)

