"""Password hashing and signed, expiring JWT-backed sessions."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import RoyalKnotException
from app.services.store import store

_JWT_HEADER = {"alg": "HS256", "typ": "JWT"}
_PASSWORD_SCRYPT_N = 2**14
_PASSWORD_SCRYPT_R = 8
_PASSWORD_SCRYPT_P = 1
_INSECURE_DEFAULT_SECRET = "change-this-to-a-random-secret-key"
_SECRET_PLACEHOLDER = "replace-with-a-random-secret"


def _b64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _secret() -> bytes:
    secret = get_settings().secret_key
    if secret == _INSECURE_DEFAULT_SECRET or secret.startswith(_SECRET_PLACEHOLDER) or len(secret) < 32:
        raise RoyalKnotException(
            status_code=503,
            detail="Authentication is not configured. Set a random SECRET_KEY of at least 32 characters.",
            error_code="AUTH_CONFIGURATION_ERROR",
        )
    return secret.encode("utf-8")


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_PASSWORD_SCRYPT_N,
        r=_PASSWORD_SCRYPT_R,
        p=_PASSWORD_SCRYPT_P,
        dklen=64,
    )
    return f"scrypt${_PASSWORD_SCRYPT_N}${_PASSWORD_SCRYPT_R}${_PASSWORD_SCRYPT_P}${_b64url(salt)}${_b64url(digest)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt_text, digest_text = encoded.split("$")
        if algorithm != "scrypt":
            return False
        salt = _b64url_decode(salt_text)
        expected = _b64url_decode(digest_text)
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError, MemoryError):
        return False


def create_user_record(
    *,
    name: str,
    email: str,
    password: str,
    role: str,
    wedding_id: str | None = None,
) -> dict[str, Any]:
    """Create one user record. Call inside a transaction when uniqueness matters."""
    normalized_email = email.strip().lower()
    if any(user.get("email", "").lower() == normalized_email for user in store.users.values()):
        raise RoyalKnotException(
            status_code=409,
            detail="A user with this email address already exists.",
            error_code="DUPLICATE_USER",
        )
    if role == "couple" and wedding_id:
        wedding = store.weddings.get(wedding_id)
        if not wedding:
            raise RoyalKnotException(
                status_code=422,
                detail="Couple accounts must be assigned to an existing wedding.",
                error_code="WEDDING_ASSIGNMENT_REQUIRED",
            )

    uid = max((int(user.get("uid", 0)) for user in store.users.values()), default=0) + 1
    record = {
        "id": uuid.uuid4().hex,
        "uid": uid,
        "name": name.strip(),
        "email": normalized_email,
        "role": role,
        "active": True,
        "approval_status": "approved" if role == "planner" else None,
        "password_hash": hash_password(password),
        "wedding_id": wedding_id if role == "couple" else None,
        "created_at": datetime.now(timezone.utc),
    }
    store.users[record["id"]] = record
    return record


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "uid": int(user["uid"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "wedding_id": user.get("wedding_id"),
        "active": bool(user.get("active", False)),
        "approval_status": user.get("approval_status"),
        "partner_one_name": user.get("partner_one_name"),
        "partner_two_name": user.get("partner_two_name"),
    }


def _decode_token(token: str, *, allow_expired: bool = False) -> dict[str, Any] | None:
    try:
        header_text, payload_text, signature_text = token.split(".")
        signing_input = f"{header_text}.{payload_text}".encode("ascii")
        signature = _b64url_decode(signature_text)
        expected = hmac.new(_secret(), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected):
            return None
        header = json.loads(_b64url_decode(header_text))
        payload = json.loads(_b64url_decode(payload_text))
        if header != _JWT_HEADER:
            return None
        if not allow_expired and int(payload["exp"]) <= int(datetime.now(timezone.utc).timestamp()):
            return None
        return payload
    except (ValueError, KeyError, TypeError, json.JSONDecodeError, RoyalKnotException):
        return None


def create_session(user: dict[str, Any]) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.session_ttl_minutes)
    session_id = secrets.token_urlsafe(32)
    payload = {
        "sub": user["id"],
        "jti": session_id,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    header_segment = _b64url(json.dumps(_JWT_HEADER, separators=(",", ":")).encode("utf-8"))
    payload_segment = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    signature_segment = _b64url(hmac.new(_secret(), signing_input, hashlib.sha256).digest())
    token = f"{header_segment}.{payload_segment}.{signature_segment}"

    store.sessions[session_id] = {
        "id": session_id,
        "user_id": user["id"],
        "expires_at": expires_at,
        "revoked": False,
        "created_at": now,
    }
    return token


def get_session(token: str) -> dict[str, Any] | None:
    payload = _decode_token(token)
    if not payload:
        return None
    session = store.sessions.get(payload.get("jti", ""))
    if not session or session.get("revoked"):
        return None
    expires_at = session.get("expires_at")
    if not isinstance(expires_at, datetime) or expires_at <= datetime.now(timezone.utc):
        return None
    user = store.users.get(session.get("user_id", ""))
    if not user or not user.get("active", False):
        return None
    return public_user(user) | {"user_id": user["id"], "wedding_id": user.get("wedding_id")}


def delete_session(token: str) -> bool:
    payload = _decode_token(token, allow_expired=True)
    if not payload:
        return False
    session_id = payload.get("jti", "")
    session = store.sessions.get(session_id)
    if not session or session.get("revoked"):
        return False
    session["revoked"] = True
    store.sessions[session_id] = session
    return True
