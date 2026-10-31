"""
Royal Knot OS — Tasks and Planning API Routes.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import require_role, require_task_access, require_wedding_access
from app.core.exceptions import PermissionDeniedError, RoyalKnotException
from app.schemas.common import APIResponse
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.store import store
from app.services.task_service import TaskService

router = APIRouter(tags=["tasks"])

COUPLE_TASK_FIELDS = {"title", "category", "due_date", "priority", "status", "notes"}


@router.post("/api/v1/weddings/{wedding_id}/tasks", response_model=APIResponse[TaskResponse], status_code=status.HTTP_201_CREATED)
async def create_task(
    wedding_id: str,
    payload: TaskCreate,
    current_user: dict = Depends(require_role("admin", "planner", "team", "couple")),
    __: dict = Depends(require_wedding_access),
):
    """Add a custom task to a wedding plan."""
    if current_user.get("role") == "couple":
        account = store.users.get(current_user.get("user_id"), {})
        payload = payload.model_copy(update={"owner": account.get("name", "Couple")})
    data = TaskService.create_task(wedding_id, payload)
    return APIResponse(success=True, data=data)


@router.get("/api/v1/weddings/{wedding_id}/tasks", response_model=APIResponse[List[TaskResponse]])
async def list_tasks(
    wedding_id: str,
    status: Optional[str] = Query(None, description="Filter: to_plan, in_progress, done"),
    category: Optional[str] = Query(None, description="Filter: Venue, Decor, Catering, Legal/Contract, Day-of"),
    priority: Optional[str] = Query(None, description="Filter: low, medium, high, urgent"),
    owner: Optional[str] = Query(None, description="Filter by assignee"),
    _: dict = Depends(require_wedding_access),
):
    """List planning tasks for a wedding with priority ordering and overdue indicators."""
    data = TaskService.list_tasks(
        wedding_id=wedding_id,
        status=status,
        category=category,
        priority=priority,
        owner=owner,
    )
    return APIResponse(success=True, data=data)


@router.patch("/api/v1/tasks/{task_id}", response_model=APIResponse[TaskResponse])
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    current_user: dict = Depends(require_role("admin", "planner", "team", "couple")),
    __: dict = Depends(require_task_access),
):
    """Update task progress, assignee, deadline, or mark Done.

    Couples can complete their own checklist items. They cannot reassign tasks,
    move deadlines, or otherwise alter their planner's plan.
    """
    if current_user.get("role") == "couple":
        updates = payload.model_dump(exclude_unset=True)
        disallowed = set(updates) - COUPLE_TASK_FIELDS
        if disallowed:
            raise PermissionDeniedError(
                "Couples can edit checklist details, status and notes only."
            )
        if "status" in updates and updates["status"] not in {"to_plan", "in_progress", "done"}:
            raise RoyalKnotException(
                status_code=422,
                detail="Checklist status must be to_plan, in_progress, or done.",
                error_code="TASK_STATUS_INVALID",
            )
    data = TaskService.update_task(task_id, payload)
    return APIResponse(success=True, data=data)


@router.delete("/api/v1/tasks/{task_id}", response_model=APIResponse)
async def delete_task(
    task_id: str,
    _: dict = Depends(require_role("admin", "planner", "couple")),
    __: dict = Depends(require_task_access),
):
    """Delete one planning task from an authorised wedding."""
    TaskService.delete_task(task_id)
    return APIResponse(success=True, data={"deleted": True})

