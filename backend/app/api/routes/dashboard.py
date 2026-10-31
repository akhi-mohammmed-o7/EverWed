"""
Royal Knot OS — Management Dashboard API Routes.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.common import APIResponse
from app.schemas.dashboard import DashboardOverviewResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=APIResponse[DashboardOverviewResponse])
async def get_dashboard_overview():
    """
    Executive season dashboard for agency founder:
    Active weddings, upcoming events, pending/overdue tasks, client receivables,
    vendor payables, season profit margins, and open operational issues.
    """
    data = DashboardService.get_management_overview()
    return APIResponse(success=True, data=data)
