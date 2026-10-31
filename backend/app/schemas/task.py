"""
Royal Knot OS — Task and Planning schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    wedding_id: str
    event_id: Optional[str] = None
    title: str
    category: str = "Planning"  # Venue, Decor, Catering, Invitations, Logistics, Day-of, Legal/Contract
    owner: str = "Unassigned"
    due_date: str  # YYYY-MM-DD
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "to_plan"  # to_plan, in_progress, done
    notes: Optional[str] = None


class TaskCreate(BaseModel):
    event_id: Optional[str] = None
    title: str
    category: str = "Planning"
    owner: str
    due_date: str
    priority: str = "medium"
    notes: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    event_id: Optional[str] = None
    category: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TaskResponse(TaskBase):
    id: str
    is_overdue: bool = False
    odoo_task_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
