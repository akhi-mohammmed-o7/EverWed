"""
Royal Knot OS — Financial Management Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.core.config import get_settings
from app.core.exceptions import DuplicateRecordError, OdooRecordNotFound, RoyalKnotException
from app.core.money import from_paise, normalize_rupees, sum_paise, to_paise
from app.integrations.odoo.client import get_odoo_client
from app.services.plan_service import generate_standard_plan
from app.schemas.finance import (
    ClientPaymentCreate,
    ClientPaymentResponse,
    VendorBillCreate,
    VendorBillResponse,
    VendorPaymentCreate,
    VendorPaymentResponse,
    WeddingFinancialSummary,
)
from app.services.store import store

logger = logging.getLogger("royal_knot.finance_service")


class FinanceService:
    @staticmethod
    def record_client_payment(payload: ClientPaymentCreate) -> ClientPaymentResponse:
        pay_id = f"pay-client-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        with store.transaction(immediate=True):
            wedding = store.weddings.get(payload.wedding_id)
            if not wedding:
                raise OdooRecordNotFound(detail=f"Wedding '{payload.wedding_id}' does not exist")

            if any(
                payment.get("transaction_reference") == payload.transaction_reference
                for payment in store.client_payments.values()
            ):
                raise DuplicateRecordError(
                    detail=f"Client payment with transaction reference '{payload.transaction_reference}' already recorded"
                )

            data = {
                "id": pay_id,
                "wedding_id": payload.wedding_id,
                "stage": payload.stage,
                "amount": normalize_rupees(payload.amount),
                "payment_method": payload.payment_method,
                "transaction_reference": payload.transaction_reference,
                "payment_date": payload.payment_date,
                "status": "received",
                "notes": payload.notes,
                "odoo_payment_id": None,
                "created_at": now,
            }
            store.client_payments[pay_id] = data

            if payload.stage == "booking_deposit" and data["status"] in ("received", "verified"):
                wedding["status"] = "confirmed"
                wedding["updated_at"] = now
                store.weddings[payload.wedding_id] = wedding
                generate_standard_plan(payload.wedding_id)

        # Odoo remains an optional best-effort sync after the local transaction commits.
        settings = get_settings()
        if settings.odoo_configured and wedding.get("odoo_partner_id"):
            try:
                client = get_odoo_client()
                client.authenticate()
                odoo_payment_id = client.create("account.payment", {
                    "payment_type": "inbound",
                    "partner_type": "customer",
                    "partner_id": wedding["odoo_partner_id"],
                    "amount": data["amount"],
                    "ref": f"Wedding {wedding['title']} - {payload.stage} - Ref: {payload.transaction_reference}",
                })
                if odoo_payment_id:
                    data["odoo_payment_id"] = odoo_payment_id
                    store.client_payments[pay_id] = data
            except Exception as exc:
                logger.warning("Could not sync client payment to Odoo: %s", exc)

        return ClientPaymentResponse(**data)

    @staticmethod
    def list_client_payments(wedding_id: str) -> List[ClientPaymentResponse]:
        results = [
            ClientPaymentResponse(**p) for p in store.client_payments.values()
            if p.get("wedding_id") == wedding_id
        ]
        results.sort(key=lambda x: x.created_at, reverse=True)
        return results

    @staticmethod
    def record_vendor_bill(payload: VendorBillCreate) -> VendorBillResponse:
        wedding = store.weddings.get(payload.wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Wedding '{payload.wedding_id}' does not exist")

        vendor = store.vendors.get(payload.vendor_id)
        if not vendor:
            raise OdooRecordNotFound(detail=f"Vendor '{payload.vendor_id}' does not exist")

        # Duplicate bill number check
        for b in store.vendor_bills.values():
            if b.get("vendor_id") == payload.vendor_id and b.get("bill_number") == payload.bill_number:
                raise DuplicateRecordError(
                    detail=f"Vendor bill with number '{payload.bill_number}' for vendor '{vendor['name']}' already exists"
                )

        variance_paise = to_paise(payload.billed_amount) - to_paise(payload.agreed_amount)
        variance = from_paise(variance_paise)
        # Mandatory variance explanation rule:
        # If final billed amount exceeds originally agreed price, require an explicit explanation
        if variance_paise > 0 and not payload.variance_reason:
            raise RoyalKnotException(
                status_code=422,
                detail=f"Final bill amount (₹{payload.billed_amount:,.2f}) exceeds agreed price (₹{payload.agreed_amount:,.2f}) by ₹{variance:,.2f}. An explicit variance_reason (e.g. extra guest plates, overtime hours) is mandatory for financial approval.",
                error_code="VARIANCE_EXPLANATION_REQUIRED",
            )

        bill_id = f"bill-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # Odoo Vendor Bill sync if configured
        odoo_invoice_id = None
        settings = get_settings()
        if settings.odoo_configured and vendor.get("odoo_partner_id"):
            try:
                client = get_odoo_client()
                client.authenticate()
                inv_vals = {
                    "move_type": "in_invoice",
                    "partner_id": vendor["odoo_partner_id"],
                    "ref": payload.bill_number,
                    "invoice_date": payload.bill_date,
                }
                odoo_invoice_id = client.create("account.move", inv_vals)
            except Exception as exc:
                logger.warning("Could not sync vendor bill to Odoo: %s", exc)

        data = {
            "id": bill_id,
            "wedding_id": payload.wedding_id,
            "vendor_id": payload.vendor_id,
            "vendor_name": vendor["name"],
            "vendor_category": vendor["category"],
            "event_id": payload.event_id,
            "quote_id": payload.quote_id,
            "bill_number": payload.bill_number,
            "agreed_amount": normalize_rupees(payload.agreed_amount),
            "billed_amount": normalize_rupees(payload.billed_amount),
            "variance": variance,
            "variance_reason": payload.variance_reason,
            "total_paid": 0.0,
            "outstanding_balance": normalize_rupees(payload.billed_amount),
            "status": "pending",
            "payments": [],
            "bill_date": payload.bill_date,
            "due_date": payload.due_date,
            "odoo_invoice_id": odoo_invoice_id,
            "created_at": now,
        }
        store.vendor_bills[bill_id] = data
        return VendorBillResponse(**data)

    @staticmethod
    def list_vendor_bills(wedding_id: str) -> List[VendorBillResponse]:
        results = []
        for b in store.vendor_bills.values():
            if b.get("wedding_id") != wedding_id:
                continue
            # Reconstruct payments list
            bill_payments = [
                VendorPaymentResponse(**p) for p in store.vendor_payments.values()
                if p.get("bill_id") == b["id"]
            ]
            total_paid_paise = sum_paise((p.model_dump() for p in bill_payments), "amount")
            total_paid = from_paise(total_paid_paise)
            b["total_paid"] = total_paid
            outstanding_paise = max(0, to_paise(b["billed_amount"]) - total_paid_paise)
            b["outstanding_balance"] = from_paise(outstanding_paise)
            if total_paid_paise >= to_paise(b["billed_amount"]):
                b["status"] = "paid"
            elif total_paid > 0:
                b["status"] = "partially_paid"
            else:
                b["status"] = "pending"
            b["payments"] = bill_payments
            results.append(VendorBillResponse(**b))
        return results

    @staticmethod
    def record_vendor_payment(payload: VendorPaymentCreate) -> VendorPaymentResponse:
        with store.transaction(immediate=True):
            return FinanceService._record_vendor_payment(payload)

    @staticmethod
    def _record_vendor_payment(payload: VendorPaymentCreate) -> VendorPaymentResponse:
        bill = store.vendor_bills.get(payload.bill_id)
        if not bill:
            raise OdooRecordNotFound(detail=f"Vendor Bill '{payload.bill_id}' not found")

        # Duplicate reference check
        for vp in store.vendor_payments.values():
            if vp.get("transaction_reference") == payload.transaction_reference:
                raise DuplicateRecordError(
                    detail=f"Vendor payment reference '{payload.transaction_reference}' already recorded"
                )

        # Ensure not overpaying beyond bill amount
        current_paid_paise = sum_paise(
            (p for p in store.vendor_payments.values() if p.get("bill_id") == payload.bill_id),
            "amount",
        )
        amount_paise = to_paise(payload.amount)
        billed_paise = to_paise(bill["billed_amount"])
        if current_paid_paise + amount_paise > billed_paise:
            amount = from_paise(amount_paise)
            remaining = from_paise(max(0, billed_paise - current_paid_paise))
            raise RoyalKnotException(
                status_code=400,
                detail=f"Payment amount ?{amount:,.2f} would exceed remaining bill balance of ?{remaining:,.2f}",
                error_code="OVERPAYMENT_PROHIBITED",
            )

        pay_id = f"pay-vendor-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        data = {
            "id": pay_id,
            "bill_id": payload.bill_id,
            "vendor_id": bill["vendor_id"],
            "amount": from_paise(amount_paise),
            "payment_type": payload.payment_type,
            "payment_method": payload.payment_method,
            "transaction_reference": payload.transaction_reference,
            "payment_date": payload.payment_date,
            "odoo_payment_id": None,
            "created_at": now,
        }
        store.vendor_payments[pay_id] = data

        # Recalculate bill status
        new_paid_paise = current_paid_paise + amount_paise
        new_paid = from_paise(new_paid_paise)
        bill["total_paid"] = new_paid
        bill["outstanding_balance"] = from_paise(max(0, billed_paise - new_paid_paise))
        if new_paid_paise >= billed_paise:
            bill["status"] = "paid"
        else:
            bill["status"] = "partially_paid"
        store.vendor_bills[payload.bill_id] = bill

        return VendorPaymentResponse(**data)

    @staticmethod
    def get_wedding_financial_summary(wedding_id: str) -> WeddingFinancialSummary:
        wedding = store.weddings.get(wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' not found")

        # A planning budget is not signed revenue. Only a package fee
        # explicitly recorded in the wedding contributes to receivables/profit.
        contract_value_paise = to_paise(wedding.get("package_fee", 0.0))
        contract_value = from_paise(contract_value_paise)

        client_paid_paise = sum_paise(
            (
                p for p in store.client_payments.values()
                if p.get("wedding_id") == wedding_id and p.get("status") in ("received", "verified")
            ),
            "amount",
        )
        client_paid = from_paise(client_paid_paise)
        client_outstanding = from_paise(max(0, contract_value_paise - client_paid_paise))
        if contract_value_paise > 0 and client_paid_paise >= contract_value_paise:
            client_status = "paid"
        elif client_paid_paise > 0:
            client_status = "partial"
        else:
            client_status = "pending"

        agreed_vendor_total_paise = sum_paise(
            (
                q for q in store.quotes.values()
                if q.get("wedding_id") == wedding_id and q.get("status") == "selected"
            ),
            "normalized_total",
        )
        agreed_vendor_total = from_paise(agreed_vendor_total_paise)

        bills = [b for b in store.vendor_bills.values() if b.get("wedding_id") == wedding_id]
        actual_bills_total_paise = sum_paise(bills, "billed_amount")
        actual_bills_total = from_paise(actual_bills_total_paise)

        bill_ids = {b["id"] for b in bills}
        vendor_paid_total_paise = sum_paise(
            (vp for vp in store.vendor_payments.values() if vp.get("bill_id") in bill_ids),
            "amount",
        )
        vendor_paid_total = from_paise(vendor_paid_total_paise)
        vendor_outstanding_payable = from_paise(max(0, actual_bills_total_paise - vendor_paid_total_paise))
        cost_variance = from_paise(actual_bills_total_paise - agreed_vendor_total_paise)

        # If bills haven't arrived yet, use agreed vendor costs as the expense estimate.
        expenses_paise = actual_bills_total_paise if actual_bills_total_paise > 0 else agreed_vendor_total_paise
        net_profit = from_paise(contract_value_paise - expenses_paise)
        margin_pct = round((net_profit / contract_value * 100), 2) if contract_value_paise > 0 else 0.0

        return WeddingFinancialSummary(
            wedding_id=wedding_id,
            wedding_title=wedding["title"],
            total_contract_value=contract_value,
            client_paid_amount=client_paid,
            client_outstanding_receivable=client_outstanding,
            client_payment_status=client_status,
            agreed_vendor_total=agreed_vendor_total,
            actual_vendor_bills_total=actual_bills_total,
            vendor_paid_amount=vendor_paid_total,
            vendor_outstanding_payable=vendor_outstanding_payable,
            cost_variance=cost_variance,
            net_agency_profit=net_profit,
            profit_margin_percentage=margin_pct,
        )

