"""Wedding planning task generation from wedding and function requirements."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone

from app.core.exceptions import OdooRecordNotFound
from app.services.store import STANDARD_WEDDING_TASKS, store


def _owner_for(wedding: dict) -> str:
    """Return the real accountable owner for generated tasks."""
    if wedding.get("assigned_planner_email"):
        return wedding["assigned_planner_email"]
    # Couple-created workspaces may not have a planner yet; say so honestly
    # instead of implying an agency planner is already handling the task.
    return "Couple" if wedding.get("created_by_role") == "couple" else "Lead Planner"


def generate_standard_plan(wedding_id: str) -> int:
    """Generate the baseline plan once; caller must hold an immediate transaction."""
    wedding = store.weddings.get(wedding_id)
    if not wedding:
        raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' does not exist")
    if wedding.get("plan_generated_at"):
        return 0

    start_date = date.fromisoformat(wedding["start_date"])
    now = datetime.now(timezone.utc)
    owner = _owner_for(wedding)
    generated = 0
    for template in STANDARD_WEDDING_TASKS:
        # Protect pre-existing tasks: never duplicate a baseline task that already
        # exists for this wedding (for example after a partial save or restore).
        if any(
            task.get("wedding_id") == wedding_id
            and task.get("generated_from_plan")
            and task.get("title") == template["title"]
            for task in store.tasks.values()
        ):
            continue
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        due_date = (start_date + timedelta(days=template.get("days_offset", 0))).isoformat()
        store.tasks[task_id] = {
            "id": task_id,
            "wedding_id": wedding_id,
            "event_id": None,
            "title": template["title"],
            "category": template["category"],
            "owner": owner,
            "owner_role": "planner",
            "due_date": due_date,
            "priority": template["priority"],
            "status": "to_plan",
            "stage": "to_plan",
            "generated_from_plan": True,
            "source_key": f"baseline:{template['title']}",
            "notes": f"Standard {wedding.get('package_type', 'Full-Service')} package requirement",
            "is_overdue": False,
            "created_at": now,
            "updated_at": now,
        }
        generated += 1

    wedding["plan_generated_at"] = now
    wedding["tasks_count"] = len([
        task for task in store.tasks.values() if task.get("wedding_id") == wedding_id
    ])
    wedding["updated_at"] = now
    store.weddings[wedding_id] = wedding
    return generated


EVENT_TASK_TEMPLATES = (
    {
        "title": "Confirm vendors and deliverables",
        "category": "Vendor Management",
        "priority": "high",
        "days_offset": -14,
        "notes": "Confirm the supplier list, scope and arrival details for this function.",
    },
    {
        "title": "Finalise guest count and seating plan",
        "category": "Hospitality",
        "priority": "high",
        "days_offset": -7,
        "notes": "Use RSVP responses and dietary requirements for this function.",
    },
    {
        "title": "Prepare and approve the function run sheet",
        "category": "Planning",
        "priority": "medium",
        "days_offset": -3,
        "notes": "Agree timings, venue access and responsible people for this function.",
    },
)


def generate_event_tasks(wedding_id: str, event_id: str) -> int:
    """Generate tasks for one selected function without duplicating existing work.

    The caller is responsible for the surrounding transaction. Tasks created by a
    couple or planner manually are never modified or removed.
    """
    wedding = store.weddings.get(wedding_id)
    event = store.events.get(event_id)
    if not wedding or not event:
        return 0

    try:
        event_date = date.fromisoformat(str(event.get("date") or wedding["start_date"]))
    except ValueError:
        return 0

    now = datetime.now(timezone.utc)
    owner = _owner_for(wedding)
    generated = 0
    for template in EVENT_TASK_TEMPLATES:
        source_key = f"event:{event_id}:{template['title']}"
        if any(
            task.get("wedding_id") == wedding_id and task.get("source_key") == source_key
            for task in store.tasks.values()
        ):
            continue
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        due_date = (event_date + timedelta(days=template["days_offset"])).isoformat()
        store.tasks[task_id] = {
            "id": task_id,
            "wedding_id": wedding_id,
            "event_id": event_id,
            "title": f"{event.get('name', 'Function')}: {template['title']}",
            "category": template["category"],
            "owner": owner,
            "owner_role": "planner",
            "due_date": due_date,
            "priority": template["priority"],
            "status": "to_plan",
            "stage": "to_plan",
            "generated_from_plan": True,
            "source_key": source_key,
            "notes": template["notes"],
            "is_overdue": False,
            "created_at": now,
            "updated_at": now,
        }
        generated += 1

    if generated:
        wedding["tasks_count"] = len([
            task for task in store.tasks.values() if task.get("wedding_id") == wedding_id
        ])
        wedding["updated_at"] = now
        store.weddings[wedding_id] = wedding
    return generated
