"""
Royal Knot OS — Authentication schemas.
"""

from __future__ import annotations

import re
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_validator

UserRole = Literal["admin", "planner", "team", "finance", "couple"]


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
    wedding_id: Optional[str] = None
    active: bool = True
    approval_status: Optional[str] = None


class FirstFounderSetup(BaseModel):
    """One-time local bootstrap used before any user account exists."""

    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    password: SecretStr

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value.strip()):
            raise ValueError("Enter a valid email address")
        return value.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) < 12:
            raise ValueError("Password must contain at least 12 characters")
        return value


class UserCreate(FirstFounderSetup):
    """User account provisioned by an administrator."""

    role: UserRole
    wedding_id: Optional[str] = None
    partner_one_name: Optional[str] = Field(None, min_length=1, max_length=120)
    partner_two_name: Optional[str] = Field(None, min_length=1, max_length=120)
    phone: Optional[str] = Field(None, min_length=8, max_length=30)


class UserStatusUpdate(BaseModel):
    active: bool


class CoupleSignup(BaseModel):
    model_config = ConfigDict(extra="forbid")

    partner_one_name: str = Field(min_length=1, max_length=120)
    partner_two_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    phone: str = Field(min_length=8, max_length=30)
    password: SecretStr
    terms_accepted: bool

    @field_validator("email")
    @classmethod
    def validate_signup_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        normalized = value.strip()
        if not re.fullmatch(r"\+?[0-9][0-9\s().-]{6,28}[0-9]", normalized):
            raise ValueError("Enter a valid phone number")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_signup_password(cls, value: SecretStr) -> SecretStr:
        password = value.get_secret_value()
        if len(password) < 12 or not re.search(r"[a-z]", password) or not re.search(r"[A-Z]", password) or not re.search(r"\d", password) or not re.search(r"[^A-Za-z0-9]", password):
            raise ValueError("Password must be 12+ characters and include upper and lower case letters, a number, and a symbol")
        return value

    @field_validator("terms_accepted")
    @classmethod
    def require_terms(cls, accepted: bool) -> bool:
        if not accepted:
            raise ValueError("You must accept the terms to create an account")
        return accepted


class CoupleSignupResponse(BaseModel):
    token: Optional[str] = None
    user: UserInfo


class PlannerSignup(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    phone: str = Field(min_length=8, max_length=30)
    password: SecretStr

    @field_validator("email")
    @classmethod
    def validate_planner_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_planner_phone(cls, value: str) -> str:
        normalized = value.strip()
        if not re.fullmatch(r"\+?[0-9][0-9\s().-]{6,28}[0-9]", normalized):
            raise ValueError("Enter a valid phone number")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_planner_password(cls, value: SecretStr) -> SecretStr:
        password = value.get_secret_value()
        if len(password) < 12 or not re.search(r"[a-z]", password) or not re.search(r"[A-Z]", password) or not re.search(r"\d", password) or not re.search(r"[^A-Za-z0-9]", password):
            raise ValueError("Password must be 12+ characters and include upper and lower case letters, a number, and a symbol")
        return value


class PlannerApprovalUpdate(BaseModel):
    status: Literal["approved", "rejected"]


class LoginResponse(BaseModel):
    """Successful login response."""

    # Browser sessions are sent in an HttpOnly cookie; the token is never
    # returned in JSON. Optional preserves a shared response envelope.
    token: Optional[str] = None
    user: UserInfo
