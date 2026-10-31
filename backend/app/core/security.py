"""
Royal Knot OS — Session-based security helpers.

NOTE: This module uses an **in-memory** dict for session storage.
      This is intentional for the MVP — sessions do NOT survive server restarts
      and will NOT work with multiple workers.  Replace with Redis / DB-backed
      storage before going to production.
"""

from __future__ import annotations

import secrets
from typing import Dict, Optional


# ── In-memory session store (temporary — see module docstring) ────────────
_sessions: Dict[str, dict] = {}


def create_session(user_data: dict) -> str:
    """
    Create a new session for the given user data.

    Args:
        user_data: Arbitrary dict of user information to store in the session.

    Returns:
        A securely-generated session token (URL-safe, 64-char hex).
    """
    token = secrets.token_hex(32)
    _sessions[token] = user_data
    return token


def get_session(token: str) -> Optional[dict]:
    """
    Retrieve session data for the given token.

    Returns:
        The user-data dict if the token is valid, otherwise ``None``.
    """
    return _sessions.get(token)


def delete_session(token: str) -> bool:
    """
    Delete (invalidate) a session.

    Returns:
        ``True`` if the session existed and was removed, ``False`` otherwise.
    """
    return _sessions.pop(token, None) is not None
