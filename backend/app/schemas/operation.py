"""
Royal Knot OS — Wedding Operations & Day-of Schedule schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ScheduleItemBase(BaseModel):
    wedding_id: str
    event_id: str
    time_slot: str  # e.g., "17:00", "17:30"
    title: str  # e.g., "Baraat Procession Starts", "Varmala Ceremony"
    description: Optional[str] = None
    responsible_person: str
    location: str
    status: str = "pending"  # pending, in_progress, completed, delayed


class ScheduleItemCreate(BaseModel):
    time_slot: str
    title: str
    description: Optional[str] = None
    responsible_person: str
    location: str


class ScheduleItemUpdate(BaseModel):
    time_slot: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    responsible_person: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None


class ScheduleItemResponse(ScheduleItemBase):
    id: str
    created_at: datetime
    updated_at: datetime


class VendorArrivalLog(BaseModel):
    id: str
    wedding_id: str
    event_id: str
    vendor_id: str
    vendor_name: str
    service_category: str
    planned_arrival_time: str  # HH:MM
    actual_arrival_time: Optional[str] = None
    status: str = "expected"  # expected, arrived, delayed, absent
    contact_phone: Optional[str] = None
    delay_minutes: int = 0
    notes: Optional[str] = None


class OperationalIssueCreate(BaseModel):
    wedding_id: str
    event_id: str
    title: str  # e.g. "Generator failure at florist stage"
    severity: str = "medium"  # low, medium, high, critical
    owner: str  # Planner responsible for resolution
    action_taken: Optional[str] = None


class OperationalIssueResponse(BaseModel):
    id: str
    wedding_id: str
    event_id: str
    title: str
    severity: str
    owner: str
    status: str = "open"  # open, resolving, resolved
    action_taken: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None


class OperationsOverviewResponse(BaseModel):
    wedding_id: str
    wedding_title: str
    events_today: List[dict]
    schedule: List[ScheduleItemResponse]
    vendor_arrivals: List[VendorArrivalLog]
    active_issues: List[OperationalIssueResponse]
    resolved_issues_count: int
