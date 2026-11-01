"""
Royal Knot OS — Wedding Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.core.config import get_settings
from app.core.exceptions import OdooRecordNotFound, RoyalKnotException
from app.core.money import normalize_rupees, sum_paise, from_paise, to_paise
from app.integrations.odoo.client import get_odoo_client
from app.schemas.wedding import WeddingCreate, WeddingResponse, WeddingUpdate
from app.services.plan_service import generate_event_tasks, generate_standard_plan
from app.services.store import store

logger = logging.getLogger("royal_knot.wedding_service")


class WeddingService:
    @staticmethod
    def _active_planners() -> list[dict]:
        return [
            user for user in store.users.values()
            if user.get("role") == "planner"
            and user.get("active")
            and user.get("approval_status") not in {"pending", "rejected"}
        ]

    @staticmethod
    def _assign_wedding_record(wedding: dict, planner: dict) -> None:
        now = datetime.now(timezone.utc)
        previous_owners = {
            wedding.get("assigned_planner_name"),
            wedding.get("assigned_planner_email"),
        }
        previous_owners.discard(None)
        wedding["assigned_planner_id"] = planner["id"]
        wedding["assigned_planner_email"] = planner["email"]
        wedding["assigned_planner_name"] = planner["name"]
        wedding["updated_at"] = now
        store.weddings[wedding["id"]] = wedding
        for task in store.tasks.values():
            if task.get("wedding_id") == wedding["id"] and (
                task.get("owner") in {"Couple", "Lead Planner", "Unassigned"} or task.get("owner") in previous_owners
            ):
                task["owner"] = planner["name"]
                task["updated_at"] = now
                store.tasks[task["id"]] = task

    @staticmethod
    def assign_planner(wedding_id: str, planner_email: str) -> WeddingResponse:
        normalized_email = planner_email.strip().lower()
        with store.transaction(immediate=True):
            wedding = store.weddings.get(wedding_id)
            if not wedding:
                raise OdooRecordNotFound(detail=f"Wedding with ID '{wedding_id}' not found")
            planner = next(
                (user for user in store.users.values() if user.get("email") == normalized_email),
                None,
            )
            if not planner or planner.get("role") != "planner" or not planner.get("active"):
                raise RoyalKnotException(
                    status_code=422,
                    detail="An active Lead Planner account with that email is required.",
                    error_code="PLANNER_ACCOUNT_REQUIRED",
                )
            WeddingService._assign_wedding_record(wedding, planner)
        return WeddingResponse(**wedding)

    @staticmethod
    def assign_planner_by_uid(wedding_id: str, planner_uid: int) -> WeddingResponse:
        with store.transaction(immediate=True):
            wedding = store.weddings.get(wedding_id)
            if not wedding:
                raise OdooRecordNotFound(detail=f"Wedding with ID '{wedding_id}' not found")
            planner = next(
                (user for user in WeddingService._active_planners() if int(user.get("uid", 0)) == planner_uid),
                None,
            )
            if not planner:
                raise RoyalKnotException(
                    status_code=422,
                    detail="Choose a currently active, approved Planner.",
                    error_code="PLANNER_ACCOUNT_REQUIRED",
                )
            WeddingService._assign_wedding_record(wedding, planner)
        return WeddingResponse(**wedding)

    @staticmethod
    def auto_assign_unassigned_weddings() -> int:
        """Distribute existing unowned weddings across available planners."""
        assigned_count = 0
        with store.transaction(immediate=True):
            planners = WeddingService._active_planners()
            if not planners:
                return 0
            weddings = sorted(
                (wedding for wedding in store.weddings.values() if not wedding.get("assigned_planner_id")),
                key=lambda item: (str(item.get("created_at", "")), item["id"]),
            )
            workload = {
                planner["id"]: sum(
                    1 for wedding in store.weddings.values()
                    if wedding.get("assigned_planner_id") == planner["id"]
                )
                for planner in planners
            }
            for wedding in weddings:
                planner = min(planners, key=lambda item: (workload[item["id"]], int(item.get("uid", 0))))
                WeddingService._assign_wedding_record(wedding, planner)
                workload[planner["id"]] += 1
                assigned_count += 1
        return assigned_count

    @staticmethod
    def create_wedding(payload: WeddingCreate, *, couple_user_id: str | None = None, creator_user: dict | None = None, preferred_planner_uid: int | None = None, tradition: str | None = None, regional_customization: str | None = None, functions: list[dict] | None = None) -> WeddingResponse:
        wedding_id = f"wed-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # Odoo Project Sync if configured
        odoo_project_id = None
        settings = get_settings()
        if settings.odoo_configured and not couple_user_id:
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
            "tradition": tradition,
            "regional_customization": regional_customization,
            "budget_allocated": normalize_rupees(payload.budget_allocated),
            "package_fee": normalize_rupees(payload.package_fee) if payload.package_fee is not None else None,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "status": "planning",
            "created_by_role": "couple" if couple_user_id else "staff",
            "events_count": 0,
            "vendors_count": 0,
            "tasks_count": 0,
            "plan_generated_at": None,
            "tasks_completed": 0,
            "total_agreed_vendor_cost": 0.0,
            "total_paid_by_client": 0.0,
            "total_paid_to_vendors": 0.0,
            "odoo_project_id": odoo_project_id,
            "odoo_partner_id": None,
            "created_at": now,
            "updated_at": now,
        }
        if creator_user and creator_user.get("role") == "planner":
            planner = store.users.get(creator_user.get("user_id"))
            if planner and planner.get("active") and planner.get("role") == "planner":
                data["assigned_planner_id"] = planner["id"]
                data["assigned_planner_email"] = planner["email"]
                data["assigned_planner_name"] = planner["name"]
        with store.transaction(immediate=bool(couple_user_id)):
            couple = store.users.get(couple_user_id) if couple_user_id else None
            if couple_user_id and (not couple or not couple.get("active") or couple.get("role") != "couple" or couple.get("wedding_id")):
                raise RoyalKnotException(
                    status_code=409,
                    detail="This couple account already has a wedding or is not eligible for onboarding.",
                    error_code="COUPLE_ONBOARDING_CONFLICT",
                )
            if couple is not None:
                planners = WeddingService._active_planners()
                if preferred_planner_uid is not None:
                    planner = next(
                        (item for item in planners if int(item.get("uid", 0)) == preferred_planner_uid),
                        None,
                    )
                    if not planner:
                        raise RoyalKnotException(
                            status_code=422,
                            detail="Choose a currently active, approved Planner.",
                            error_code="PLANNER_ACCOUNT_REQUIRED",
                        )
                elif planners:
                    workload = {
                        item["id"]: sum(
                            1 for wedding in store.weddings.values()
                            if wedding.get("assigned_planner_id") == item["id"]
                        )
                        for item in planners
                    }
                    planner = min(planners, key=lambda item: (workload[item["id"]], int(item.get("uid", 0))))
                else:
                    planner = None
                if planner:
                    data["assigned_planner_id"] = planner["id"]
                    data["assigned_planner_email"] = planner["email"]
                    data["assigned_planner_name"] = planner["name"]
            store.weddings[wedding_id] = data
            for function in functions or []:
                event_id = f"evt-{uuid.uuid4().hex[:8]}"
                event = {
                    "id": event_id, "wedding_id": wedding_id, "name": function["name"].strip(),
                    "date": function["date"], "start_time": function["start_time"], "end_time": function["end_time"],
                    "venue_hall": payload.primary_venue, "coordinator_name": couple.get("name", "Couple") if couple else "Couple",
                    "coordinator_phone": couple.get("phone") if couple else None, "guest_estimate": payload.guest_estimate,
                    "status": "scheduled", "notes": None, "odoo_task_id": None, "created_at": now, "updated_at": now,
                }
                store.events[event_id] = event
                generate_event_tasks(wedding_id, event_id)
            data["events_count"] = len(functions or [])
            store.weddings[wedding_id] = data
            if couple is not None:
                couple["wedding_id"] = wedding_id
                couple["updated_at"] = now
                store.users[couple_user_id] = couple
                # A couple-created workspace receives its planning checklist
                # immediately; it no longer depends on an internal booking
                # deposit that only agency users can record.
                generate_standard_plan(wedding_id)

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
            agreed_vendor_cost = from_paise(sum_paise(
                (q for q in store.quotes.values() if q.get("wedding_id") == wid and q.get("status") == "selected"),
                "normalized_total",
            ))
            client_paid = from_paise(sum_paise(
                (p for p in store.client_payments.values() if p.get("wedding_id") == wid and p.get("status") in ("received", "verified")),
                "amount",
            ))
            bill_ids = {b["id"] for b in store.vendor_bills.values() if b.get("wedding_id") == wid}
            vendor_paid = from_paise(sum_paise(
                (vp for vp in store.vendor_payments.values() if vp.get("bill_id") in bill_ids),
                "amount",
            ))

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
        agreed_vendor_cost = from_paise(sum_paise(
            (q for q in store.quotes.values() if q.get("wedding_id") == wedding_id and q.get("status") == "selected"),
            "normalized_total",
        ))
        client_paid = from_paise(sum_paise(
            (p for p in store.client_payments.values() if p.get("wedding_id") == wedding_id and p.get("status") in ("received", "verified")),
            "amount",
        ))
        bill_ids = {b["id"] for b in store.vendor_bills.values() if b.get("wedding_id") == wedding_id}
        vendor_paid = from_paise(sum_paise(
            (vp for vp in store.vendor_payments.values() if vp.get("bill_id") in bill_ids),
            "amount",
        ))

        data["events_count"] = events_count
        data["tasks_count"] = len(tasks_all)
        data["tasks_completed"] = tasks_done
        data["total_agreed_vendor_cost"] = agreed_vendor_cost
        data["total_paid_by_client"] = client_paid
        data["total_paid_to_vendors"] = vendor_paid

        return WeddingResponse(**data)

    @staticmethod
    def update_wedding(wedding_id: str, payload: WeddingUpdate) -> WeddingResponse:
        with store.transaction(immediate=True):
            return WeddingService._update_wedding(wedding_id, payload)

    @staticmethod
    def _update_wedding(wedding_id: str, payload: WeddingUpdate) -> WeddingResponse:
        data = store.weddings.get(wedding_id)
        if not data:
            raise OdooRecordNotFound(detail=f"Wedding with ID '{wedding_id}' not found")

        now = datetime.now(timezone.utc)
        updates = payload.model_dump(exclude_unset=True)
        if "package_fee" in updates:
            paid_paise = sum_paise(
                (payment for payment in store.client_payments.values()
                 if payment.get("wedding_id") == wedding_id
                 and payment.get("status") in {"received", "verified"}),
                "amount",
            )
            proposed_fee = updates["package_fee"]
            proposed_paise = to_paise(proposed_fee) if proposed_fee is not None else 0
            if paid_paise and proposed_paise < paid_paise:
                raise RoyalKnotException(
                    status_code=409,
                    detail=f"The contract amount cannot be below payments already recorded (₹{from_paise(paid_paise):,.2f}).",
                    error_code="CONTRACT_BELOW_RECEIVED_PAYMENTS",
                )
            current_paise = to_paise(data.get("package_fee") or 0)
            active_link = any(
                link.get("wedding_id") == wedding_id
                and link.get("status") in {"creating", "created", "partially_paid", "creation_unknown"}
                and link.get("expires_at") and link["expires_at"] > now
                and int(link.get("amount_paise", 0)) > int(link.get("amount_paid_paise", 0))
                for link in store.payment_links.values()
            )
            if active_link and proposed_paise != current_paise:
                raise RoyalKnotException(
                    status_code=409,
                    detail="Reconcile or let the active online payment link expire before changing its contract amount.",
                    error_code="ACTIVE_ONLINE_PAYMENT_LINK",
                )
        for field, val in updates.items():
            if field in {"budget_allocated", "package_fee"} and val is not None:
                val = normalize_rupees(val)
            data[field] = val

        start_date = str(data.get("start_date", ""))
        end_date = str(data.get("end_date", ""))
        if start_date and end_date and end_date < start_date:
            raise RoyalKnotException(
                status_code=422,
                detail="Wedding end date must be on or after the start date.",
                error_code="WEDDING_DATE_INVALID",
            )
        # Existing scheduled functions must continue to fall inside the wedding
        # window; silently orphaning them outside the celebration is not allowed.
        if {"start_date", "end_date"} & set(updates):
            outside = [
                event for event in store.events.values()
                if event.get("wedding_id") == wedding_id
                and (str(event.get("date", "")) < start_date or str(event.get("date", "")) > end_date)
            ]
            if outside:
                raise RoyalKnotException(
                    status_code=422,
                    detail="Update the scheduled functions so they stay inside the new wedding dates.",
                    error_code="WEDDING_DATE_CONFLICT",
                )

        data["updated_at"] = now
        store.weddings[wedding_id] = data
        return WeddingService.get_wedding(wedding_id)

