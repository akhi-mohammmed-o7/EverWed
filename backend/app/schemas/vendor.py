"""
Royal Knot OS — Vendor and Quotation schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class VendorBase(BaseModel):
    name: str
    category: str  # Catering, Decor, Photography, Entertainment/DJ, Makeup, Hospitality, Logistics, Audio/Visual
    contact_person: str
    phone: str
    email: str
    city: str = "Jaipur"
    rating: float = 5.0
    services_offered: List[str] = []
    pricing_model_default: str = "fixed"  # "fixed" or "per_plate"
    bank_account_details: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    rating: Optional[float] = None
    services_offered: Optional[List[str]] = None
    bank_account_details: Optional[str] = None


class VendorResponse(VendorBase):
    id: str
    odoo_partner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class QuoteCreate(BaseModel):
    wedding_id: str
    vendor_id: str
    event_id: Optional[str] = None  # Specific event (e.g. Catering for Reception)
    category: str
    pricing_type: str = "fixed"  # "fixed" or "per_plate"
    unit_price: float = Field(..., description="Rate per plate or total fixed amount in INR")
    estimated_quantity: int = Field(1, description="Guest count for per-plate, or 1 for fixed")
    scope_of_work: str
    inclusions: List[str] = []
    exclusions: List[str] = []
    extra_hour_rate: Optional[float] = 0.0
    notes: Optional[str] = None


class QuoteResponse(BaseModel):
    id: str
    wedding_id: str
    vendor_id: str
    vendor_name: str
    vendor_category: str
    event_id: Optional[str] = None
    pricing_type: str  # fixed or per_plate
    unit_price: float
    estimated_quantity: int
    normalized_total: float = Field(..., description="Calculated total cost in INR based on quantity")
    scope_of_work: str
    inclusions: List[str] = []
    exclusions: List[str] = []
    extra_hour_rate: float = 0.0
    status: str = "draft"  # draft, submitted, selected, rejected
    odoo_purchase_order_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class QuoteComparisonItem(BaseModel):
    quote_id: str
    vendor_id: str
    vendor_name: str
    category: str
    pricing_type: str
    unit_price: float
    estimated_quantity: int
    normalized_total: float
    extra_hour_rate: float
    inclusions: List[str]
    status: str
    is_winner: bool = False


class QuoteComparisonResponse(BaseModel):
    wedding_id: str
    category: str
    guest_count: int
    quotes: List[QuoteComparisonItem]
    lowest_quote_id: Optional[str] = None
    selected_quote_id: Optional[str] = None
