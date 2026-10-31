"""
Royal Knot OS — Financial Management & Accounting Schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ClientPaymentCreate(BaseModel):
    wedding_id: str
    stage: str = Field(..., description="Stage: 'booking_deposit', 'advance_payment', 'final_settlement', 'extra_charge'")
    amount: float = Field(..., gt=0, description="Payment amount in INR")
    payment_method: str = "Bank Transfer"  # Bank Transfer, Cheque, UPI, Card
    transaction_reference: str
    payment_date: str  # YYYY-MM-DD
    notes: Optional[str] = None


class ClientPaymentResponse(BaseModel):
    id: str
    wedding_id: str
    stage: str
    amount: float
    payment_method: str
    transaction_reference: str
    payment_date: str
    status: str = "received"  # received, verified
    notes: Optional[str] = None
    odoo_payment_id: Optional[int] = None
    created_at: datetime


class VendorBillCreate(BaseModel):
    wedding_id: str
    vendor_id: str
    event_id: Optional[str] = None
    quote_id: Optional[str] = None
    bill_number: str
    agreed_amount: float = Field(..., description="Originally agreed price in INR from selected quote")
    billed_amount: float = Field(..., gt=0, description="Final invoiced amount in INR")
    variance_reason: Optional[str] = Field(None, description="Mandatory if billed_amount exceeds agreed_amount (e.g. extra plates, overtime)")
    bill_date: str  # YYYY-MM-DD
    due_date: str  # YYYY-MM-DD


class VendorPaymentCreate(BaseModel):
    bill_id: str
    amount: float = Field(..., gt=0, description="Amount paid in INR")
    payment_type: str = "advance"  # "advance" or "final"
    payment_method: str = "Bank Transfer"
    transaction_reference: str
    payment_date: str
    notes: Optional[str] = None


class VendorPaymentResponse(BaseModel):
    id: str
    bill_id: str
    vendor_id: str
    amount: float
    payment_type: str
    payment_method: str
    transaction_reference: str
    payment_date: str
    odoo_payment_id: Optional[int] = None
    created_at: datetime


class VendorBillResponse(BaseModel):
    id: str
    wedding_id: str
    vendor_id: str
    vendor_name: str
    vendor_category: str
    event_id: Optional[str] = None
    quote_id: Optional[str] = None
    bill_number: str
    agreed_amount: float
    billed_amount: float
    variance: float = 0.0
    variance_reason: Optional[str] = None
    total_paid: float = 0.0
    outstanding_balance: float = 0.0
    status: str = "pending"  # pending, partially_paid, paid
    payments: List[VendorPaymentResponse] = []
    bill_date: str
    due_date: str
    odoo_invoice_id: Optional[int] = None
    created_at: datetime


class WeddingFinancialSummary(BaseModel):
    wedding_id: str
    wedding_title: str
    total_contract_value: float = Field(..., description="Total package / agreed budget from client")
    client_paid_amount: float
    client_outstanding_receivable: float
    client_payment_status: str  # paid, partial, pending
    
    agreed_vendor_total: float
    actual_vendor_bills_total: float
    vendor_paid_amount: float
    vendor_outstanding_payable: float
    cost_variance: float
    
    net_agency_profit: float = Field(..., description="Revenue received/contracted minus actual vendor expenses")
    profit_margin_percentage: float

