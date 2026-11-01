"""
Royal Knot OS — Wedding and Event schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from datetime import date
from pydantic import BaseModel, Field, model_validator


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
    budget_allocated: float = Field(..., description="Planning budget in INR")
    package_fee: Optional[float] = Field(None, ge=0, description="Agreed client fee in INR; distinct from the planning budget")
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD


class WeddingCreate(WeddingBase):
    enquiry_id: Optional[str] = None


class WeddingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    bride_name: Optional[str] = Field(None, min_length=1, max_length=120)
    groom_name: Optional[str] = Field(None, min_length=1, max_length=120)
    contact_phone: Optional[str] = Field(None, min_length=5, max_length=40)
    contact_email: Optional[str] = Field(None, min_length=3, max_length=254)
    destination: Optional[str] = Field(None, min_length=1, max_length=160)
    primary_venue: Optional[str] = Field(None, min_length=1, max_length=200)
    package_type: Optional[str] = None
    guest_estimate: Optional[int] = Field(None, gt=0, le=100000)
    theme: Optional[str] = Field(None, max_length=160)
    budget_allocated: Optional[float] = Field(None, ge=0)
    package_fee: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None  # planning, in_progress, completed, settled
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    tradition: Optional[str] = Field(None, max_length=120)
    regional_customization: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date is not None and self.end_date is not None:
            try:
                start = date.fromisoformat(self.start_date)
                end = date.fromisoformat(self.end_date)
            except ValueError as exc:
                raise ValueError("Wedding dates must use YYYY-MM-DD format") from exc
            if end < start:
                raise ValueError("Wedding end date must be on or after the start date")
        return self


class WeddingPlannerAssignment(BaseModel):
    planner_email: str = Field(min_length=3, max_length=254)


class WeddingPlannerSelection(BaseModel):
    planner_uid: int = Field(gt=0)


class PlannerDirectoryEntry(BaseModel):
    uid: int
    name: str
    bio: str = ""
    specialties: List[str] = Field(default_factory=list)
    destinations: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)


class CoupleWeddingOnboarding(BaseModel):
    partner_one_name: Optional[str] = Field(None, min_length=1, max_length=120)
    partner_two_name: Optional[str] = Field(None, min_length=1, max_length=120)
    destination: str = Field(min_length=1, max_length=160)
    primary_venue: str = Field(min_length=1, max_length=200)
    guest_estimate: int = Field(gt=0, le=100000)
    budget_allocated: float = Field(ge=0)
    start_date: str = Field(min_length=10, max_length=10)
    end_date: str = Field(min_length=10, max_length=10)
    theme: str = Field(default="", max_length=160)
    tradition: str = Field(default="", max_length=120)
    regional_customization: str = Field(default="", max_length=500)
    preferred_planner_uid: Optional[int] = Field(None, gt=0)
    functions: List["OnboardingFunction"] = Field(default_factory=list, max_length=20)

    @model_validator(mode="after")
    def validate_dates(self):
        try:
            start = date.fromisoformat(self.start_date)
            end = date.fromisoformat(self.end_date)
        except ValueError as exc:
            raise ValueError("Wedding dates must use YYYY-MM-DD format") from exc
        if end < start:
            raise ValueError("Wedding end date must be on or after the start date")
        return self


class OnboardingFunction(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    date: str = Field(min_length=10, max_length=10)
    start_time: str = Field(default="10:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(default="11:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")

    @model_validator(mode="after")
    def validate_function(self):
        if self.end_time <= self.start_time:
            raise ValueError("Function end time must be after its start time")
        date.fromisoformat(self.date)
        return self


class WeddingResponse(WeddingBase):
    id: str
    enquiry_id: Optional[str] = None
    status: str = "planning"  # planning, in_progress, completed, settled
    events_count: int = 0
    vendors_count: int = 0
    tasks_count: int = 0
    tasks_completed: int = 0
    assigned_planner_email: Optional[str] = None
    assigned_planner_name: Optional[str] = None
    tradition: Optional[str] = None
    regional_customization: Optional[str] = None
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

