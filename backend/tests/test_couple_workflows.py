"""Couple-owned wedding workflows: onboarding, checklist and function editing."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.database.sqlite import SQLiteDatabase
from app.services.store import Store, store


def _new_couple() -> tuple[TestClient, dict]:
    from app.main import create_app

    client = TestClient(create_app())
    suffix = uuid.uuid4().hex[:10]
    response = client.post(
        "/api/v1/auth/couple-signup",
        json={
            "partner_one_name": "Aarav Test",
            "partner_two_name": "Meera Test",
            "email": f"couple-{suffix}@example.com",
            "phone": "+91 98000 12345",
            "password": "Couple-Test-Pass-1!",
            "terms_accepted": True,
        },
    )
    assert response.status_code == 201, response.text
    return client, response.json()["data"]["user"]


def _onboard(client: TestClient) -> str:
    response = client.post(
        "/api/v1/weddings/onboarding",
        json={
            "destination": "Jaipur",
            "primary_venue": "Test Palace",
            "guest_estimate": 250,
            "budget_allocated": 5000000,
            "start_date": "2027-02-10",
            "end_date": "2027-02-12",
            "theme": "Garden",
            "tradition": "Interfaith / Mixed",
            "regional_customization": "Family languages and customs",
            "functions": [
                {"name": "Welcome Dinner", "date": "2027-02-10", "start_time": "19:00", "end_time": "22:00"},
                {"name": "Ceremony", "date": "2027-02-11", "start_time": "10:00", "end_time": "13:00"},
            ],
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]["id"]


def test_couple_onboarding_generates_checklist_and_persists_completion(client: TestClient) -> None:
    couple, _ = _new_couple()
    wedding_id = _onboard(couple)

    tasks_response = couple.get(f"/api/v1/weddings/{wedding_id}/tasks")
    assert tasks_response.status_code == 200, tasks_response.text
    tasks = tasks_response.json()["data"]
    assert len(tasks) >= 29
    assert any("Welcome Dinner" in task["title"] for task in tasks)
    assert any("Ceremony" in task["title"] for task in tasks)

    first = tasks[0]
    update = couple.patch(f"/api/v1/tasks/{first['id']}", json={"status": "done"})
    assert update.status_code == 200, update.text
    assert update.json()["data"]["status"] == "done"

    refreshed = couple.get(f"/api/v1/weddings/{wedding_id}/tasks").json()["data"]
    assert next(task for task in refreshed if task["id"] == first["id"])["status"] == "done"

    # Couples must not be able to reassign work or change deadlines.
    forbidden = couple.patch(f"/api/v1/tasks/{first['id']}", json={"owner": "Someone else"})
    assert forbidden.status_code == 403

    # Verify the completion survives re-opening the database.
    reloaded = Store(SQLiteDatabase(store.database.path))
    try:
        persisted = reloaded.tasks.get(first["id"])
        assert persisted is not None
        assert persisted["status"] == "done"
    finally:
        reloaded.close()


def test_event_tasks_are_idempotent_and_couple_can_edit_functions(client: TestClient) -> None:
    couple, _ = _new_couple()
    wedding_id = _onboard(couple)

    initial = couple.get(f"/api/v1/weddings/{wedding_id}/tasks").json()["data"]
    initial_event_tasks = [task for task in initial if task.get("event_id")]
    assert len(initial_event_tasks) == 6

    created = couple.post(
        f"/api/v1/weddings/{wedding_id}/events",
        json={
            "name": "Sangeet",
            "date": "2027-02-11",
            "start_time": "19:00",
            "end_time": "23:00",
            "venue_hall": "Test Palace Lawn",
            "coordinator_name": "Attempted Spoof",
            "guest_estimate": 9999,
        },
    )
    assert created.status_code == 201, created.text
    event = created.json()["data"]
    assert event["coordinator_name"] == "Aarav Test & Meera Test"
    assert event["guest_estimate"] == 250

    after = couple.get(f"/api/v1/weddings/{wedding_id}/tasks").json()["data"]
    assert len([task for task in after if task.get("event_id")]) == 9

    # Re-saving the same function via PATCH does not duplicate its tasks.
    edited = couple.patch(
        f"/api/v1/events/{event['id']}",
        json={"name": "Sangeet Night", "start_time": "20:00", "end_time": "23:30"},
    )
    assert edited.status_code == 200, edited.text
    assert edited.json()["data"]["name"] == "Sangeet Night"
    after_edit = couple.get(f"/api/v1/weddings/{wedding_id}/tasks").json()["data"]
    assert len([task for task in after_edit if task.get("event_id")]) == 9

    invalid_time = couple.patch(
        f"/api/v1/events/{event['id']}",
        json={"start_time": "23:30", "end_time": "20:00"},
    )
    assert invalid_time.status_code == 422

    outside_dates = couple.patch(
        f"/api/v1/events/{event['id']}",
        json={"date": "2027-03-01"},
    )
    assert outside_dates.status_code == 422


def test_couple_can_update_preferences_but_not_contract_fields(client: TestClient) -> None:
    couple, _ = _new_couple()
    wedding_id = _onboard(couple)

    updated = couple.patch(
        f"/api/v1/weddings/{wedding_id}",
        json={
            "destination": "Udaipur",
            "guest_estimate": 300,
            "tradition": "Sikh",
            "regional_customization": "Punjabi and Marwari customs",
            "budget_allocated": 6200000,
        },
    )
    assert updated.status_code == 200, updated.text
    data = updated.json()["data"]
    assert data["destination"] == "Udaipur"
    assert data["guest_estimate"] == 300
    assert data["tradition"] == "Sikh"
    assert data["budget_allocated"] == 6200000

    summary = couple.get(f"/api/v1/finance/weddings/{wedding_id}/summary")
    assert summary.status_code == 200, summary.text
    assert summary.json()["data"]["client_paid_amount"] == 0

    forbidden = couple.patch(f"/api/v1/weddings/{wedding_id}", json={"status": "settled"})
    assert forbidden.status_code == 403
    forbidden_fee = couple.patch(f"/api/v1/weddings/{wedding_id}", json={"package_fee": 1})
    assert forbidden_fee.status_code == 403

    # Shrinking the wedding dates must not orphan scheduled functions.
    conflict = couple.patch(
        f"/api/v1/weddings/{wedding_id}",
        json={"start_date": "2027-02-11", "end_date": "2027-02-11"},
    )
    assert conflict.status_code == 422


def test_couple_cannot_access_another_couples_wedding(client: TestClient) -> None:
    first, _ = _new_couple()
    first_wedding = _onboard(first)
    second, _ = _new_couple()

    assert second.get(f"/api/v1/weddings/{first_wedding}").status_code == 403
    assert second.get(f"/api/v1/weddings/{first_wedding}/tasks").status_code == 403
    assert second.get(f"/api/v1/weddings/{first_wedding}/guests").status_code == 403



def test_event_delete_removes_generated_tasks(client: TestClient) -> None:
    couple, _ = _new_couple()
    wedding_id = _onboard(couple)
    events = couple.get(f"/api/v1/weddings/{wedding_id}/events").json()["data"]
    target = events[0]
    tasks_before = couple.get(f"/api/v1/weddings/{wedding_id}/tasks").json()["data"]
    assert any(task.get("event_id") == target["id"] for task in tasks_before)

    deleted = couple.delete(f"/api/v1/events/{target['id']}")
    assert deleted.status_code == 200, deleted.text

    events_after = couple.get(f"/api/v1/weddings/{wedding_id}/events").json()["data"]
    assert len(events_after) == len(events) - 1
    assert all(event["id"] != target["id"] for event in events_after)
    tasks_after = couple.get(f"/api/v1/weddings/{wedding_id}/tasks").json()["data"]
    assert all(task.get("event_id") != target["id"] for task in tasks_after)

    # A different couple cannot delete this wedding's remaining function.
    other, _ = _new_couple()
    remaining = events_after[0]
    assert other.delete(f"/api/v1/events/{remaining['id']}").status_code == 403


def test_onboarding_accepts_and_updates_partner_names(client: TestClient) -> None:
    couple, account = _new_couple()
    response = couple.post(
        "/api/v1/weddings/onboarding",
        json={
            "partner_one_name": "Kiran",
            "partner_two_name": "Sam",
            "destination": "Udaipur",
            "primary_venue": "Lake Palace",
            "guest_estimate": 180,
            "budget_allocated": 2500000,
            "start_date": "2027-04-10",
            "end_date": "2027-04-11",
            "tradition": "Custom family ceremony",
            "functions": [],
        },
    )
    assert response.status_code == 201, response.text
    wedding = response.json()["data"]
    assert wedding["bride_name"] == "Kiran"
    assert wedding["groom_name"] == "Sam"

    profile = couple.get("/api/v1/auth/me").json()["data"]
    assert profile["partner_one_name"] == "Kiran"
    assert profile["partner_two_name"] == "Sam"

    edited = couple.patch(
        f"/api/v1/weddings/{wedding['id']}",
        json={"bride_name": "Kiran Rao", "groom_name": "Sam Rao"},
    )
    assert edited.status_code == 200, edited.text
    assert edited.json()["data"]["bride_name"] == "Kiran Rao"



def test_couple_cannot_access_wedding_by_matching_contact_email(client: TestClient) -> None:
    couple, account = _new_couple()
    created = client.post(
        "/api/v1/weddings",
        json={
            "title": "Staff Created Wedding",
            "bride_name": "Other Bride",
            "groom_name": "Other Groom",
            "contact_phone": "+91 98000 00000",
            "contact_email": account["email"],
            "destination": "Jaipur",
            "primary_venue": "Staff Venue",
            "budget_allocated": 1000000,
            "start_date": "2027-05-01",
            "end_date": "2027-05-02",
        },
    )
    assert created.status_code == 201, created.text
    staff_wedding = created.json()["data"]["id"]
    assert couple.get(f"/api/v1/weddings/{staff_wedding}").status_code == 403


def test_guests_can_be_added_updated_and_deleted(client: TestClient) -> None:
    couple, _ = _new_couple()
    wedding_id = _onboard(couple)
    created = couple.post(
        f"/api/v1/weddings/{wedding_id}/guests",
        json={"name": "Guest One", "rsvp_status": "pending", "plus_ones": 2},
    )
    assert created.status_code == 201, created.text
    guest = created.json()["data"]

    updated = couple.patch(f"/api/v1/guests/{guest['id']}", json={"rsvp_status": "confirmed", "table_number": "A1"})
    assert updated.status_code == 200, updated.text
    assert updated.json()["data"]["rsvp_status"] == "confirmed"
    assert updated.json()["data"]["table_number"] == "A1"

    wedding = couple.get(f"/api/v1/weddings/{wedding_id}").json()["data"]
    assert wedding["guest_estimate"] == 250
    assert len(couple.get(f"/api/v1/weddings/{wedding_id}/guests").json()["data"]) == 1

    assert couple.delete(f"/api/v1/guests/{guest['id']}").status_code == 200
    assert couple.get(f"/api/v1/weddings/{wedding_id}/guests").json()["data"] == []


def test_guest_csv_import_validates_and_skips_duplicates(client: TestClient) -> None:
    couple, _ = _new_couple()
    wedding_id = _onboard(couple)
    existing = couple.post(
        f"/api/v1/weddings/{wedding_id}/guests",
        json={"name": "Existing Guest", "email": "existing@example.com"},
    )
    assert existing.status_code == 201, existing.text

    duplicate = couple.post(
        f"/api/v1/weddings/{wedding_id}/guests",
        json={"name": "Another Name", "email": "EXISTING@example.com"},
    )
    assert duplicate.status_code == 409

    csv_text = (
        "Guest Name,Email Address,RSVP,Plus Ones,Table Number,Side\n"
        "Existing Guest,existing@example.com,confirmed,0,A1,bride\n"
        "New Guest,new@example.com,yes,2,A2,groom\n"
        "Bad Guest,bad@example.com,maybe-later,0,A3,mutual\n"
    )
    imported = couple.post(
        f"/api/v1/weddings/{wedding_id}/guests/import",
        json={"csv": csv_text},
    )
    assert imported.status_code == 200, imported.text
    result = imported.json()["data"]
    assert result["created"] == 1
    assert result["skipped"] == 1
    assert result["error_count"] == 1
    assert result["errors"][0]["row"] == 4

    guests = couple.get(f"/api/v1/weddings/{wedding_id}/guests").json()["data"]
    assert len(guests) == 2
    imported_guest = next(guest for guest in guests if guest["email"] == "new@example.com")
    assert imported_guest["rsvp_status"] == "confirmed"
    assert imported_guest["plus_ones"] == 2
    assert imported_guest["side"] == "groom"

    reloaded = Store(SQLiteDatabase(store.database.path))
    try:
        persisted = [guest for guest in reloaded.guests.values() if guest.get("wedding_id") == wedding_id]
        assert len(persisted) == 2
        assert any(guest.get("email") == "new@example.com" for guest in persisted)
    finally:
        reloaded.close()

    missing_name = couple.post(
        f"/api/v1/weddings/{wedding_id}/guests/import",
        json={"csv": "Email,RSVP\na@example.com,confirmed\n"},
    )
    assert missing_name.status_code == 422


def test_couple_can_create_edit_and_delete_checklist_tasks(client: TestClient) -> None:
    couple, _ = _new_couple()
    wedding_id = _onboard(couple)
    created = couple.post(
        f"/api/v1/weddings/{wedding_id}/tasks",
        json={
            "title": "Book the family photographer",
            "category": "Photography",
            "owner": "Spoofed Owner",
            "due_date": "2027-01-15",
            "priority": "high",
            "notes": "Ask for two photographers",
        },
    )
    assert created.status_code == 201, created.text
    task = created.json()["data"]
    assert task["owner"] == "Aarav Test & Meera Test"

    edited = couple.patch(
        f"/api/v1/tasks/{task['id']}",
        json={"title": "Book the lead photographer", "priority": "urgent", "status": "in_progress"},
    )
    assert edited.status_code == 200, edited.text
    assert edited.json()["data"]["title"] == "Book the lead photographer"
    assert edited.json()["data"]["status"] == "in_progress"

    reopened = couple.patch(f"/api/v1/tasks/{task['id']}", json={"status": "done"})
    assert reopened.status_code == 200, reopened.text
    assert reopened.json()["data"]["status"] == "done"

    reloaded = Store(SQLiteDatabase(store.database.path))
    try:
        assert reloaded.tasks.get(task["id"])["title"] == "Book the lead photographer"
    finally:
        reloaded.close()

    other, _ = _new_couple()
    assert other.patch(f"/api/v1/tasks/{task['id']}", json={"status": "to_plan"}).status_code == 403
    assert other.delete(f"/api/v1/tasks/{task['id']}").status_code == 403

    deleted = couple.delete(f"/api/v1/tasks/{task['id']}")
    assert deleted.status_code == 200, deleted.text
    remaining = couple.get(f"/api/v1/weddings/{wedding_id}/tasks").json()["data"]
    assert all(item["id"] != task["id"] for item in remaining)


def test_founder_can_manage_wedding_and_dashboard_reflects_package_fee(client: TestClient) -> None:
    couple, _ = _new_couple()
    wedding_id = _onboard(couple)
    updated = client.patch(
        f"/api/v1/weddings/{wedding_id}",
        json={
            "contact_phone": "+91 98111 22333",
            "contact_email": "founder-updated@example.com",
            "package_fee": 1750000,
            "status": "in_progress",
        },
    )
    assert updated.status_code == 200, updated.text
    data = updated.json()["data"]
    assert data["contact_phone"] == "+91 98111 22333"
    assert data["contact_email"] == "founder-updated@example.com"
    assert data["package_fee"] == 1750000
    assert data["status"] == "in_progress"

    overview = client.get("/api/v1/dashboard/overview")
    assert overview.status_code == 200, overview.text
    summary = next(
        item for item in overview.json()["data"]["active_weddings"]
        if item["wedding_id"] == wedding_id
    )
    assert summary["contract_value"] == 1750000


def test_founder_can_create_and_edit_a_vendor(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:8]
    created = client.post(
        "/api/v1/vendors",
        json={
            "name": f"Test Vendor {suffix}",
            "category": "Catering",
            "contact_person": "Vendor Contact",
            "phone": "+91 98000 00000",
            "email": f"vendor-{suffix}@example.com",
            "city": "Jaipur",
        },
    )
    assert created.status_code == 201, created.text
    vendor = created.json()["data"]

    updated = client.patch(
        f"/api/v1/vendors/{vendor['id']}",
        json={"phone": "+91 98000 11111", "services_offered": ["Dinner"]},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["data"]["phone"] == "+91 98000 11111"
    assert updated.json()["data"]["services_offered"] == ["Dinner"]


def test_planner_assignment_records_name_and_takes_generated_tasks(client: TestClient) -> None:
    from app.main import create_app

    suffix = uuid.uuid4().hex[:10]
    planner_email = f"planner-{suffix}@example.com"
    created_user = client.post(
        "/api/v1/auth/users",
        json={
            "name": "Assigned Planner",
            "email": planner_email,
            "password": "Planner-Test-Pass-1!",
            "role": "planner",
        },
    )
    assert created_user.status_code == 201, created_user.text

    couple, _ = _new_couple()
    wedding_id = _onboard(couple)
    assigned = client.post(
        f"/api/v1/weddings/{wedding_id}/planner-assignment",
        json={"planner_email": planner_email},
    )
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()["data"]["assigned_planner_name"] == "Assigned Planner"

    tasks = couple.get(f"/api/v1/weddings/{wedding_id}/tasks").json()["data"]
    assert all(task["owner"] == "Assigned Planner" for task in tasks)

    planner_client = TestClient(create_app())
    login = planner_client.post(
        "/api/v1/auth/login",
        json={"username": planner_email, "password": "Planner-Test-Pass-1!"},
    )
    assert login.status_code == 200, login.text
    assert planner_client.get(f"/api/v1/weddings/{wedding_id}").status_code == 200

    planner_tasks = planner_client.get(f"/api/v1/weddings/{wedding_id}/tasks").json()["data"]
    completed = planner_client.patch(f"/api/v1/tasks/{planner_tasks[0]['id']}", json={"status": "done"})
    assert completed.status_code == 200, completed.text
    assert completed.json()["data"]["status"] == "done"

    planner_event = planner_client.post(
        f"/api/v1/weddings/{wedding_id}/events",
        json={
            "name": "Planner Added Function",
            "date": "2027-02-11",
            "start_time": "09:00",
            "end_time": "11:00",
            "venue_hall": "Test Palace",
            "coordinator_name": "Assigned Planner",
        },
    )
    assert planner_event.status_code == 201, planner_event.text

    other_couple, _ = _new_couple()
    other_wedding = _onboard(other_couple)
    assert planner_client.get(f"/api/v1/weddings/{other_wedding}").status_code == 403
    assert planner_client.get("/api/v1/enquiries").status_code == 403
    assert planner_client.post(
        "/api/v1/vendors",
        json={
            "name": "Blocked Vendor",
            "category": "Catering",
            "contact_person": "Test",
            "phone": "+91 98000 00000",
            "email": "vendor@example.com",
        },
    ).status_code == 403
