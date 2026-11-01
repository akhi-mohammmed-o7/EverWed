from __future__ import annotations

from datetime import datetime, timedelta, timezone
import uuid

from fastapi.testclient import TestClient


def _clear_auth_records(store) -> None:
    for session_id in list(store.sessions):
        del store.sessions[session_id]
    for user_id in list(store.users):
        del store.users[user_id]


def test_first_founder_setup_password_hash_and_revocable_session(
    client: TestClient, monkeypatch
) -> None:
    monkeypatch.setenv("SECRET_KEY", "test-only-secret-key-value-longer-than-32-characters")
    from app.core.config import get_settings
    from app.services.store import store
    from app.core.security import verify_password

    get_settings.cache_clear()
    _clear_auth_records(store)
    assert client.get("/api/v1/auth/setup/status").json()["data"]["available"] is True
    payload = {
        "name": "Founder Test",
        "email": "founder-test@example.com",
        "password": "Correct-Horse-Battery-7!",
    }
    response = client.post("/api/v1/auth/setup", json=payload)
    assert response.status_code == 201, response.text
    result = response.json()["data"]
    assert result.get("token") is None
    assert "everwed_session=" in response.headers["set-cookie"]
    assert "httponly" in response.headers["set-cookie"].lower()
    assert result["user"]["role"] == "admin"
    assert client.get("/api/v1/auth/setup/status").json()["data"]["available"] is False

    user = store.users[next(iter(store.users))]
    assert user["password_hash"] != payload["password"]
    assert verify_password(payload["password"], user["password_hash"])

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["data"]["email"] == payload["email"]

    logged_out = client.post("/api/v1/auth/logout")
    assert logged_out.status_code == 200
    revoked = client.get("/api/v1/auth/me")
    assert revoked.status_code == 401

    second_setup = client.post("/api/v1/auth/setup", json=payload)
    assert second_setup.status_code == 403


