"""
Royal Knot OS — FastAPI dependencies.

Reusable dependency functions injected into route handlers.
"""

from __future__ import annotations

from typing import Callable

from fastapi import Request

from app.core.exceptions import OdooAuthenticationError, PermissionDeniedError
from app.core.security import get_session


def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency that extracts and validates the Bearer token from the
    ``Authorization`` header and returns the associated session data.

    Raises:
        OdooAuthenticationError: If the header is missing, malformed, or the
            token does not correspond to a valid session.
    """
    auth_header: str | None = request.headers.get("Authorization")
    if not auth_header:
        raise OdooAuthenticationError(detail="Missing Authorization header")

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise OdooAuthenticationError(detail="Invalid Authorization header format (expected 'Bearer <token>')")

    token = parts[1]
    user_data = get_session(token)
    if user_data is None:
        raise OdooAuthenticationError(detail="Invalid or expired session token")

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
