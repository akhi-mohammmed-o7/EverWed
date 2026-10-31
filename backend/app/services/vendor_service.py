"""
Royal Knot OS — Vendor Directory and Quotations Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.core.config import get_settings
from app.core.exceptions import OdooRecordNotFound, RoyalKnotException
from app.integrations.odoo.client import get_odoo_client
from app.schemas.vendor import (
    QuoteComparisonItem,
    QuoteComparisonResponse,
    QuoteCreate,
    QuoteResponse,
    VendorCreate,
    VendorResponse,
    VendorUpdate,
)
from app.services.store import store

logger = logging.getLogger("royal_knot.vendor_service")


class VendorService:
    @staticmethod
    def list_vendors(category: Optional[str] = None, city: Optional[str] = None) -> List[VendorResponse]:
        results = []
        for v in store.vendors.values():
            if category and v.get("category", "").lower() != category.lower():
                continue
            if city and v.get("city", "").lower() != city.lower():
                continue
            results.append(VendorResponse(**v))
        results.sort(key=lambda x: x.rating, reverse=True)
        return results

    @staticmethod
    def get_vendor(vendor_id: str) -> VendorResponse:
        v = store.vendors.get(vendor_id)
        if not v:
            raise OdooRecordNotFound(detail=f"Vendor '{vendor_id}' not found")
        return VendorResponse(**v)

    @staticmethod
    def create_vendor(payload: VendorCreate) -> VendorResponse:
        vendor_id = f"v-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # Odoo Partner (Supplier) sync if configured
        odoo_partner_id = None
        settings = get_settings()
        if settings.odoo_configured:
            try:
                client = get_odoo_client()
                client.authenticate()
                partner_vals = {
                    "name": payload.name,
                    "email": payload.email,
                    "phone": payload.phone,
                    "supplier_rank": 1,
                    "city": payload.city,
                }
                odoo_partner_id = client.create("res.partner", partner_vals)
            except Exception as exc:
                logger.warning("Could not sync vendor to Odoo: %s", exc)

        data = {
            "id": vendor_id,
            "name": payload.name,
            "category": payload.category,
            "contact_person": payload.contact_person,
            "phone": payload.phone,
            "email": payload.email,
            "city": payload.city,
            "rating": payload.rating,
            "services_offered": payload.services_offered,
            "pricing_model_default": payload.pricing_model_default,
            "bank_account_details": payload.bank_account_details,
            "odoo_partner_id": odoo_partner_id,
            "created_at": now,
            "updated_at": now,
        }
        store.vendors[vendor_id] = data
        return VendorResponse(**data)

    @staticmethod
    def update_vendor(vendor_id: str, payload: VendorUpdate) -> VendorResponse:
        v = store.vendors.get(vendor_id)
        if not v:
            raise OdooRecordNotFound(detail=f"Vendor '{vendor_id}' not found")
        now = datetime.now(timezone.utc)
        for field, val in payload.model_dump(exclude_unset=True).items():
            v[field] = val
        v["updated_at"] = now
        store.vendors[vendor_id] = v
        return VendorResponse(**v)


class QuoteService:
    @staticmethod
    def create_quote(payload: QuoteCreate) -> QuoteResponse:
        wedding = store.weddings.get(payload.wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Wedding '{payload.wedding_id}' does not exist")

        vendor = store.vendors.get(payload.vendor_id)
        if not vendor:
            raise OdooRecordNotFound(detail=f"Vendor '{payload.vendor_id}' does not exist")

        if payload.event_id:
            event = store.events.get(payload.event_id)
            if not event:
                raise OdooRecordNotFound(detail=f"Event '{payload.event_id}' not found")

        quote_id = f"quote-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # Calculate normalized total
        if payload.pricing_type == "per_plate":
            normalized_total = payload.unit_price * max(1, payload.estimated_quantity)
        else:
            normalized_total = payload.unit_price

        # Odoo RFQ (purchase.order state=draft) sync if configured
        odoo_po_id = None
        settings = get_settings()
        if settings.odoo_configured and vendor.get("odoo_partner_id"):
            try:
                client = get_odoo_client()
                client.authenticate()
                po_vals = {
                    "partner_id": vendor["odoo_partner_id"],
                    "origin": f"Wedding {wedding['title']} - {payload.category}",
                }
                odoo_po_id = client.create("purchase.order", po_vals)
            except Exception as exc:
                logger.warning("Could not sync RFQ quote to Odoo: %s", exc)

        data = {
            "id": quote_id,
            "wedding_id": payload.wedding_id,
            "vendor_id": payload.vendor_id,
            "vendor_name": vendor["name"],
            "vendor_category": payload.category or vendor["category"],
            "event_id": payload.event_id,
            "pricing_type": payload.pricing_type,
            "unit_price": payload.unit_price,
            "estimated_quantity": payload.estimated_quantity,
            "normalized_total": normalized_total,
            "scope_of_work": payload.scope_of_work,
            "inclusions": payload.inclusions,
            "exclusions": payload.exclusions,
            "extra_hour_rate": payload.extra_hour_rate or 0.0,
            "status": "draft",
            "odoo_purchase_order_id": odoo_po_id,
            "created_at": now,
            "updated_at": now,
        }
        store.quotes[quote_id] = data
        return QuoteResponse(**data)

    @staticmethod
    def list_quotes(wedding_id: str, category: Optional[str] = None) -> List[QuoteResponse]:
        results = []
        for q in store.quotes.values():
            if q.get("wedding_id") != wedding_id:
                continue
            if category and q.get("vendor_category", "").lower() != category.lower():
                continue
            results.append(QuoteResponse(**q))
        return results

    @staticmethod
    def compare_quotes(wedding_id: str, category: str) -> QuoteComparisonResponse:
        wedding = store.weddings.get(wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' does not exist")

        matching_quotes = [
            q for q in store.quotes.values()
            if q.get("wedding_id") == wedding_id and q.get("vendor_category", "").lower() == category.lower()
        ]

        if not matching_quotes:
            raise RoyalKnotException(
                status_code=404,
                detail=f"No quotations found for wedding '{wedding_id}' in category '{category}'",
                error_code="NO_QUOTES_FOUND",
            )

        guest_count = wedding.get("guest_estimate", 400)
        items: List[QuoteComparisonItem] = []
        lowest_id = None
        min_total = float("inf")
        selected_id = None

        for q in matching_quotes:
            # Re-normalize if per-plate based on wedding guest count
            if q["pricing_type"] == "per_plate":
                comp_total = q["unit_price"] * guest_count
            else:
                comp_total = q["unit_price"]

            is_selected = (q["status"] == "selected")
            if is_selected:
                selected_id = q["id"]

            if comp_total < min_total:
                min_total = comp_total
                lowest_id = q["id"]

            items.append(
                QuoteComparisonItem(
                    quote_id=q["id"],
                    vendor_id=q["vendor_id"],
                    vendor_name=q["vendor_name"],
                    category=q["vendor_category"],
                    pricing_type=q["pricing_type"],
                    unit_price=q["unit_price"],
                    estimated_quantity=guest_count if q["pricing_type"] == "per_plate" else 1,
                    normalized_total=comp_total,
                    extra_hour_rate=q.get("extra_hour_rate", 0.0),
                    inclusions=q.get("inclusions", []),
                    status=q["status"],
                    is_winner=is_selected,
                )
            )

        return QuoteComparisonResponse(
            wedding_id=wedding_id,
            category=category,
            guest_count=guest_count,
            quotes=items,
            lowest_quote_id=lowest_id,
            selected_quote_id=selected_id,
        )

    @staticmethod
    def select_winning_quote(quote_id: str) -> dict:
        quote = store.quotes.get(quote_id)
        if not quote:
            raise OdooRecordNotFound(detail=f"Quote '{quote_id}' not found")

        wedding_id = quote["wedding_id"]
        category = quote["vendor_category"]
        now = datetime.now(timezone.utc)

        # Mark this quote selected
        quote["status"] = "selected"
        quote["updated_at"] = now

        # Auto-close / reject other competing quotes in this same category for this wedding
        closed_count = 0
        for other_q in store.quotes.values():
            if (
                other_q["id"] != quote_id
                and other_q["wedding_id"] == wedding_id
                and other_q["vendor_category"].lower() == category.lower()
            ):
                other_q["status"] = "rejected"
                other_q["updated_at"] = now
                closed_count += 1

        # Confirm in Odoo if configured
        settings = get_settings()
        if settings.odoo_configured and quote.get("odoo_purchase_order_id"):
            try:
                client = get_odoo_client()
                client.authenticate()
                client.execute("purchase.order", "button_confirm", [quote["odoo_purchase_order_id"]])
            except Exception as exc:
                logger.warning("Could not confirm purchase order in Odoo: %s", exc)

        return {
            "message": f"Quote '{quote_id}' selected as winner. {closed_count} competing quote(s) closed automatically.",
            "selected_quote": quote,
            "agreed_price_inr": quote["normalized_total"],
            "vendor_name": quote["vendor_name"],
        }

