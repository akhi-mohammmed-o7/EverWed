"""
Royal Knot OS — Wedding Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.core.config import get_settings
from app.core.exceptions import OdooRecordNotFound
from app.integrations.odoo.client import get_odoo_client
from app.schemas.wedding import WeddingCreate, WeddingResponse, WeddingUpdate
from app.services.store import STANDARD_WEDDING_TASKS, store

logger = logging.getLogger("royal_knot.wedding_service")


class WeddingService:
    @staticmethod
    def create_wedding(payload: WeddingCreate) -> WeddingResponse:
        wedding_id = f"wed-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # Odoo Project Sync if configured
        odoo_project_id = None
        settings = get_settings()
        if settings.odoo_configured:
            try:
                client = get_odoo_client()
                client.authenticate()
                project_vals = {
                    "name": payload.title,
                }
                odoo_project_id = client.create("project.project", project_vals)
            except Exception as exc:
                logger.warning("Could not sync wedding project to Odoo: %s", exc)

        data = {
            "id": wedding_id,
            "enquiry_id": payload.enquiry_id,
            "title": payload.title,
            "bride_name": payload.bride_name,
            "groom_name": payload.groom_name,
            "contact_phone": payload.contact_phone,
            "contact_email": payload.contact_email,
            "destination": payload.destination,
            "primary_venue": payload.primary_venue,
            "package_type": payload.package_type,
            "guest_estimate": payload.guest_estimate,
            "theme": payload.theme,
            "budget_allocated": payload.budget_allocated,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "status": "planning",
            "events_count": 0,
            "vendors_count": 0,
            "tasks_count": len(STANDARD_WEDDING_TASKS),
            "tasks_completed": 0,
            "total_agreed_vendor_cost": 0.0,
            "total_paid_by_client": 0.0,
            "total_paid_to_vendors": 0.0,
            "odoo_project_id": odoo_project_id,
            "odoo_partner_id": None,
            "created_at": now,
            "updated_at": now,
        }
        store.weddings[wedding_id] = data

        # Generate standard tasks
        for tpl in STANDARD_WEDDING_TASKS:
            task_id = f"task-{uuid.uuid4().hex[:8]}"
            store.tasks[task_id] = {
                "id": task_id,
                "wedding_id": wedding_id,
                "event_id": None,
                "title": tpl["title"],
                "category": tpl["category"],
                "owner": "Lead Planner",
                "due_date": payload.start_date,
                "priority": tpl["priority"],
                "status": "to_plan",
                "notes": f"Standard {payload.package_type} package requirement",
                "is_overdue": False,
                "odoo_task_id": None,
                "created_at": now,
                "updated_at": now,
            }

        return WeddingResponse(**data)

    @staticmethod
    def list_weddings(status: Optional[str] = None) -> List[WeddingResponse]:
        results = []
        for item in store.weddings.values():
            if status and item.get("status") != status:
                continue
            # Recalculate dynamic counts
            wid = item["id"]
            events_count = sum(1 for e in store.events.values() if e.get("wedding_id") == wid)
            tasks_all = [t for t in store.tasks.values() if t.get("wedding_id") == wid]
            tasks_done = sum(1 for t in tasks_all if t.get("status") == "done")
            agreed_vendor_cost = sum(
                q["normalized_total"] for q in store.quotes.values()
                if q.get("wedding_id") == wid and q.get("status") == "selected"
            )
            client_paid = sum(
                p["amount"] for p in store.client_payments.values()
                if p.get("wedding_id") == wid and p.get("status") in ("received", "verified")
            )
            vendor_paid = sum(
                vp["amount"] for b in store.vendor_bills.values() if b.get("wedding_id") == wid
                for vp in store.vendor_payments.values() if vp.get("bill_id") == b["id"]
            )

            item["events_count"] = events_count
            item["tasks_count"] = len(tasks_all)
            item["tasks_completed"] = tasks_done
            item["total_agreed_vendor_cost"] = agreed_vendor_cost
            item["total_paid_by_client"] = client_paid
            item["total_paid_to_vendors"] = vendor_paid

            results.append(WeddingResponse(**item))

        results.sort(key=lambda x: x.created_at, reverse=True)
        return results

    @staticmethod
    def get_wedding(wedding_id: str) -> WeddingResponse:
        data = store.weddings.get(wedding_id)
        if not data:
            raise OdooRecordNotFound(detail=f"Wedding with ID '{wedding_id}' not found")
        
        # Dynamic counts
        events_count = sum(1 for e in store.events.values() if e.get("wedding_id") == wedding_id)
        tasks_all = [t for t in store.tasks.values() if t.get("wedding_id") == wedding_id]
        tasks_done = sum(1 for t in tasks_all if t.get("status") == "done")
        agreed_vendor_cost = sum(
            q["normalized_total"] for q in store.quotes.values()
            if q.get("wedding_id") == wedding_id and q.get("status") == "selected"
        )
        client_paid = sum(
            p["amount"] for p in store.client_payments.values()
            if p.get("wedding_id") == wedding_id and p.get("status") in ("received", "verified")
        )
        vendor_paid = sum(
            vp["amount"] for b in store.vendor_bills.values() if b.get("wedding_id") == wedding_id
            for vp in store.vendor_payments.values() if vp.get("bill_id") == b["id"]
        )

        data["events_count"] = events_count
        data["tasks_count"] = len(tasks_all)
        data["tasks_completed"] = tasks_done
        data["total_agreed_vendor_cost"] = agreed_vendor_cost
        data["total_paid_by_client"] = client_paid
        data["total_paid_to_vendors"] = vendor_paid

        return WeddingResponse(**data)

    @staticmethod
    def update_wedding(wedding_id: str, payload: WeddingUpdate) -> WeddingResponse:
        data = store.weddings.get(wedding_id)
        if not data:
            raise OdooRecordNotFound(detail=f"Wedding with ID '{wedding_id}' not found")

        now = datetime.now(timezone.utc)
        for field, val in payload.model_dump(exclude_unset=True).items():
            data[field] = val
        data["updated_at"] = now
        store.weddings[wedding_id] = data
        return WeddingResponse(**data)

