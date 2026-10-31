"""
Royal Knot OS — Management Dashboard Schemas.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel


class WeddingProfitabilitySummary(BaseModel):
    wedding_id: str
    title: str
    destination: str
    package_type: str
    guest_estimate: int
    contract_value: float
    client_paid: float
    vendor_costs: float
    gross_profit: float
    margin_percent: float


class DashboardOverviewResponse(BaseModel):
    active_weddings_count: int
    upcoming_events_count: int
    pending_tasks_count: int
    overdue_tasks_count: int
    
    total_client_receivables_outstanding: float
    total_client_payments_received: float
    total_vendor_payables_outstanding: float
    total_vendor_bills_recorded: float
    
    season_contracted_revenue: float
    season_actual_expenses: float
    season_estimated_profit: float
    
    active_weddings: List[WeddingProfitabilitySummary]
    upcoming_events: List[dict]
    urgent_tasks: List[dict]
    recent_issues: List[dict]

