"""
Royal Knot OS — Authentication schemas.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, SecretStr


class LoginRequest(BaseModel):
    """Payload for ``POST /api/v1/auth/login``."""

    username: str
    password: SecretStr


class UserInfo(BaseModel):
    """Lightweight user representation returned after authentication."""

    uid: int
    name: str
    email: Optional[str] = None
    role: str


class LoginResponse(BaseModel):
    """Successful login response."""

    token: str
    user: UserInfo
