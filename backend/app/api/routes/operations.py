"""
Royal Knot OS — Operations & Day-of Schedule API Routes.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Body, Query, status

from app.schemas.common import APIResponse
from app.schemas.operation import (
    OperationalIssueCreate,
    OperationalIssueResponse,
    OperationsOverviewResponse,
    ScheduleItemCreate,
    ScheduleItemResponse,
    ScheduleItemUpdate,
    VendorArrivalLog,
)
from app.services.operation_service import OperationService

router = APIRouter(prefix="/api/v1/operations", tags=["operations"])


@router.post("/weddings/{wedding_id}/events/{event_id}/schedule", response_model=APIResponse[ScheduleItemResponse], status_code=status.HTTP_201_CREATED)
async def add_schedule_item(wedding_id: str, event_id: str, payload: ScheduleItemCreate):
    """Add a minute-by-minute timeline item (e.g. Baraat procession, Varmala, Cake cutting)."""
    data = OperationService.add_schedule_item(wedding_id, event_id, payload)
    return APIResponse(success=True, data=data)


@router.get("/weddings/{wedding_id}/schedule", response_model=APIResponse[List[ScheduleItemResponse]])
async def list_schedule(wedding_id: str, event_id: Optional[str] = Query(None)):
    """Retrieve chronological schedule items for a wedding or event."""
    data = OperationService.list_schedule(wedding_id, event_id=event_id)
    return APIResponse(success=True, data=data)


@router.patch("/schedule/{item_id}", response_model=APIResponse[ScheduleItemResponse])
async def update_schedule_item(item_id: str, payload: ScheduleItemUpdate):
    """Update timeline status (pending, in_progress, completed, delayed)."""
    data = OperationService.update_schedule_item(item_id, payload)
    return APIResponse(success=True, data=data)


@router.post("/vendor-arrivals", response_model=APIResponse[VendorArrivalLog])
async def log_vendor_arrival(
    wedding_id: str = Body(...),
    event_id: str = Body(...),
    vendor_id: str = Body(...),
    planned_arrival_time: str = Body(...),
    actual_arrival_time: Optional[str] = Body(None),
    delay_minutes: int = Body(0),
    notes: Optional[str] = Body(None),
):
    """Log or update vendor arrival status to identify late arrivals in real time."""
    data = OperationService.log_vendor_arrival(
        wedding_id=wedding_id,
        event_id=event_id,
        vendor_id=vendor_id,
        planned_arrival_time=planned_arrival_time,
        actual_arrival_time=actual_arrival_time,
        delay_minutes=delay_minutes,
        notes=notes,
    )
    return APIResponse(success=True, data=data)


@router.post("/issues", response_model=APIResponse[OperationalIssueResponse], status_code=status.HTTP_201_CREATED)
async def report_operational_issue(payload: OperationalIssueCreate):
    """Log an on-site operational issue with assigned owner (e.g. generator fault, floral shortage)."""
    data = OperationService.report_issue(payload)
    return APIResponse(success=True, data=data)


@router.post("/issues/{issue_id}/resolve", response_model=APIResponse[OperationalIssueResponse])
async def resolve_operational_issue(issue_id: str, action_taken: str = Body(..., embed=True)):
    """Mark an operational issue as resolved with the documented resolution action."""
    data = OperationService.resolve_issue(issue_id, action_taken)
    return APIResponse(success=True, data=data)


@router.get("/weddings/{wedding_id}/overview", response_model=APIResponse[OperationsOverviewResponse])
async def get_operations_overview(wedding_id: str):
    """Consolidated live day-of operations overview: events, minute-by-minute schedule, vendor status, and open issues."""
    data = OperationService.get_operations_overview(wedding_id)
    return APIResponse(success=True, data=data)