def test_expired_sessions_are_rejected(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("SECRET_KEY", "test-only-secret-key-value-longer-than-32-characters")
    from app.core.config import get_settings
    from app.services.store import store

    get_settings.cache_clear()
    _clear_auth_records(store)
    setup = client.post(
        "/api/v1/auth/setup",
        json={
            "name": "Expiry Founder",
            "email": "expiry-founder@example.com",
            "password": "Correct-Horse-Battery-7!",
        },
    )
    assert setup.status_code == 201
    session = next(iter(store.sessions.values()))
    session["expires_at"] = datetime.now(timezone.utc) - timedelta(seconds=1)
    store.sessions[session["id"]] = session

    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_couple_cannot_read_another_wedding(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:10]
    wedding_payload = {
        "title": f"Access Test {suffix}",
        "bride_name": "Test Bride",
        "groom_name": "Test Groom",
        "contact_phone": "+91 90000 00000",
        "contact_email": f"couple-{suffix}@example.com",
        "destination": "Jaipur",
        "primary_venue": "Test Venue",
        "guest_estimate": 100,
        "budget_allocated": 1000000,
        "start_date": "2027-02-01",
        "end_date": "2027-02-02",
    }
    own_wedding = client.post("/api/v1/weddings", json=wedding_payload)
    assert own_wedding.status_code == 201, own_wedding.text
    other_wedding = client.post(
        "/api/v1/weddings",
        json={
            **wedding_payload,
            "title": f"Other {suffix}",
            "contact_email": f"other-{suffix}@example.com",
        },
    )
    assert other_wedding.status_code == 201, other_wedding.text
    own_id = own_wedding.json()["data"]["id"]
    other_id = other_wedding.json()["data"]["id"]

    user = client.post(
        "/api/v1/auth/users",
        json={
            "name": "Test Couple",
            "email": f"couple-{suffix}@example.com",
            "password": "Couple-Password-1!",
            "role": "couple",
            "wedding_id": own_id,
        },
    )
    assert user.status_code == 201, user.text
    login = client.post(
        "/api/v1/auth/login",
        json={"username": f"couple-{suffix}@example.com", "password": "Couple-Password-1!"},
    )
    assert login.status_code == 200, login.text
    assert login.json()["data"].get("token") is None
    couple_headers = {}

    assert client.get(f"/api/v1/weddings/{own_id}", headers=couple_headers).status_code == 200
    assert client.get(f"/api/v1/weddings/{other_id}", headers=couple_headers).status_code == 403
    denied_event = client.post(f"/api/v1/weddings/{other_id}/events", json={
        "name": "Unauthorized event", "date": "2027-02-01", "start_time": "10:00", "end_time": "11:00",
        "venue_hall": "Test Venue", "coordinator_name": "Ignored",
    })
    assert denied_event.status_code == 403
    visible = client.get("/api/v1/weddings", headers=couple_headers)
    assert visible.status_code == 200
    assert {item["id"] for item in visible.json()["data"]} == {own_id}

    guest = client.post(
        f"/api/v1/weddings/{own_id}/guests",
        json={"name": "Guest One", "side": "mutual", "rsvp_status": "pending"},
        headers=couple_headers,
    )
    assert guest.status_code == 201, guest.text
    guest_id = guest.json()["data"]["id"]
    assert [item["id"] for item in client.get(f"/api/v1/weddings/{own_id}/guests").json()["data"]] == [guest_id]
    assert client.get(f"/api/v1/weddings/{other_id}/guests").status_code == 403
    updated_guest = client.patch(f"/api/v1/guests/{guest_id}", json={"rsvp_status": "confirmed"})
    assert updated_guest.status_code == 200
    assert updated_guest.json()["data"]["rsvp_status"] == "confirmed"
    assert client.delete(f"/api/v1/guests/{guest_id}").status_code == 200
    assert client.get(f"/api/v1/weddings/{own_id}/guests").json()["data"] == []

    client.cookies.delete("everwed_session")
    second_email = f"couple-b-{suffix}@example.com"
    second_user = client.post(
        "/api/v1/auth/users",
        json={
            "name": "Second Couple",
            "email": second_email,
            "password": "Couple-Password-2!",
            "role": "couple",
            "wedding_id": other_id,
        },
    )
    assert second_user.status_code == 201, second_user.text
    client.post("/api/v1/auth/login", json={"username": second_email, "password": "Couple-Password-2!"})
    assert client.get(f"/api/v1/weddings/{other_id}").status_code == 200
    assert client.get(f"/api/v1/weddings/{own_id}").status_code == 403


def test_newly_created_planner_is_auto_assigned_to_existing_unassigned_wedding(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:10]
    wedding = client.post(
        "/api/v1/weddings",
        json={
            "title": f"Planner Access Test {suffix}",
            "bride_name": "Bride",
            "groom_name": "Groom",
            "contact_phone": "+91 90000 00000",
            "contact_email": f"couple-{suffix}@example.com",
            "destination": "Jaipur",
            "primary_venue": "Test Venue",
            "guest_estimate": 100,
            "budget_allocated": 1000000,
            "start_date": "2027-02-01",
            "end_date": "2027-02-02",
        },
    )
    assert wedding.status_code == 201, wedding.text
    wedding_id = wedding.json()["data"]["id"]
    planner = client.post(
        "/api/v1/auth/users",
        json={
            "name": "Unassigned Planner",
            "email": f"planner-{suffix}@example.com",
            "password": "Planner-Password-1!",
            "role": "planner",
        },
    )
    assert planner.status_code == 201, planner.text
    login = client.post(
        "/api/v1/auth/login",
        json={"username": f"planner-{suffix}@example.com", "password": "Planner-Password-1!"},
    )
    assert login.status_code == 200, login.text
    assert login.json()["data"].get("token") is None
    assigned = client.get(f"/api/v1/weddings/{wedding_id}")
    assert assigned.status_code == 200
    assert assigned.json()["data"]["assigned_planner_email"] == f"planner-{suffix}@example.com"


def test_planner_application_requires_founder_approval(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:10]
    email = f"applicant-{suffix}@example.com"
    response = client.post("/api/v1/auth/planner-signup", json={
        "name": "Planner Applicant", "email": email, "phone": "+1 415 555 0198",
        "password": "Planner-Application-9!",
    })
    assert response.status_code == 201, response.text
    applicant = next(user for user in __import__("app.services.store", fromlist=["store"]).store.users.values() if user.get("email") == email)
    assert applicant["active"] is False
    assert applicant["approval_status"] == "pending"
    pending_login = client.post("/api/v1/auth/login", json={"username": email, "password": "Planner-Application-9!"})
    assert pending_login.status_code == 403
    assert "awaiting Founder approval" in pending_login.json()["error"]["message"]
    pending_reactivation = client.patch(f"/api/v1/auth/users/{applicant['uid']}/status", json={"active": True})
    assert pending_reactivation.status_code == 403
    approved = client.patch(f"/api/v1/auth/users/{applicant['uid']}/approval", json={"status": "approved"})
    assert approved.status_code == 200, approved.text
    assert approved.json()["data"]["active"] is True
    assert approved.json()["data"]["approval_status"] == "approved"
    assert client.post("/api/v1/auth/login", json={"username": email, "password": "Planner-Application-9!"}).status_code == 200


def test_couple_onboarding_persists_preferences_and_selected_functions(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:10]
    created = client.post("/api/v1/auth/users", json={
        "name": "Partner One & Partner Two", "email": f"couple-onboard-{suffix}@example.com",
        "password": "Couple-Onboarding-9!", "role": "couple",
        "partner_one_name": "Partner One", "partner_two_name": "Partner Two", "phone": "+1 415 555 0167",
    })
    assert created.status_code == 201, created.text
    client.cookies.delete("everwed_session")
    assert client.post("/api/v1/auth/login", json={"username": f"couple-onboard-{suffix}@example.com", "password": "Couple-Onboarding-9!"}).status_code == 200
    setup = client.post("/api/v1/weddings/onboarding", json={
        "destination": "Toronto", "primary_venue": "Garden Hall", "guest_estimate": 120,
        "budget_allocated": 250000, "start_date": "2027-08-10", "end_date": "2027-08-12",
        "tradition": "Interfaith / Mixed", "regional_customization": "English and Punjabi family ceremonies",
        "functions": [{"name": "Family ceremony", "date": "2027-08-10", "start_time": "10:00", "end_time": "11:30"}],
    })
    assert setup.status_code == 201, setup.text
    wedding = setup.json()["data"]
    assert wedding["title"] == "Partner One & Partner Two"
    assert wedding["tradition"] == "Interfaith / Mixed"
    assert wedding["regional_customization"] == "English and Punjabi family ceremonies"
    assert wedding["events_count"] == 1
    event_list = client.get(f"/api/v1/weddings/{wedding['id']}/events")
    assert event_list.status_code == 200, event_list.text
    assert event_list.json()["data"][0]["name"] == "Family ceremony"
    assert event_list.json()["data"][0]["coordinator_name"] == "Partner One & Partner Two"
    added = client.post(f"/api/v1/weddings/{wedding['id']}/events", json={
        "name": "Reception", "date": "2027-08-12", "start_time": "18:00", "end_time": "22:00",
        "venue_hall": "Garden Hall", "coordinator_name": "Untrusted client value",
    })
    assert added.status_code == 201, added.text
    assert added.json()["data"]["coordinator_name"] == "Partner One & Partner Two"
    from app.database.sqlite import SQLiteDatabase
    from app.services.store import store
    from app.services.store import Store

    reopened = Store(SQLiteDatabase(store.database.path))
    assert reopened.weddings[wedding["id"]]["tradition"] == "Interfaith / Mixed"
    assert {event["name"] for event in reopened.events.values() if event["wedding_id"] == wedding["id"]} == {"Family ceremony", "Reception"}
    reopened.close()


def test_founder_assignment_scopes_planner_dashboard_and_finance(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:10]
    payload = {
        "title": f"Assigned {suffix}",
        "bride_name": "A",
        "groom_name": "B",
        "contact_phone": "+91 90000 00000",
        "contact_email": f"couple-{suffix}@example.com",
        "destination": "Custom",
        "primary_venue": "Private venue",
        "guest_estimate": 60,
        "budget_allocated": 500000,
        "package_fee": 200000,
        "start_date": "2027-02-01",
        "end_date": "2027-02-02",
    }
    wedding = client.post("/api/v1/weddings", json=payload).json()["data"]
    other = client.post(
        "/api/v1/weddings",
        json={**payload, "title": f"Unassigned {suffix}", "contact_email": f"other-{suffix}@example.com"},
    ).json()["data"]
    planner_email = f"planner-{suffix}@example.com"
    created = client.post(
        "/api/v1/auth/users",
        json={
            "name": "Assigned Planner",
            "email": planner_email,
            "password": "Planner-Password-1!",
            "role": "planner",
        },
    )
    assert created.status_code == 201, created.text
    login = client.post(
        "/api/v1/auth/login",
        json={"username": planner_email, "password": "Planner-Password-1!"},
    )
    assert login.status_code == 200, login.text
    assert login.json()["data"].get("token") is None
    planner_headers = {}

    payment = {
        "wedding_id": other["id"],
        "stage": "booking_deposit",
        "amount": 1000,
        "transaction_reference": f"TXN-UNASSIGNED-{suffix}",
        "payment_date": "2027-01-01",
    }
    denied = client.post("/api/v1/finance/client-payments", json=payment, headers=planner_headers)
    assert denied.status_code == 403, denied.text

    client.cookies.delete("everwed_session")
    assignment = client.post(
        f"/api/v1/weddings/{wedding['id']}/planner-assignment",
        json={"planner_email": planner_email},
    )
    assert assignment.status_code == 200, assignment.text
    assert assignment.json()["data"]["assigned_planner_email"] == planner_email
    client.post(
        "/api/v1/auth/login",
        json={"username": planner_email, "password": "Planner-Password-1!"},
    )
    assert client.get(f"/api/v1/weddings/{wedding['id']}", headers=planner_headers).status_code == 200
    assert client.get(f"/api/v1/weddings/{other['id']}", headers=planner_headers).status_code == 403

    overview = client.get("/api/v1/dashboard/overview", headers=planner_headers)
    assert overview.status_code == 200, overview.text
    visible_weddings = overview.json()["data"]["active_weddings"]
    assert {item["wedding_id"] for item in visible_weddings} == {wedding["id"]}

    payment["wedding_id"] = wedding["id"]
    allowed = client.post("/api/v1/finance/client-payments", json=payment, headers=planner_headers)
    assert allowed.status_code == 201, allowed.text


def test_cookie_session_rejects_disallowed_mutation_origin(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"username": "test-founder@example.com", "password": "Test-Founder-Password-1!"},
    )
    assert login.status_code == 200, login.text
    response = client.post("/api/v1/auth/logout", headers={"Origin": "https://attacker.example"})
    assert response.status_code == 403
    assert client.get("/api/v1/auth/me").status_code == 200


