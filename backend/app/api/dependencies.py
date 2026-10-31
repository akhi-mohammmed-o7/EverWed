"""
Royal Knot OS — FastAPI dependencies.

Reusable dependency functions injected into route handlers.
"""

from __future__ import annotations

from typing import Callable

from fastapi import Depends, Query, Request

from app.core.exceptions import AuthenticationError, OdooRecordNotFound, PermissionDeniedError
from app.core.security import get_session
from app.services.store import store


def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency that extracts and validates the Bearer token from the
    ``Authorization`` header and returns the associated session data.

    Raises:
        AuthenticationError: If the header is missing, malformed, or the
            token does not correspond to a valid session.
    """
    # Browser sessions use HttpOnly cookies. Bearer headers remain supported
    # for local API clients and legacy integrations.
    token = request.cookies.get("everwed_session")
    if not token:
        auth_header: str | None = request.headers.get("Authorization")
        if not auth_header:
            raise AuthenticationError(detail="Authentication is required")
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationError(detail="Invalid Authorization header format (expected 'Bearer <token>')")
        token = parts[1]
    user_data = get_session(token)
    if user_data is None:
        raise AuthenticationError(detail="Invalid or expired session token")

    return user_data


def require_role(*roles: str) -> Callable:
    """
    Dependency factory that checks whether the current user holds one of the
    specified *roles*.

    Usage::

        @router.get("/admin-only", dependencies=[Depends(require_role("admin", "manager"))])
        async def admin_view(): ...
    """

    def _check(request: Request) -> dict:
        user = get_current_user(request)
        user_role = user.get("role", "")
        if user_role not in roles:
            raise PermissionDeniedError(
                detail=f"Role '{user_role}' is not in the allowed roles: {', '.join(roles)}",
            )
        return user

    return _check


def ensure_wedding_access(user: dict, wedding_id: str) -> dict:
    """Return the wedding only when the caller is allowed to view its data."""
    wedding = store.weddings.get(wedding_id)
    if not wedding:
        raise OdooRecordNotFound(detail=f"Wedding '{wedding_id}' not found")

    role = user.get("role")
    if role in {"admin", "finance"}:
        return wedding

    user_ids = {str(user.get("user_id", "")), str(user.get("uid", ""))}
    if role in {"planner", "team"}:
        assigned = {
            str(wedding.get("assigned_planner_id", "")),
            str(wedding.get("assigned_owner_id", "")),
            *(str(value) for value in wedding.get("assigned_user_ids", [])),
            *(str(value) for value in user.get("assigned_wedding_ids", [])),
        }
        if user_ids & assigned or wedding_id == user.get("wedding_id"):
            return wedding
    elif role == "couple":
        if wedding_id == user.get("wedding_id") or (
            user.get("email") and user.get("email", "").lower()
            in {wedding.get("contact_email", "").lower(), wedding.get("bride_email", "").lower(), wedding.get("groom_email", "").lower()}
        ):
            return wedding

    raise PermissionDeniedError("You do not have access to this wedding")


def can_access_wedding(user: dict, wedding_id: str) -> bool:
    try:
        ensure_wedding_access(user, wedding_id)
        return True
    except (PermissionDeniedError, OdooRecordNotFound):
        return False


def require_wedding_access(
    wedding_id: str,
    user: dict = Depends(get_current_user),
) -> dict:
    return ensure_wedding_access(user, wedding_id)


def require_wedding_query_access(
    wedding_id: str = Query(...),
    user: dict = Depends(get_current_user),
) -> dict:
    return ensure_wedding_access(user, wedding_id)


def require_event_access(event_id: str, user: dict = Depends(get_current_user)) -> dict:
    event = store.events.get(event_id)
    if not event:
        raise OdooRecordNotFound(detail=f"Event '{event_id}' not found")
    ensure_wedding_access(user, event["wedding_id"])
    return user


def require_task_access(task_id: str, user: dict = Depends(get_current_user)) -> dict:
    task = store.tasks.get(task_id)
    if not task:
        raise OdooRecordNotFound(detail=f"Task '{task_id}' not found")
    ensure_wedding_access(user, task["wedding_id"])
    return user


def require_schedule_access(item_id: str, user: dict = Depends(get_current_user)) -> dict:
    item = store.schedules.get(item_id)
    if not item:
        raise OdooRecordNotFound(detail=f"Schedule item '{item_id}' not found")
    ensure_wedding_access(user, item["wedding_id"])
    return user


def require_issue_access(issue_id: str, user: dict = Depends(get_current_user)) -> dict:
    issue = store.operational_issues.get(issue_id)
    if not issue:
        raise OdooRecordNotFound(detail=f"Operational issue '{issue_id}' not found")
    ensure_wedding_access(user, issue["wedding_id"])
    return user


def require_quote_access(quote_id: str, user: dict = Depends(get_current_user)) -> dict:
    quote = store.quotes.get(quote_id)
    if not quote:
        raise OdooRecordNotFound(detail=f"Quote '{quote_id}' not found")
    ensure_wedding_access(user, quote["wedding_id"])
    return user
