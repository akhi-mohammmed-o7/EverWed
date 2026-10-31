"""Wedding planning task generation triggered by a recorded booking deposit."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone

from app.core.exceptions import OdooRecordNotFound
from app.services.store import STANDARD_WEDDING_TASKS, store


def generate_standard_plan(wedding_id: str) -> int:
    """Generate the default plan once; caller must hold an immediate transaction."""
    wedding = store.weddings.get(wedding_id)
    if not wedding:
        raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' does not exist")
    if wedding.get("plan_generated_at"):
        return 0

    start_date = date.fromisoformat(wedding["start_date"])
    now = datetime.now(timezone.utc)
    for template in STANDARD_WEDDING_TASKS:
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        due_date = (start_date + timedelta(days=template.get("days_offset", 0))).isoformat()
        store.tasks[task_id] = {
            "id": task_id,
            "wedding_id": wedding_id,
            "event_id": None,
            "title": template["title"],
            "category": template["category"],
            "owner": "Lead Planner",
            "owner_role": "planner",
            "due_date": due_date,
            "priority": template["priority"],
            "status": "to_plan",
            "stage": "to_plan",
            "generated_from_plan": True,
            "notes": f"Standard {wedding.get('package_type', 'Full-Service')} package requirement",
            "is_overdue": False,
            "created_at": now,
            "updated_at": now,
        }

    wedding["plan_generated_at"] = now
    wedding["tasks_count"] = len(STANDARD_WEDDING_TASKS)
    wedding["updated_at"] = now
    store.weddings[wedding_id] = wedding
    return len(STANDARD_WEDDING_TASKS)
