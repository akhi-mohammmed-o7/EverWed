"""
Royal Knot OS — Wedding Operations Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.core.exceptions import OdooRecordNotFound
from app.schemas.operation import (
    OperationalIssueCreate,
    OperationalIssueResponse,
    OperationsOverviewResponse,
    ScheduleItemCreate,
    ScheduleItemResponse,
    ScheduleItemUpdate,
    VendorArrivalLog,
)
from app.services.store import store

logger = logging.getLogger("royal_knot.operation_service")


class OperationService:
    @staticmethod
    def add_schedule_item(wedding_id: str, event_id: str, payload: ScheduleItemCreate) -> ScheduleItemResponse:
        wedding = store.weddings.get(wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' not found")
        event = store.events.get(event_id)
        if not event:
            raise OdooRecordNotFound(detail=f"Event '{event_id}' not found")

        item_id = f"sch-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        data = {
            "id": item_id,
            "wedding_id": wedding_id,
            "event_id": event_id,
            "time_slot": payload.time_slot,
            "title": payload.title,
            "description": payload.description,
            "responsible_person": payload.responsible_person,
            "location": payload.location,
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        }
        store.schedules[item_id] = data
        return ScheduleItemResponse(**data)

    @staticmethod
    def list_schedule(wedding_id: str, event_id: Optional[str] = None) -> List[ScheduleItemResponse]:
        results = []
        for s in store.schedules.values():
            if s.get("wedding_id") != wedding_id:
                continue
            if event_id and s.get("event_id") != event_id:
                continue
            results.append(ScheduleItemResponse(**s))
        results.sort(key=lambda x: x.time_slot)
        return results

    @staticmethod
    def update_schedule_item(item_id: str, payload: ScheduleItemUpdate) -> ScheduleItemResponse:
        s = store.schedules.get(item_id)
        if not s:
            raise OdooRecordNotFound(detail=f"Schedule item '{item_id}' not found")
        now = datetime.now(timezone.utc)
        for field, val in payload.model_dump(exclude_unset=True).items():
            s[field] = val
        s["updated_at"] = now
        store.schedules[item_id] = s
        return ScheduleItemResponse(**s)

    @staticmethod
    def log_vendor_arrival(
        wedding_id: str,
        event_id: str,
        vendor_id: str,
        planned_arrival_time: str,
        actual_arrival_time: Optional[str] = None,
        delay_minutes: int = 0,
        notes: Optional[str] = None,
    ) -> VendorArrivalLog:
        vendor = store.vendors.get(vendor_id)
        vendor_name = vendor["name"] if vendor else "Vendor"
        category = vendor["category"] if vendor else "General"

        log_id = f"arr-{wedding_id}-{vendor_id}-{event_id}"
        status = "expected"
        if actual_arrival_time:
            status = "delayed" if delay_minutes > 15 else "arrived"

        data = {
            "id": log_id,
            "wedding_id": wedding_id,
            "event_id": event_id,
            "vendor_id": vendor_id,
            "vendor_name": vendor_name,
            "service_category": category,
            "planned_arrival_time": planned_arrival_time,
            "actual_arrival_time": actual_arrival_time,
            "status": status,
            "contact_phone": vendor.get("phone") if vendor else None,
            "delay_minutes": delay_minutes,
            "notes": notes,
        }
        store.vendor_arrivals[log_id] = data
        return VendorArrivalLog(**data)

    @staticmethod
    def report_issue(payload: OperationalIssueCreate) -> OperationalIssueResponse:
        wedding = store.weddings.get(payload.wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Wedding '{payload.wedding_id}' not found")

        issue_id = f"iss-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        data = {
            "id": issue_id,
            "wedding_id": payload.wedding_id,
            "event_id": payload.event_id,
            "title": payload.title,
            "severity": payload.severity,
            "owner": payload.owner,
            "status": "open",
            "action_taken": payload.action_taken,
            "created_at": now,
            "resolved_at": None,
        }
        store.operational_issues[issue_id] = data
        return OperationalIssueResponse(**data)

    @staticmethod
    def resolve_issue(issue_id: str, action_taken: str) -> OperationalIssueResponse:
        issue = store.operational_issues.get(issue_id)
        if not issue:
            raise OdooRecordNotFound(detail=f"Operational issue '{issue_id}' not found")
        issue["status"] = "resolved"
        issue["action_taken"] = action_taken
        issue["resolved_at"] = datetime.now(timezone.utc)
        store.operational_issues[issue_id] = issue
        return OperationalIssueResponse(**issue)

    @staticmethod
    def get_operations_overview(wedding_id: str) -> OperationsOverviewResponse:
        wedding = store.weddings.get(wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' not found")

        events = [e for e in store.events.values() if e.get("wedding_id") == wedding_id]
        schedule = [ScheduleItemResponse(**s) for s in store.schedules.values() if s.get("wedding_id") == wedding_id]
        schedule.sort(key=lambda x: x.time_slot)

        arrivals = [VendorArrivalLog(**a) for a in store.vendor_arrivals.values() if a.get("wedding_id") == wedding_id]
        active_issues = [
            OperationalIssueResponse(**i) for i in store.operational_issues.values()
            if i.get("wedding_id") == wedding_id and i.get("status") != "resolved"
        ]
        resolved_count = sum(
            1 for i in store.operational_issues.values()
            if i.get("wedding_id") == wedding_id and i.get("status") == "resolved"
        )

        return OperationsOverviewResponse(
            wedding_id=wedding_id,
            wedding_title=wedding["title"],
            events_today=events,
            schedule=schedule,
            vendor_arrivals=arrivals,
            active_issues=active_issues,
            resolved_issues_count=resolved_count,
        )

