"""
Royal Knot OS — Task Management Service.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timezone
from typing import List, Optional

from app.core.config import get_settings
from app.core.exceptions import OdooRecordNotFound
from app.integrations.odoo.client import get_odoo_client
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.store import store

logger = logging.getLogger("royal_knot.task_service")


class TaskService:
    @staticmethod
    def create_task(wedding_id: str, payload: TaskCreate) -> TaskResponse:
        wedding = store.weddings.get(wedding_id)
        if not wedding:
            raise OdooRecordNotFound(detail=f"Parent Wedding '{wedding_id}' does not exist")

        task_id = f"task-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # Odoo Project Task sync
        odoo_task_id = None
        settings = get_settings()
        if settings.odoo_configured and wedding.get("odoo_project_id"):
            try:
                client = get_odoo_client()
                client.authenticate()
                task_vals = {
                    "name": payload.title,
                    "project_id": wedding["odoo_project_id"],
                    "date_deadline": payload.due_date,
                    "description": payload.notes or "",
                }
                odoo_task_id = client.create("project.task", task_vals)
            except Exception as exc:
                logger.warning("Could not sync task to Odoo: %s", exc)

        data = {
            "id": task_id,
            "wedding_id": wedding_id,
            "event_id": payload.event_id,
            "title": payload.title,
            "category": payload.category,
            "owner": payload.owner,
            "due_date": payload.due_date,
            "priority": payload.priority,
            "status": "to_plan",
            "notes": payload.notes,
            "is_overdue": False,
            "odoo_task_id": odoo_task_id,
            "created_at": now,
            "updated_at": now,
        }
        store.tasks[task_id] = data
        return TaskResponse(**data)

    @staticmethod
    def list_tasks(
        wedding_id: str,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        owner: Optional[str] = None,
    ) -> List[TaskResponse]:
        today_str = date.today().isoformat()
        results = []
        for t in store.tasks.values():
            if t.get("wedding_id") != wedding_id:
                continue
            if status and t.get("status") != status:
                continue
            if category and t.get("category", "").lower() != category.lower():
                continue
            if priority and t.get("priority") != priority:
                continue
            if owner and owner.lower() not in t.get("owner", "").lower():
                continue

            # Determine if overdue
            is_overdue = (t.get("due_date", "") < today_str and t.get("status") != "done")
            t["is_overdue"] = is_overdue
            results.append(TaskResponse(**t))

        # Sort: urgent priority first, then due_date
        priority_weights = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
        results.sort(key=lambda x: (priority_weights.get(x.priority, 2), x.due_date))
        return results

    @staticmethod
    def update_task(task_id: str, payload: TaskUpdate) -> TaskResponse:
        task = store.tasks.get(task_id)
        if not task:
            raise OdooRecordNotFound(detail=f"Task '{task_id}' not found")

        now = datetime.now(timezone.utc)
        for field, val in payload.model_dump(exclude_unset=True).items():
            task[field] = val
        task["updated_at"] = now

        # Update Odoo task if configured
        settings = get_settings()
        if settings.odoo_configured and task.get("odoo_task_id"):
            try:
                client = get_odoo_client()
                client.authenticate()
                update_vals = {}
                if payload.title is not None:
                    update_vals["name"] = payload.title
                if payload.due_date is not None:
                    update_vals["date_deadline"] = payload.due_date
                if update_vals:
                    client.write("project.task", [task["odoo_task_id"]], update_vals)
            except Exception as exc:
                logger.warning("Could not sync task update to Odoo: %s", exc)

        today_str = date.today().isoformat()
        task["is_overdue"] = (task.get("due_date", "") < today_str and task.get("status") != "done")
        return TaskResponse(**task)

