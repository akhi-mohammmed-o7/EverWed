"""
Royal Knot OS — Tasks and Planning API Routes.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Query, status

from app.schemas.common import APIResponse
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.task_service import TaskService

router = APIRouter(tags=["tasks"])


@router.post("/api/v1/weddings/{wedding_id}/tasks", response_model=APIResponse[TaskResponse], status_code=status.HTTP_201_CREATED)
async def create_task(wedding_id: str, payload: TaskCreate):
    """Add a custom task to a wedding plan."""
    data = TaskService.create_task(wedding_id, payload)
    return APIResponse(success=True, data=data)


@router.get("/api/v1/weddings/{wedding_id}/tasks", response_model=APIResponse[List[TaskResponse]])
async def list_tasks(
    wedding_id: str,
    status: Optional[str] = Query(None, description="Filter: to_plan, in_progress, done"),
    category: Optional[str] = Query(None, description="Filter: Venue, Decor, Catering, Legal/Contract, Day-of"),
    priority: Optional[str] = Query(None, description="Filter: low, medium, high, urgent"),
    owner: Optional[str] = Query(None, description="Filter by assignee"),
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
async def update_task(task_id: str, payload: TaskUpdate):
    """Update task progress, assignee, deadline, or mark Done."""
    data = TaskService.update_task(task_id, payload)
    return APIResponse(success=True, data=data)

