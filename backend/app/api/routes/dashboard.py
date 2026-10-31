"""
Royal Knot OS — Management Dashboard API Routes.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import can_access_wedding, require_role
from app.schemas.common import APIResponse
from app.schemas.dashboard import DashboardOverviewResponse
from app.services.dashboard_service import DashboardService
from app.services.store import store

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=APIResponse[DashboardOverviewResponse])
async def get_dashboard_overview(current_user: dict = Depends(require_role("admin", "finance", "planner"))):
    """
    Executive season dashboard for agency founder:
    Active weddings, upcoming events, pending/overdue tasks, client receivables,
    vendor payables, season profit margins, and open operational issues.
    """
    assigned_ids = None
    if current_user.get("role") == "planner":
        assigned_ids = {
            wedding["id"] for wedding in store.weddings.values()
            if can_access_wedding(current_user, wedding["id"])
        }
    data = DashboardService.get_management_overview(allowed_wedding_ids=assigned_ids)
    return APIResponse(success=True, data=data)

