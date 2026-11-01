"""
Royal Knot OS — Task and Planning schemas.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

TaskStatus = Literal["to_plan", "in_progress", "done"]
TaskPriority = Literal["low", "medium", "high", "urgent"]


def _validate_due_date(value: str) -> str:
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("Task due date must use YYYY-MM-DD format") from exc
    if parsed.isoformat() != value:
        raise ValueError("Task due date must use YYYY-MM-DD format")
    return value


class TaskBase(BaseModel):
    wedding_id: str
    event_id: Optional[str] = None
    title: str
    category: str = "Planning"  # Venue, Decor, Catering, Invitations, Logistics, Day-of, Legal/Contract
    owner: str = "Unassigned"
    due_date: str  # YYYY-MM-DD
    priority: TaskPriority = "medium"
    status: TaskStatus = "to_plan"
    notes: Optional[str] = None


class TaskCreate(BaseModel):
    event_id: Optional[str] = None
    title: str
    category: str = "Planning"
    owner: str
    due_date: str
    priority: TaskPriority = "medium"
    notes: Optional[str] = None

    @field_validator("due_date")
    @classmethod
    def validate_task_due_date(cls, value: str) -> str:
        return _validate_due_date(value)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    event_id: Optional[str] = None
    category: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    notes: Optional[str] = None

    @field_validator("due_date")
    @classmethod
    def validate_task_due_date(cls, value: str | None) -> str | None:
        return _validate_due_date(value) if value is not None else None


class TaskResponse(TaskBase):
    id: str
    is_overdue: bool = False
    odoo_task_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

