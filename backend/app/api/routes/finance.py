"""
Royal Knot OS — Financial Management API Routes.
"""

from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import ensure_wedding_access, require_role, require_wedding_access, require_wedding_query_access
from app.schemas.common import APIResponse
from app.schemas.finance import (
    ClientPaymentCreate,
    ClientPaymentResponse,
    VendorBillCreate,
    VendorBillResponse,
    VendorPaymentCreate,
    VendorPaymentResponse,
    WeddingFinancialSummary,
)
from app.services.finance_service import FinanceService

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
    _: dict = Depends(require_wedding_query_access),
):
    """List vendor bills, payments made, and outstanding balances."""
    data = FinanceService.list_vendor_bills(wedding_id)
    return APIResponse(success=True, data=data)


@router.post("/vendor-payments", response_model=APIResponse[VendorPaymentResponse], status_code=status.HTTP_201_CREATED)
async def record_vendor_payment(
    payload: VendorPaymentCreate,
    _: dict = Depends(require_role("admin", "finance")),
):
    """Record an advance or final settlement payment to a vendor, avoiding overpayment."""
    data = FinanceService.record_vendor_payment(payload)
    return APIResponse(success=True, data=data)


@router.get("/weddings/{wedding_id}/summary", response_model=APIResponse[WeddingFinancialSummary])
async def get_wedding_financial_summary(wedding_id: str, _: dict = Depends(require_wedding_access)):
    """
    Retrieve wedding-level financial statement:
    Contracted revenue, client receivables, vendor payables, cost variances, and true agency net profit.
    """
    data = FinanceService.get_wedding_financial_summary(wedding_id)
    return APIResponse(success=True, data=data)

