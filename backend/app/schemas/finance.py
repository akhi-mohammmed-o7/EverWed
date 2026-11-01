"""
Royal Knot OS — Financial Management & Accounting Schemas.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class ClientPaymentCreate(BaseModel):
    wedding_id: str = Field(..., min_length=1, max_length=120)
    stage: Literal["booking_deposit", "advance_payment", "final_settlement", "extra_charge"] = Field(..., description="Client payment milestone")
    amount: float = Field(..., gt=0, description="Payment amount in INR")
    payment_method: str = Field(default="Bank Transfer", min_length=1, max_length=80)
    transaction_reference: str = Field(..., min_length=1, max_length=120)
    payment_date: str  # YYYY-MM-DD
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("amount")
    @classmethod
    def validate_paise_precision(cls, value: float) -> float:
        try:
            amount = Decimal(str(value))
        except InvalidOperation as exc:
            raise ValueError("Payment amount is invalid") from exc
        if not amount.is_finite() or amount <= 0:
            raise ValueError("Payment amount must be greater than zero")
        if amount != amount.quantize(Decimal("0.01")):
            raise ValueError("Payment amount cannot have more than two decimal places")
        return float(amount)

    @field_validator("transaction_reference")
    @classmethod
    def normalize_transaction_reference(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Enter the actual bank, cheque, UPI, or receipt reference")
        return value

    @field_validator("payment_method")
    @classmethod
    def normalize_client_payment_method(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Payment method is required")
        return value

    @field_validator("payment_date")
    @classmethod
    def validate_client_payment_date(cls, value: str) -> str:
        try:
            parsed = date.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("Payment date must use YYYY-MM-DD format") from exc
        if parsed.isoformat() != value:
            raise ValueError("Payment date must use YYYY-MM-DD format")
        return value


class ClientPaymentResponse(BaseModel):
    id: str
    wedding_id: str
    stage: str
    amount: float
    payment_method: str
    transaction_reference: str
    payment_date: str
    status: str = "received"  # pending, received, verified, failed
    notes: Optional[str] = None
    odoo_payment_id: Optional[int] = None
    provider: Optional[str] = None
    provider_payment_id: Optional[str] = None
    provider_payment_link_id: Optional[str] = None
    created_at: datetime


class ClientPaymentLinkCreate(BaseModel):
    wedding_id: str
    stage: Literal["booking_deposit", "advance_payment", "final_settlement"] = "advance_payment"


class ClientPaymentLinkResponse(BaseModel):
    id: str
    wedding_id: str
    amount: float
    amount_paid: float = 0
    amount_due: float
    currency: str = "INR"
    status: str
    provider: str = "razorpay"
    provider_link_id: Optional[str] = None
    short_url: Optional[str] = None
    stage: str
    created_at: datetime
    expires_at: Optional[datetime] = None


class VendorBillCreate(BaseModel):
    wedding_id: str
    vendor_id: str
    event_id: Optional[str] = None
    quote_id: Optional[str] = None
    bill_number: str = Field(..., min_length=1, max_length=120)
    agreed_amount: float = Field(..., ge=0, description="Originally agreed price in INR from selected quote")
    billed_amount: float = Field(..., gt=0, description="Final invoiced amount in INR")
    variance_reason: Optional[str] = Field(None, description="Mandatory if billed_amount exceeds agreed_amount (e.g. extra plates, overtime)")
    bill_date: str  # YYYY-MM-DD
    due_date: str  # YYYY-MM-DD

    @field_validator("bill_number")
    @classmethod
    def normalize_bill_number(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Bill number is required")
        return value

    @field_validator("bill_date", "due_date")
    @classmethod
    def validate_bill_dates(cls, value: str) -> str:
        try:
            parsed = date.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("Bill dates must use YYYY-MM-DD format") from exc
        if parsed.isoformat() != value:
            raise ValueError("Bill dates must use YYYY-MM-DD format")
        return value

    @model_validator(mode="after")
    def validate_bill_period(self):
        if self.due_date < self.bill_date:
            raise ValueError("Due date must be on or after the bill date")
        return self


class VendorPaymentCreate(BaseModel):
    bill_id: str
    amount: float = Field(..., gt=0, description="Amount paid in INR")
    payment_type: Literal["advance", "partial", "final"] = "advance"
    payment_method: str = Field(default="Bank Transfer", min_length=1, max_length=80)
    transaction_reference: str = Field(..., min_length=1, max_length=120)
    payment_date: str
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("amount")
    @classmethod
    def validate_paise_precision(cls, value: float) -> float:
        try:
            amount = Decimal(str(value))
        except InvalidOperation as exc:
            raise ValueError("Payment amount is invalid") from exc
        if not amount.is_finite() or amount <= 0:
            raise ValueError("Payment amount must be greater than zero")
        if amount != amount.quantize(Decimal("0.01")):
            raise ValueError("Payment amount cannot have more than two decimal places")
        return float(amount)

    @field_validator("transaction_reference")
    @classmethod
    def normalize_payment_reference(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Enter the actual bank, cheque, UPI, or receipt reference")
        return value

    @field_validator("payment_method")
    @classmethod
    def normalize_payment_method(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Payment method is required")
        return value

    @field_validator("payment_date")
    @classmethod
    def validate_payment_date(cls, value: str) -> str:
        try:
            parsed = date.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("Payment date must use YYYY-MM-DD format") from exc
        if parsed.isoformat() != value:
            raise ValueError("Payment date must use YYYY-MM-DD format")
        return value


class VendorPaymentResponse(BaseModel):
    id: str
    bill_id: str
    vendor_id: str
    amount: float
    payment_type: str
    payment_method: str
    transaction_reference: str
    payment_date: str
    notes: Optional[str] = None
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
    total_contract_value: float = Field(..., description="Total explicit signed package fee from client")
    client_paid_amount: float
    client_outstanding_receivable: float
    client_payment_status: str  # paid, partial, pending
    client_contract_missing: bool = False
    client_overpayment_amount: float = 0.0
    
    agreed_vendor_total: float
    actual_vendor_bills_total: float
    vendor_paid_amount: float
    vendor_outstanding_payable: float
    cost_variance: float
    
    net_agency_profit: float = Field(..., description="Revenue received/contracted minus actual vendor expenses")
    profit_margin_percentage: float

