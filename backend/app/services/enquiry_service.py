"""
Royal Knot OS — Enquiry and Client Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from app.core.config import get_settings
from app.core.exceptions import OdooRecordNotFound, RoyalKnotException
from app.core.money import normalize_rupees
from app.integrations.odoo.client import get_odoo_client
from app.schemas.enquiry import (
    ConvertEnquiryRequest,
    EnquiryCreate,
    EnquiryResponse,
    EnquiryUpdate,
    MeetingRecord,
)
from app.services.store import store

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
            "estimated_budget": normalize_rupees(payload.estimated_budget),
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
            data["estimated_budget"] = normalize_rupees(payload.estimated_budget)
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

        if not enquiry.get("agreement_signed"):
            raise RoyalKnotException(
                status_code=422,
                detail="A signed agreement is required before converting an enquiry into a wedding.",
                error_code="SIGNED_AGREEMENT_REQUIRED",
            )

        now = datetime.now(timezone.utc)
        wedding_id = f"wed-{uuid.uuid4().hex[:8]}"
        title = f"{enquiry['bride_name']} & {enquiry['groom_name']}"
        start_date = payload.wedding_start_date or enquiry.get("target_date")
        end_date = payload.wedding_end_date
        if not start_date or not end_date or not payload.primary_venue or not payload.primary_venue.strip():
            raise RoyalKnotException(
                status_code=422,
                detail="Wedding start date, end date, and primary venue are required for conversion.",
                error_code="WEDDING_SETUP_INCOMPLETE",
            )
        try:
            parsed_start = date.fromisoformat(start_date)
            parsed_end = date.fromisoformat(end_date)
        except ValueError as exc:
            raise RoyalKnotException(
                status_code=422,
                detail="Wedding dates must use YYYY-MM-DD format.",
                error_code="INVALID_WEDDING_DATES",
            ) from exc
        if parsed_end < parsed_start:
            raise RoyalKnotException(
                status_code=422,
                detail="Wedding end date must be on or after the start date.",
                error_code="INVALID_WEDDING_DATES",
            )
        package_type = payload.package_type or enquiry.get("package_type") or "Full-Service"
        budget = payload.confirmed_budget if payload.confirmed_budget is not None else enquiry.get("estimated_budget")
        if budget is None or budget <= 0:
            raise RoyalKnotException(
                status_code=422,
                detail="A positive planning budget must be confirmed before conversion.",
                error_code="CONFIRMED_BUDGET_REQUIRED",
            )
        if payload.confirmed_package_fee is None or payload.confirmed_package_fee <= 0:
            raise RoyalKnotException(
                status_code=422,
                detail="The confirmed client package fee must be recorded before conversion.",
                error_code="PACKAGE_FEE_REQUIRED",
            )
        venue = payload.primary_venue.strip()

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
            "budget_allocated": normalize_rupees(budget),
            "package_fee": normalize_rupees(payload.confirmed_package_fee) if payload.confirmed_package_fee is not None else None,
            "start_date": start_date,
            "end_date": end_date,
            "status": "planning",
            "events_count": 0,
            "vendors_count": 0,
            "tasks_count": 0,
            "plan_generated_at": None,
            "tasks_completed": 0,
            "total_agreed_vendor_cost": 0.0,
            "total_paid_by_client": 0.0,
            "total_paid_to_vendors": 0.0,
            "odoo_project_id": odoo_project_id,
            "odoo_partner_id": enquiry.get("odoo_partner_id"),
            "created_at": now,
            "updated_at": now,
        }
        with store.transaction(immediate=True):
            current_enquiry = store.enquiries.get(enquiry_id)
            if not current_enquiry:
                raise OdooRecordNotFound(detail=f"Enquiry '{enquiry_id}' not found")
            if current_enquiry.get("converted_wedding_id"):
                raise RoyalKnotException(
                    status_code=409,
                    detail="This enquiry has already been converted into a wedding.",
                    error_code="ENQUIRY_ALREADY_CONVERTED",
                )

            # Proposal conversion creates the wedding shell; the planning plan is
            # generated only when the booking deposit is actually recorded.
            store.weddings[wedding_id] = wedding_data


            current_enquiry["status"] = "confirmed"
            current_enquiry["converted_wedding_id"] = wedding_id
            current_enquiry["updated_at"] = now
            store.enquiries[enquiry_id] = current_enquiry

        return {
            "message": "Enquiry successfully converted to a wedding proposal; the plan will be generated when the booking deposit is recorded",
            "wedding": wedding_data,
        }

