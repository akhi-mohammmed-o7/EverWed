"""
Royal Knot OS — Financial Management API Routes.
"""

from __future__ import annotations

from typing import List
from fastapi import APIRouter, Query, status

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
async def record_client_payment(payload: ClientPaymentCreate):
    """Record a staged client payment (booking_deposit, advance_payment, final_settlement)."""
    data = FinanceService.record_client_payment(payload)
    return APIResponse(success=True, data=data)


@router.get("/client-payments", response_model=APIResponse[List[ClientPaymentResponse]])
async def list_client_payments(wedding_id: str = Query(..., description="Wedding ID")):
    """List client payments and transactions for a wedding."""
    data = FinanceService.list_client_payments(wedding_id)
    return APIResponse(success=True, data=data)


@router.post("/vendor-bills", response_model=APIResponse[VendorBillResponse], status_code=status.HTTP_201_CREATED)
async def record_vendor_bill(payload: VendorBillCreate):
    """
    Record an actual vendor invoice.
    Enforces mandatory 'variance_reason' if final billed amount exceeds originally agreed quote price.
    """
    data = FinanceService.record_vendor_bill(payload)
    return APIResponse(success=True, data=data)


@router.get("/vendor-bills", response_model=APIResponse[List[VendorBillResponse]])
async def list_vendor_bills(wedding_id: str = Query(..., description="Wedding ID")):
    """List vendor bills, payments made, and outstanding balances."""
    data = FinanceService.list_vendor_bills(wedding_id)
    return APIResponse(success=True, data=data)


@router.post("/vendor-payments", response_model=APIResponse[VendorPaymentResponse], status_code=status.HTTP_201_CREATED)
async def record_vendor_payment(payload: VendorPaymentCreate):
    """Record an advance or final settlement payment to a vendor, avoiding overpayment."""
    data = FinanceService.record_vendor_payment(payload)
    return APIResponse(success=True, data=data)


@router.get("/weddings/{wedding_id}/summary", response_model=APIResponse[WeddingFinancialSummary])
async def get_wedding_financial_summary(wedding_id: str):
    """
    Retrieve wedding-level financial statement:
    Contracted revenue, client receivables, vendor payables, cost variances, and true agency net profit.
    """
    data = FinanceService.get_wedding_financial_summary(wedding_id)
    return APIResponse(success=True, data=data)