def test_admin_deactivation_revokes_sessions_and_prevents_self_lockout(client: TestClient) -> None:
    admin_uid = client.get("/api/v1/auth/me").json()["data"]["uid"]
    suffix = uuid.uuid4().hex[:10]
    created = client.post(
        "/api/v1/auth/users",
        json={
            "name": "Lifecycle Planner",
            "email": f"lifecycle-{suffix}@example.com",
            "password": "Lifecycle-Password-1!",
            "role": "planner",
        },
    )
    assert created.status_code == 201, created.text
    user_uid = created.json()["data"]["uid"]

    login = client.post(
        "/api/v1/auth/login",
        json={"username": f"lifecycle-{suffix}@example.com", "password": "Lifecycle-Password-1!"},
    )
    assert login.status_code == 200, login.text
    client.cookies.delete("everwed_session")

    response = client.patch(f"/api/v1/auth/users/{user_uid}/status", json={"active": False})
    assert response.status_code == 200, response.text
    assert response.json()["data"]["active"] is False

    from app.services.store import store

    planner = next(item for item in store.users.values() if item["uid"] == user_uid)
    planner_sessions = [item for item in store.sessions.values() if item["user_id"] == planner["id"]]
    assert planner_sessions and all(item["revoked"] for item in planner_sessions)

    rejected_login = client.post(
        "/api/v1/auth/login",
        json={"username": f"lifecycle-{suffix}@example.com", "password": "Lifecycle-Password-1!"},
    )
    assert rejected_login.status_code == 401
    client.cookies.delete("everwed_session")
    assert client.patch(f"/api/v1/auth/users/{admin_uid}/status", json={"active": False}).status_code == 403


