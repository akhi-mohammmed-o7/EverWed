"""
Royal Knot OS — Authentication routes.

Handles login (Odoo XML-RPC authentication), logout (session invalidation),
and ``/me`` (retrieve current user from session).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Request

from app.api.dependencies import get_current_user
from app.core.exceptions import OdooAuthenticationError, OdooConnectionError
from app.core.security import create_session, delete_session
from app.integrations.odoo.client import get_odoo_client
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo
from app.schemas.common import APIResponse

logger = logging.getLogger("royal_knot.auth")

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    """
    Authenticate a user against Odoo via XML-RPC.

    On success a session token is created and returned alongside basic user info.
    """
    client = get_odoo_client()

    # Override client credentials with the login payload
    client._username = payload.username
    client._password = payload.password.get_secret_value()

    try:
        uid = client.authenticate()
    except OdooConnectionError:
        raise
    except OdooAuthenticationError:
        raise

    # Fetch basic user info from Odoo
    try:
        user_records = client.search_read(
            "res.users",
            [["id", "=", uid]],
            ["name", "email", "groups_id"],
            limit=1,
        )
    except Exception as exc:
        logger.error("Failed to fetch user info for uid=%s: %s", uid, exc)
        user_records = []

    name = "Unknown"
    email: str | None = None
    role = "user"

    if user_records:
        user_rec = user_records[0]
        name = user_rec.get("name", "Unknown")
        email = user_rec.get("email") or user_rec.get("login") or None
        # Simple role detection — check for admin group
        groups = user_rec.get("groups_id", [])
        # Odoo admin group is typically group id 1 (base.group_system)
        # For now, fall back to a simple heuristic
        if uid == 2 or (isinstance(groups, list) and 1 in groups):
            role = "admin"

    user_info = UserInfo(uid=uid, name=name, email=email, role=role)

    # Persist session
    session_data = user_info.model_dump()
    token = create_session(session_data)

    logger.info("User '%s' (uid=%s) logged in", name, uid)

    return LoginResponse(token=token, user=user_info)


@router.post("/logout", response_model=APIResponse)
async def logout(request: Request) -> APIResponse:
    """Invalidate the current session."""
    auth_header: str | None = request.headers.get("Authorization")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            deleted = delete_session(token)
            if deleted:
                return APIResponse(success=True, data={"message": "Logged out successfully"})

    return APIResponse(success=True, data={"message": "No active session to invalidate"})


@router.get("/me", response_model=APIResponse)
async def me(current_user: dict = Depends(get_current_user)) -> APIResponse:
    """Return information about the currently authenticated user."""
    return APIResponse(success=True, data=current_user)
