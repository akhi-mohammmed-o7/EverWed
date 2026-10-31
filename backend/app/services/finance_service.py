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
from app.integrations.odoo.client import get_odoo_client
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
        wedding = store.weddings.get(payload.wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Wedding '{payload.wedding_id}' does not exist")

        # Idempotency / Duplicate reference protection
        for p in store.client_payments.values():
            if p.get("transaction_reference") == payload.transaction_reference:
                raise DuplicateRecordError(
                    detail=f"Client payment with transaction reference '{payload.transaction_reference}' already recorded"
                )

        pay_id = f"pay-client-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # Odoo Payment sync if configured
        odoo_payment_id = None
        settings = get_settings()
        if settings.odoo_configured and wedding.get("odoo_partner_id"):
            try:
                client = get_odoo_client()
                client.authenticate()
                pay_vals = {
                    "payment_type": "inbound",
                    "partner_type": "customer",
                    "partner_id": wedding["odoo_partner_id"],
                    "amount": payload.amount,
                    "ref": f"Wedding {wedding['title']} - {payload.stage} - Ref: {payload.transaction_reference}",
                }
                odoo_payment_id = client.create("account.payment", pay_vals)
            except Exception as exc:
                logger.warning("Could not sync client payment to Odoo: %s", exc)

        data = {
            "id": pay_id,
            "wedding_id": payload.wedding_id,
            "stage": payload.stage,
            "amount": payload.amount,
            "payment_method": payload.payment_method,
            "transaction_reference": payload.transaction_reference,
            "payment_date": payload.payment_date,
            "status": "received",
            "notes": payload.notes,
            "odoo_payment_id": odoo_payment_id,
            "created_at": now,
        }
        store.client_payments[pay_id] = data
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

        variance = round(payload.billed_amount - payload.agreed_amount, 2)
        # Mandatory variance explanation rule:
        # If final billed amount exceeds originally agreed price, require an explicit explanation
        if variance > 0 and not payload.variance_reason:
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
            "agreed_amount": payload.agreed_amount,
            "billed_amount": payload.billed_amount,
            "variance": variance,
            "variance_reason": payload.variance_reason,
            "total_paid": 0.0,
            "outstanding_balance": payload.billed_amount,
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
            total_paid = sum(p.amount for p in bill_payments)
            b["total_paid"] = total_paid
            b["outstanding_balance"] = round(max(0.0, b["billed_amount"] - total_paid), 2)
            if total_paid >= b["billed_amount"]:
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
        current_paid = sum(
            p["amount"] for p in store.vendor_payments.values()
            if p.get("bill_id") == payload.bill_id
        )
        if current_paid + payload.amount > bill["billed_amount"] + 0.01:
            raise RoyalKnotException(
                status_code=400,
                detail=f"Payment amount ₹{payload.amount:,.2f} would exceed remaining bill balance of ₹{(bill['billed_amount'] - current_paid):,.2f}",
                error_code="OVERPAYMENT_PROHIBITED",
            )

        pay_id = f"pay-vendor-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        data = {
            "id": pay_id,
            "bill_id": payload.bill_id,
            "vendor_id": bill["vendor_id"],
            "amount": payload.amount,
            "payment_type": payload.payment_type,
            "payment_method": payload.payment_method,
            "transaction_reference": payload.transaction_reference,
            "payment_date": payload.payment_date,
            "odoo_payment_id": None,
            "created_at": now,
        }
        store.vendor_payments[pay_id] = data

        # Recalculate bill status
        new_paid = current_paid + payload.amount
        bill["total_paid"] = new_paid
        bill["outstanding_balance"] = round(max(0.0, bill["billed_amount"] - new_paid), 2)
        if new_paid >= bill["billed_amount"]:
            bill["status"] = "paid"
        else:
            bill["status"] = "partially_paid"

        return VendorPaymentResponse(**data)

    @staticmethod
    def get_wedding_financial_summary(wedding_id: str) -> WeddingFinancialSummary:
        wedding = store.weddings.get(wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' not found")

        contract_value = wedding.get("budget_allocated", 0.0)
        
        # Client side: received vs outstanding
        client_paid = sum(
            p["amount"] for p in store.client_payments.values()
            if p.get("wedding_id") == wedding_id and p.get("status") in ("received", "verified")
        )
        client_outstanding = round(max(0.0, contract_value - client_paid), 2)
        if client_paid >= contract_value:
            client_status = "paid"
        elif client_paid > 0:
            client_status = "partial"
        else:
            client_status = "pending"

        # Vendor side: agreed quotes vs actual bills
        agreed_vendor_total = sum(
            q["normalized_total"] for q in store.quotes.values()
            if q.get("wedding_id") == wedding_id and q.get("status") == "selected"
        )

        bills = [b for b in store.vendor_bills.values() if b.get("wedding_id") == wedding_id]
        actual_bills_total = sum(b["billed_amount"] for b in bills)
        
        vendor_paid_total = sum(
            vp["amount"] for b in bills
            for vp in store.vendor_payments.values() if vp.get("bill_id") == b["id"]
        )
        vendor_outstanding_payable = round(max(0.0, actual_bills_total - vendor_paid_total), 2)
        cost_variance = round(actual_bills_total - agreed_vendor_total, 2)

        # Net Profit = Contract Value minus Actual Vendor Expenses
        # If bills haven't arrived yet, estimated using agreed vendor cost
        expenses = actual_bills_total if actual_bills_total > 0 else agreed_vendor_total
        net_profit = round(contract_value - expenses, 2)
        margin_pct = round((net_profit / contract_value * 100), 2) if contract_value > 0 else 0.0

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