def test_public_couple_signup_onboards_only_its_own_wedding(client: TestClient) -> None:
    from app.core.security import verify_password
    from app.services.store import store

    suffix = uuid.uuid4().hex[:10]
    email = f"new-couple-{suffix}@example.com"
    payload = {
        "partner_one_name": "Avery",
        "partner_two_name": "Jordan",
        "email": email,
        "phone": "+1 415 555 0123",
        "password": "EverWed-Secure-2026!",
        "terms_accepted": True,
    }
    signup = client.post("/api/v1/auth/couple-signup", json=payload)
    assert signup.status_code == 201, signup.text
    body = signup.json()["data"]
    assert body.get("token") is None
    assert body["user"]["role"] == "couple"
    assert body["user"]["wedding_id"] is None
    account = next(item for item in store.users.values() if item["email"] == email)
    assert verify_password(payload["password"], account["password_hash"])
    assert account["partner_one_name"] == "Avery"

    duplicate = client.post("/api/v1/auth/couple-signup", json=payload)
    assert duplicate.status_code == 409
    assert client.post("/api/v1/auth/couple-signup", json={**payload, "role": "admin"}).status_code == 422
    assert client.post("/api/v1/auth/couple-signup", json={**payload, "terms_accepted": False, "email": f"terms-{suffix}@example.com"}).status_code == 422
    assert client.post("/api/v1/auth/couple-signup", json={**payload, "password": "weak-password", "email": f"weak-{suffix}@example.com"}).status_code == 422

    onboarding_payload = {
        "destination": "Portland",
        "primary_venue": "Community Hall",
        "guest_estimate": 120,
        "budget_allocated": 45000,
        "start_date": "2027-08-14",
        "end_date": "2027-08-15",
        "theme": "Garden dinner",
    }
    onboarded = client.post("/api/v1/weddings/onboarding", json=onboarding_payload)
    assert onboarded.status_code == 201, onboarded.text
    wedding_id = onboarded.json()["data"]["id"]
    assert onboarded.json()["data"]["bride_name"] == "Avery"
    assert client.get("/api/v1/auth/me").json()["data"]["wedding_id"] == wedding_id
    assert [item["id"] for item in client.get("/api/v1/weddings").json()["data"]] == [wedding_id]
    assert client.post("/api/v1/weddings/onboarding", json=onboarding_payload).status_code == 403

    client.cookies.delete("everwed_session")
    other = client.post(
        "/api/v1/weddings",
        json={
            "title": f"Other Wedding {suffix}",
            "bride_name": "Other",
            "groom_name": "Person",
            "contact_phone": "+1 415 555 0100",
            "contact_email": f"other-{suffix}@example.com",
            "primary_venue": "Other Venue",
            "budget_allocated": 1000,
            "start_date": "2027-09-01",
            "end_date": "2027-09-02",
        },
    )
    assert other.status_code == 201
    login = client.post("/api/v1/auth/login", json={"username": email, "password": payload["password"]})
    assert login.status_code == 200
    assert client.get(f"/api/v1/weddings/{other.json()['data']['id']}").status_code == 403


def test_couple_signup_waits_until_founder_initializes_workspace(client: TestClient) -> None:
    from app.services.store import store

    previous_states = [(user_id, user.get("active", True)) for user_id, user in store.users.items()]
    with store.transaction(immediate=True):
        for user_id, user in store.users.items():
            user["active"] = False
            store.users[user_id] = user
    email = f"pre-founder-{uuid.uuid4().hex[:10]}@example.com"
    try:
        response = client.post(
            "/api/v1/auth/couple-signup",
            json={
                "partner_one_name": "Casey",
                "partner_two_name": "Taylor",
                "email": email,
                "phone": "+1 415 555 0140",
                "password": "EverWed-Secure-2026!",
                "terms_accepted": True,
            },
        )
        assert response.status_code == 403
        assert not any(user.get("email") == email for user in store.users.values())
    finally:
        with store.transaction(immediate=True):
            for user_id, active in previous_states:
                user = store.users.get(user_id)
                if user is not None:
                    user["active"] = active
                    store.users[user_id] = user
