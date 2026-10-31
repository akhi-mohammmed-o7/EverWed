"""
Royal Knot OS — Enquiry and Client schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class MeetingRecord(BaseModel):
    meeting_date: datetime
    location_or_link: str
    notes: str
    outcome: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EnquiryBase(BaseModel):
    bride_name: str
    groom_name: str
    contact_email: str
    contact_phone: str
    enquiry_source: str = "Direct"  # WhatsApp, Instagram, Call, Referral, Direct
    package_type: str = "Full-Service"  # "Full-Service" or "Partial/Day-of"
    target_date: Optional[str] = None
    destination: str = "Jaipur"  # Jaipur, Udaipur, etc.
    estimated_guests: int = 400
    theme: str = "Royal Heritage"  # Royal Heritage, Beach Chic, Modern Palace, etc.
    estimated_budget: float = Field(..., description="Estimated maximum budget in INR")
    requirements: Optional[str] = None


class EnquiryCreate(EnquiryBase):
    pass


class EnquiryUpdate(BaseModel):
    status: Optional[str] = None  # new, meeting_scheduled, agreement_sent, confirmed, lost
    meeting: Optional[MeetingRecord] = None
    agreement_signed: Optional[bool] = None
    agreement_file: Optional[str] = None
    requirements: Optional[str] = None
    estimated_budget: Optional[float] = None
    estimated_guests: Optional[int] = None


class EnquiryResponse(EnquiryBase):
    id: str
    status: str = "new"  # new, meeting_scheduled, agreement_sent, confirmed, lost
    meetings: List[MeetingRecord] = []
    agreement_signed: bool = False
    agreement_file: Optional[str] = None
    converted_wedding_id: Optional[str] = None
    odoo_lead_id: Optional[int] = None
    odoo_partner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class ConvertEnquiryRequest(BaseModel):
    package_type: Optional[str] = None
    confirmed_budget: Optional[float] = None
    primary_venue: Optional[str] = None
    wedding_start_date: Optional[str] = None
    wedding_end_date: Optional[str] = None
