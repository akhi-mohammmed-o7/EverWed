"""
Royal Knot OS — Management Dashboard Service.
"""

from __future__ import annotations

import logging
from datetime import date
from typing import List

from app.schemas.dashboard import DashboardOverviewResponse, WeddingProfitabilitySummary
from app.services.finance_service import FinanceService
from app.services.store import store

logger = logging.getLogger("royal_knot.dashboard_service")


class DashboardService:
    @staticmethod
    def get_management_overview() -> DashboardOverviewResponse:
        today_str = date.today().isoformat()
        
        active_weddings = [w for w in store.weddings.values() if w.get("status") in ("planning", "in_progress")]
        
        # Upcoming events (scheduled on or after today)
        upcoming_events = [
            e for e in store.events.values()
            if e.get("date", "") >= today_str and e.get("status") != "completed"
        ]
        upcoming_events.sort(key=lambda x: (x.get("date", ""), x.get("start_time", "")))

        # Tasks counts
        pending_tasks = [t for t in store.tasks.values() if t.get("status") != "done"]
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
        total_contract_value = sum(w.get("budget_allocated", 0.0) for w in store.weddings.values())
        
        client_paid = sum(
            p["amount"] for p in store.client_payments.values()
            if p.get("status") in ("received", "verified")
        )
        client_receivables = max(0.0, total_contract_value - client_paid)

        total_vendor_bills = sum(b.get("billed_amount", 0.0) for b in store.vendor_bills.values())
        vendor_paid = sum(p.get("amount", 0.0) for p in store.vendor_payments.values())
        vendor_payables = max(0.0, total_vendor_bills - vendor_paid)

        season_expenses = total_vendor_bills
        estimated_profit = total_contract_value - season_expenses

        # Individual wedding profitability
        wedding_summaries: List[WeddingProfitabilitySummary] = []
        for w in store.weddings.values():
            try:
                fin = FinanceService.get_wedding_financial_summary(w["id"])
                wedding_summaries.append(
                    WeddingProfitabilitySummary(
                        wedding_id=w["id"],
                        title=w["title"],
                        destination=w.get("destination", "Jaipur"),
                        package_type=w.get("package_type", "Full-Service"),
                        guest_estimate=w.get("guest_estimate", 400),
                        contract_value=fin.total_contract_value,
                        client_paid=fin.client_paid_amount,
                        vendor_costs=fin.actual_vendor_bills_total or fin.agreed_vendor_total,
                        gross_profit=fin.net_agency_profit,
                        margin_percent=fin.profit_margin_percentage,
                    )
                )
            except Exception:
                pass

        # Recent open operational issues
        recent_issues = [
            i for i in store.operational_issues.values()
            if i.get("status") != "resolved"
        ]

        return DashboardOverviewResponse(
            active_weddings_count=len(active_weddings),
            upcoming_events_count=len(upcoming_events),
            pending_tasks_count=len(pending_tasks),
            overdue_tasks_count=len(overdue_tasks),
            total_client_receivables_outstanding=round(client_receivables, 2),
            total_client_payments_received=round(client_paid, 2),
            total_vendor_payables_outstanding=round(vendor_payables, 2),
            total_vendor_bills_recorded=round(total_vendor_bills, 2),
            season_contracted_revenue=round(total_contract_value, 2),
            season_actual_expenses=round(season_expenses, 2),
            season_estimated_profit=round(estimated_profit, 2),
            active_weddings=wedding_summaries,
            upcoming_events=upcoming_events[:10],
            urgent_tasks=urgent_tasks[:10],
            recent_issues=recent_issues[:10],
        )

