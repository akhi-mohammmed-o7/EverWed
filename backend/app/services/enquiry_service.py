"""
Royal Knot OS — Enquiry and Client Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.core.config import get_settings
from app.core.exceptions import OdooRecordNotFound, RoyalKnotException
from app.integrations.odoo.client import get_odoo_client
from app.schemas.enquiry import (
    ConvertEnquiryRequest,
    EnquiryCreate,
    EnquiryResponse,
    EnquiryUpdate,
    MeetingRecord,
)
from app.services.store import STANDARD_WEDDING_TASKS, store

logger = logging.getLogger("royal_knot.enquiry_service")


class EnquiryService:
    @staticmethod
    def create_enquiry(payload: EnquiryCreate) -> EnquiryResponse:
        enquiry_id = f"enq-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        
        # Try Odoo sync if available
        odoo_lead_id = None
        odoo_partner_id = None
        settings = get_settings()
        if settings.odoo_configured:
            try:
                client = get_odoo_client()
                client.authenticate()
                # Create partner
                partner_vals = {
                    "name": f"{payload.bride_name} & {payload.groom_name}",
                    "email": payload.contact_email,
                    "phone": payload.contact_phone,
                    "customer_rank": 1,
                }
                odoo_partner_id = client.create("res.partner", partner_vals)
                # Create CRM lead
                lead_vals = {
                    "name": f"Wedding Enquiry: {payload.bride_name} & {payload.groom_name} ({payload.destination})",
                    "partner_id": odoo_partner_id,
                    "email_from": payload.contact_email,
                    "phone": payload.contact_phone,
                    "expected_revenue": payload.estimated_budget,
                    "description": f"Guests: {payload.estimated_guests} | Theme: {payload.theme} | Package: {payload.package_type}",
                }
                odoo_lead_id = client.create("crm.lead", lead_vals)
                logger.info("Created Odoo lead %s and partner %s", odoo_lead_id, odoo_partner_id)
            except Exception as exc:
                logger.warning("Could not sync enquiry to Odoo: %s", exc)

        data = {
            "id": enquiry_id,
            "bride_name": payload.bride_name,
            "groom_name": payload.groom_name,
            "contact_email": payload.contact_email,
            "contact_phone": payload.contact_phone,
            "enquiry_source": payload.enquiry_source,
            "package_type": payload.package_type,
            "target_date": payload.target_date,
            "destination": payload.destination,
            "estimated_guests": payload.estimated_guests,
            "theme": payload.theme,
            "estimated_budget": payload.estimated_budget,
            "requirements": payload.requirements,
            "status": "new",
            "meetings": [],
            "agreement_signed": False,
            "agreement_file": None,
            "converted_wedding_id": None,
            "odoo_lead_id": odoo_lead_id,
            "odoo_partner_id": odoo_partner_id,
            "created_at": now,
            "updated_at": now,
        }
        store.enquiries[enquiry_id] = data
        return EnquiryResponse(**data)

    @staticmethod
    def list_enquiries(status: Optional[str] = None) -> List[EnquiryResponse]:
        results = []
        for item in store.enquiries.values():
            if status and item.get("status") != status:
                continue
            results.append(EnquiryResponse(**item))
        # Newest first
        results.sort(key=lambda x: x.created_at, reverse=True)
        return results

    @staticmethod
    def get_enquiry(enquiry_id: str) -> EnquiryResponse:
        data = store.enquiries.get(enquiry_id)
        if not data:
            raise OdooRecordNotFound(detail=f"Enquiry with ID '{enquiry_id}' not found")
        return EnquiryResponse(**data)

    @staticmethod
    def update_enquiry(enquiry_id: str, payload: EnquiryUpdate) -> EnquiryResponse:
        data = store.enquiries.get(enquiry_id)
        if not data:
            raise OdooRecordNotFound(detail=f"Enquiry with ID '{enquiry_id}' not found")

        now = datetime.now(timezone.utc)
        if payload.status is not None:
            data["status"] = payload.status
        if payload.meeting is not None:
            data["meetings"].append(payload.meeting.model_dump())
            if data["status"] == "new":
                data["status"] = "meeting_scheduled"
        if payload.agreement_signed is not None:
            data["agreement_signed"] = payload.agreement_signed
            if payload.agreement_signed and data["status"] in ("new", "meeting_scheduled"):
                data["status"] = "agreement_sent"
        if payload.agreement_file is not None:
            data["agreement_file"] = payload.agreement_file
        if payload.requirements is not None:
            data["requirements"] = payload.requirements
        if payload.estimated_budget is not None:
            data["estimated_budget"] = payload.estimated_budget
        if payload.estimated_guests is not None:
            data["estimated_guests"] = payload.estimated_guests

        data["updated_at"] = now
        store.enquiries[enquiry_id] = data
        return EnquiryResponse(**data)

    @staticmethod
    def convert_to_wedding(enquiry_id: str, payload: ConvertEnquiryRequest) -> dict:
        enquiry = store.enquiries.get(enquiry_id)
        if not enquiry:
            raise OdooRecordNotFound(detail=f"Enquiry with ID '{enquiry_id}' not found")

        if enquiry.get("converted_wedding_id"):
            raise RoyalKnotException(
                status_code=400,
                detail=f"Enquiry '{enquiry_id}' has already been converted to wedding '{enquiry['converted_wedding_id']}'",
                error_code="ENQUIRY_ALREADY_CONVERTED",
            )

        now = datetime.now(timezone.utc)
        wedding_id = f"wed-{uuid.uuid4().hex[:8]}"
        title = f"The Royal Union: {enquiry['bride_name']} & {enquiry['groom_name']}"
        start_date = payload.wedding_start_date or enquiry.get("target_date") or "2026-12-10"
        end_date = payload.wedding_end_date or "2026-12-13"
        package_type = payload.package_type or enquiry.get("package_type") or "Full-Service"
        budget = payload.confirmed_budget or enquiry.get("estimated_budget") or 25000000.0  # 2.5 Crores default
        venue = payload.primary_venue or f"Heritage Palace, {enquiry.get('destination', 'Jaipur')}"

        # Try Odoo Project Creation
        odoo_project_id = None
        settings = get_settings()
        if settings.odoo_configured:
            try:
                client = get_odoo_client()
                client.authenticate()
                project_vals = {
                    "name": title,
                    "partner_id": enquiry.get("odoo_partner_id"),
                }
                odoo_project_id = client.create("project.project", project_vals)
            except Exception as exc:
                logger.warning("Could not sync wedding project to Odoo: %s", exc)

        wedding_data = {
            "id": wedding_id,
            "enquiry_id": enquiry_id,
            "title": title,
            "bride_name": enquiry["bride_name"],
            "groom_name": enquiry["groom_name"],
            "contact_phone": enquiry["contact_phone"],
            "contact_email": enquiry["contact_email"],
            "destination": enquiry.get("destination", "Jaipur"),
            "primary_venue": venue,
            "package_type": package_type,
            "guest_estimate": enquiry.get("estimated_guests", 400),
            "theme": enquiry.get("theme", "Royal Heritage"),
            "budget_allocated": budget,
            "start_date": start_date,
            "end_date": end_date,
            "status": "planning",
            "events_count": 0,
            "vendors_count": 0,
            "tasks_count": len(STANDARD_WEDDING_TASKS),
            "tasks_completed": 0,
            "total_agreed_vendor_cost": 0.0,
            "total_paid_by_client": 0.0,
            "total_paid_to_vendors": 0.0,
            "odoo_project_id": odoo_project_id,
            "odoo_partner_id": enquiry.get("odoo_partner_id"),
            "created_at": now,
            "updated_at": now,
        }
        store.weddings[wedding_id] = wedding_data

        # Instantly generate 25+ standard tasks for this wedding as mandated by the operational playbook
        for tpl in STANDARD_WEDDING_TASKS:
            task_id = f"task-{uuid.uuid4().hex[:8]}"
            store.tasks[task_id] = {
                "id": task_id,
                "wedding_id": wedding_id,
                "event_id": None,
                "title": tpl["title"],
                "category": tpl["category"],
                "owner": "Wedding Lead Planner",
                "due_date": start_date,  # initial reference due date
                "priority": tpl["priority"],
                "status": "to_plan",
                "notes": f"Standard {package_type} package requirement",
                "is_overdue": False,
                "odoo_task_id": None,
                "created_at": now,
                "updated_at": now,
            }

        # Update enquiry status
        enquiry["status"] = "confirmed"
        enquiry["converted_wedding_id"] = wedding_id
        enquiry["updated_at"] = now
        store.enquiries[enquiry_id] = enquiry

        return {
            "message": "Enquiry successfully converted to Wedding with 25+ standard operational tasks generated",
            "wedding": wedding_data,
        }
