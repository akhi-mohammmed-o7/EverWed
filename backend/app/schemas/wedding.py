"""
Royal Knot OS — Wedding and Event schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class WeddingBase(BaseModel):
    title: str  # e.g., "The Royal Union: Aisha & Vikram"
    bride_name: str
    groom_name: str
    contact_phone: str
    contact_email: str
    destination: str = "Jaipur"
    primary_venue: str
    package_type: str = "Full-Service"  # "Full-Service" or "Partial/Day-of"
    guest_estimate: int = 400
    theme: str = "Royal Heritage"
    budget_allocated: float = Field(..., description="Agreed budget in INR")
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD


class WeddingCreate(WeddingBase):
    enquiry_id: Optional[str] = None


class WeddingUpdate(BaseModel):
    title: Optional[str] = None
    primary_venue: Optional[str] = None
    package_type: Optional[str] = None
    guest_estimate: Optional[int] = None
    theme: Optional[str] = None
    budget_allocated: Optional[float] = None
    status: Optional[str] = None  # planning, in_progress, completed, settled
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class WeddingResponse(WeddingBase):
    id: str
    enquiry_id: Optional[str] = None
    status: str = "planning"  # planning, in_progress, completed, settled
    events_count: int = 0
    vendors_count: int = 0
    tasks_count: int = 0
    tasks_completed: int = 0
    total_agreed_vendor_cost: float = 0.0
    total_paid_by_client: float = 0.0
    total_paid_to_vendors: float = 0.0
    odoo_project_id: Optional[int] = None
    odoo_partner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class EventBase(BaseModel):
    name: str  # Mehendi, Sangeet, Haldi, Wedding Ceremony, Reception
    wedding_id: str
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    venue_hall: str  # e.g. "Courtyard Garden", "Grand Ballroom"
    coordinator_name: str
    coordinator_phone: Optional[str] = None
    guest_estimate: int = 400
    status: str = "scheduled"  # scheduled, in_progress, completed, delayed
    notes: Optional[str] = None


class EventCreate(BaseModel):
    name: str
    date: str
    start_time: str
    end_time: str
    venue_hall: str
    coordinator_name: str
    coordinator_phone: Optional[str] = None
    guest_estimate: int = 400
    notes: Optional[str] = None


class EventUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    venue_hall: Optional[str] = None
    coordinator_name: Optional[str] = None
    coordinator_phone: Optional[str] = None
    guest_estimate: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class EventResponse(EventBase):
    id: str
    odoo_task_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

