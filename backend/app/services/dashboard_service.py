"""
Royal Knot OS — Management Dashboard Service.
"""

from __future__ import annotations

import logging
from datetime import date
from typing import List

from app.schemas.dashboard import DashboardOverviewResponse, WeddingProfitabilitySummary
from app.core.money import from_paise, sum_paise, to_paise
from app.services.finance_service import FinanceService
from app.services.store import store

logger = logging.getLogger("royal_knot.dashboard_service")


class DashboardService:
    @staticmethod
    def get_management_overview(
        allowed_wedding_ids: set[str] | None = None,
    ) -> DashboardOverviewResponse:
        today_str = date.today().isoformat()
        weddings = [
            wedding for wedding in store.weddings.values()
            if allowed_wedding_ids is None or wedding["id"] in allowed_wedding_ids
        ]
        wedding_ids = {wedding["id"] for wedding in weddings}
        events = [event for event in store.events.values() if event.get("wedding_id") in wedding_ids]
        tasks = [task for task in store.tasks.values() if task.get("wedding_id") in wedding_ids]
        payments = [payment for payment in store.client_payments.values() if payment.get("wedding_id") in wedding_ids]
        bills = [bill for bill in store.vendor_bills.values() if bill.get("wedding_id") in wedding_ids]
        bill_ids = {bill["id"] for bill in bills}
        vendor_payments = [payment for payment in store.vendor_payments.values() if payment.get("bill_id") in bill_ids]
        issues = [issue for issue in store.operational_issues.values() if issue.get("wedding_id") in wedding_ids]

        active_weddings = [w for w in weddings if w.get("status") in ("planning", "in_progress")]
        
        # Upcoming events (scheduled on or after today)
        upcoming_events = [
            e for e in events
            if e.get("date", "") >= today_str and e.get("status") != "completed"
        ]
        upcoming_events.sort(key=lambda x: (x.get("date", ""), x.get("start_time", "")))

        # Tasks counts
        pending_tasks = [t for t in tasks if t.get("status") != "done"]
        overdue_tasks = [
            t for t in pending_tasks
            if t.get("due_date", "") < today_str
        ]
        urgent_tasks = [
            t for t in pending_tasks
            if t.get("priority") in ("urgent", "high")
        ]
        urgent_tasks.sort(key=lambda x: x.get("due_date", ""))

        # Financial totals
        total_contract_value = from_paise(sum_paise(weddings, "package_fee"))
        
        client_paid = from_paise(sum_paise(
            (p for p in payments if p.get("status") in ("received", "verified")),
            "amount",
        ))
        contracts_missing_count = sum(
            1 for wedding in weddings
            if to_paise(wedding.get("package_fee") or 0) <= 0
        )
        contract_overpayment_count = sum(
            1 for wedding in weddings
            if to_paise(wedding.get("package_fee") or 0) > 0
            and sum_paise(
                (payment for payment in payments
                 if payment.get("wedding_id") == wedding["id"]
                 and payment.get("status") in ("received", "verified")),
                "amount",
            ) > to_paise(wedding.get("package_fee"))
        )
        client_receivables_paise = sum(
            max(
                0,
                to_paise(wedding.get("package_fee"))
                - sum_paise(
                    (payment for payment in payments
                     if payment.get("wedding_id") == wedding["id"]
                     and payment.get("status") in ("received", "verified")),
                    "amount",
                ),
            )
            for wedding in weddings
        )
        client_receivables = from_paise(client_receivables_paise)

        total_vendor_bills = from_paise(sum_paise(bills, "billed_amount"))
        vendor_paid = from_paise(sum_paise(vendor_payments, "amount"))
        vendor_payables_paise = sum(
            max(
                0,
                to_paise(bill.get("billed_amount"))
                - sum_paise(
                    (payment for payment in vendor_payments
                     if payment.get("bill_id") == bill["id"]),
                    "amount",
                ),
            )
            for bill in bills
        )
        vendor_payables = from_paise(vendor_payables_paise)

        season_expenses = total_vendor_bills
        estimated_profit_paise = 0

        # Individual wedding profitability
        wedding_summaries: List[WeddingProfitabilitySummary] = []
        for w in weddings:
            fin = FinanceService.get_wedding_financial_summary(w["id"])
            estimated_profit_paise += to_paise(fin.net_agency_profit)
            wedding_summaries.append(
                WeddingProfitabilitySummary(
                    wedding_id=w["id"],
                    title=w["title"],
                    destination=w.get("destination", ""),
                    package_type=w.get("package_type", ""),
                    guest_estimate=w.get("guest_estimate", 0),
                    contract_value=fin.total_contract_value,
                    client_paid=fin.client_paid_amount,
                    vendor_costs=fin.actual_vendor_bills_total or fin.agreed_vendor_total,
                    gross_profit=fin.net_agency_profit,
                    margin_percent=fin.profit_margin_percentage,
                    client_contract_missing=fin.client_contract_missing,
                    client_overpayment=fin.client_overpayment_amount,
                )
            )
        estimated_profit = from_paise(estimated_profit_paise)

        # Recent open operational issues
        recent_issues = [
            i for i in issues
            if i.get("status") != "resolved"
        ]

        return DashboardOverviewResponse(
            active_weddings_count=len(active_weddings),
            upcoming_events_count=len(upcoming_events),
            pending_tasks_count=len(pending_tasks),
            overdue_tasks_count=len(overdue_tasks),
            total_client_receivables_outstanding=round(client_receivables, 2),
            total_client_payments_received=round(client_paid, 2),
            client_contracts_missing_count=contracts_missing_count,
            client_contract_overpayment_count=contract_overpayment_count,
            total_vendor_payables_outstanding=round(vendor_payables, 2),
            total_vendor_bills_recorded=round(total_vendor_bills, 2),
            total_vendor_payments_made=round(vendor_paid, 2),
            season_contracted_revenue=round(total_contract_value, 2),
            season_actual_expenses=round(season_expenses, 2),
            season_estimated_profit=round(estimated_profit, 2),
            active_weddings=wedding_summaries,
            upcoming_events=upcoming_events[:10],
            urgent_tasks=urgent_tasks[:10],
            recent_issues=recent_issues[:10],
        )

