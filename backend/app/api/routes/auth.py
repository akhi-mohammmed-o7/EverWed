"""Application user authentication, account setup, and session routes."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, Response, status

from app.api.dependencies import get_current_user, require_role
from app.core.exceptions import AuthenticationError, PermissionDeniedError, RoyalKnotException
from app.core.config import get_settings
from app.core.security import (
    create_session,
    create_user_record,
    delete_session,
    public_user,
    verify_password,
)
from app.schemas.auth import CoupleSignup, FirstFounderSetup, LoginRequest, LoginResponse, PlannerApprovalUpdate, PlannerProfileUpdate, PlannerSignup, UserCreate, UserInfo, UserStatusUpdate
from app.schemas.common import APIResponse
from app.services.store import store
from app.services.wedding_service import WeddingService

logger = logging.getLogger("everwed.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/planner-signup", response_model=APIResponse[dict[str, str]], status_code=status.HTTP_201_CREATED)
async def planner_signup(payload: PlannerSignup) -> APIResponse[dict[str, str]]:
    """Create an inactive planner application; only a Founder can approve it."""
    with store.transaction(immediate=True):
        if not any(user.get("role") == "admin" and user.get("active") for user in store.users.values()):
            raise PermissionDeniedError("The Founder must initialize this workspace before Planner applications are enabled")
        user = create_user_record(name=payload.name, email=payload.email, password=payload.password.get_secret_value(), role="planner")
        user["phone"] = payload.phone
        user["active"] = False
        user["approval_status"] = "pending"
        store.users[user["id"]] = user
    logger.info("Planner application received: uid=%s", user["uid"])
    return APIResponse(success=True, data={"message": "Your application is awaiting Founder approval."})


@router.post("/couple-signup", response_model=APIResponse[LoginResponse], status_code=status.HTTP_201_CREATED)
async def couple_signup(payload: CoupleSignup, response: Response) -> APIResponse[LoginResponse]:
    """Public couple registration; the role is assigned by the server."""
    with store.transaction(immediate=True):
        if not any(user.get("role") == "admin" and user.get("active") for user in store.users.values()):
            raise PermissionDeniedError("The Founder must initialize this workspace before Couple registration is enabled")
        user = create_user_record(
            name=f"{payload.partner_one_name.strip()} & {payload.partner_two_name.strip()}",
            email=payload.email,
            password=payload.password.get_secret_value(),
            role="couple",
        )
        user["partner_one_name"] = payload.partner_one_name.strip()
        user["partner_two_name"] = payload.partner_two_name.strip()
        user["phone"] = payload.phone
        store.users[user["id"]] = user
        token = create_session(user)
    _set_session_cookie(response, token)
    logger.info("Couple account registered: uid=%s", user["uid"])
    return APIResponse(success=True, data=LoginResponse(user=UserInfo(**public_user(user))))


@router.get("/setup/status", response_model=APIResponse[dict[str, bool]])
async def founder_setup_status() -> APIResponse[dict[str, bool]]:
    """Report whether the first Founder account still needs to be created."""
    return APIResponse(success=True, data={"available": len(store.users) == 0})


@router.post("/setup", response_model=APIResponse[LoginResponse], status_code=status.HTTP_201_CREATED)
async def setup_first_founder(payload: FirstFounderSetup, response: Response) -> APIResponse[LoginResponse]:
    """Create the first Founder account once; later accounts need an admin."""
    with store.transaction(immediate=True):
        if len(store.users):
            raise PermissionDeniedError("Initial Founder setup has already been completed")
        user = create_user_record(
            name=payload.name,
            email=payload.email,
            password=payload.password.get_secret_value(),
            role="admin",
        )
        token = create_session(user)
    _set_session_cookie(response, token)
    logger.info("Initial Founder account created: uid=%s", user["uid"])
    return APIResponse(success=True, data=LoginResponse(user=UserInfo(**public_user(user))))


@router.post("/login", response_model=APIResponse[LoginResponse])
async def login(payload: LoginRequest, response: Response) -> APIResponse[LoginResponse]:
    """Verify a stored password hash and issue a signed, expiring session."""
    email = payload.username.strip().lower()
    user = next((item for item in store.users.values() if item.get("email") == email), None)
    if not user or not verify_password(payload.password.get_secret_value(), user.get("password_hash", "")):
        raise AuthenticationError()
    if not user.get("active"):
        if user.get("role") == "planner" and user.get("approval_status") == "pending":
            raise PermissionDeniedError("Your planner application is awaiting Founder approval.")
        # Deactivated accounts are rejected with the same response as invalid
        # credentials so their status is not disclosed to an unauthenticated caller.
        raise AuthenticationError()

    with store.transaction(immediate=True):
        current_user = store.users.get(user["id"])
        if not current_user or not current_user.get("active"):
            raise AuthenticationError()
        token = create_session(current_user)
    _set_session_cookie(response, token)

    logger.info("User logged in: uid=%s role=%s", current_user["uid"], current_user["role"])
    return APIResponse(success=True, data=LoginResponse(user=UserInfo(**public_user(current_user))))


@router.post("/users", response_model=APIResponse[UserInfo], status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    current_user: dict = Depends(require_role("admin")),
) -> APIResponse[UserInfo]:
    """Allow the Founder to provision team, finance, planner, or couple users."""
    if payload.role == "admin":
        raise PermissionDeniedError("Only the one-time setup can create a Founder account")
    if payload.role == "couple" and not payload.wedding_id and not all((payload.partner_one_name, payload.partner_two_name, payload.phone)):
        raise RoyalKnotException(
            status_code=422,
            detail="Couple accounts without a wedding need both partner names and a phone number for onboarding.",
            error_code="COUPLE_PROFILE_REQUIRED",
        )
    with store.transaction(immediate=True):
        user = create_user_record(
            name=payload.name,
            email=payload.email,
            password=payload.password.get_secret_value(),
            role=payload.role,
            wedding_id=payload.wedding_id,
        )
        if payload.role == "couple":
            user["partner_one_name"] = payload.partner_one_name.strip() if payload.partner_one_name else None
            user["partner_two_name"] = payload.partner_two_name.strip() if payload.partner_two_name else None
            user["phone"] = payload.phone.strip() if payload.phone else None
            store.users[user["id"]] = user
    logger.info("User account created: uid=%s role=%s by uid=%s", user["uid"], user["role"], current_user["uid"])
    if payload.role == "planner" and user.get("active"):
        WeddingService.auto_assign_unassigned_weddings()
    return APIResponse(success=True, data=UserInfo(**public_user(user)))


@router.get("/users", response_model=APIResponse[list[UserInfo]])
async def list_users(
    _: dict = Depends(require_role("admin")),
) -> APIResponse[list[UserInfo]]:
    users = sorted(store.users.values(), key=lambda item: item["uid"])
    return APIResponse(success=True, data=[UserInfo(**public_user(user)) for user in users])


@router.patch("/users/{user_uid}/status", response_model=APIResponse[UserInfo])
async def update_user_status(
    user_uid: int,
    payload: UserStatusUpdate,
    current_user: dict = Depends(require_role("admin")),
) -> APIResponse[UserInfo]:
    """Activate/deactivate a user; deactivation revokes all of their sessions."""
    record = next((item for item in store.users.values() if int(item["uid"]) == user_uid), None)
    if not record:
        raise RoyalKnotException(status_code=404, detail="User not found.", error_code="USER_NOT_FOUND")
    if record.get("role") == "planner" and record.get("approval_status") == "pending" and payload.active:
        raise PermissionDeniedError("Pending Planner applications must be approved through the approval workflow")
    if not payload.active and record["id"] == current_user.get("user_id"):
        raise PermissionDeniedError("You cannot deactivate your own Founder account")
    with store.transaction(immediate=True):
        record["active"] = payload.active
        store.users[record["id"]] = record
        if not payload.active:
            for session_id, session in store.sessions.items():
                if session.get("user_id") == record["id"] and not session.get("revoked"):
                    session["revoked"] = True
                    store.sessions[session_id] = session
    return APIResponse(success=True, data=UserInfo(**public_user(record)))


@router.patch("/users/{user_uid}/approval", response_model=APIResponse[UserInfo])
async def update_planner_approval(
    user_uid: int,
    payload: PlannerApprovalUpdate,
    current_user: dict = Depends(require_role("admin")),
) -> APIResponse[UserInfo]:
    record = next((item for item in store.users.values() if int(item["uid"]) == user_uid), None)
    if not record or record.get("role") != "planner":
        raise RoyalKnotException(status_code=404, detail="Planner application not found.", error_code="PLANNER_APPLICATION_NOT_FOUND")
    if record["id"] == current_user.get("user_id"):
        raise PermissionDeniedError("You cannot approve or reject your own account")
    with store.transaction(immediate=True):
        record["approval_status"] = payload.status
        record["active"] = payload.status == "approved"
        record["updated_at"] = datetime.now(timezone.utc)
        store.users[record["id"]] = record
        if payload.status == "rejected":
            for session_id, session in store.sessions.items():
                if session.get("user_id") == record["id"] and not session.get("revoked"):
                    session["revoked"] = True
                    store.sessions[session_id] = session
    logger.info("Planner application %s: uid=%s by uid=%s", payload.status, record["uid"], current_user["uid"])
    if payload.status == "approved":
        WeddingService.auto_assign_unassigned_weddings()
    return APIResponse(success=True, data=UserInfo(**public_user(record)))


@router.patch("/planner-profile", response_model=APIResponse[UserInfo])
async def update_planner_profile(
    payload: PlannerProfileUpdate,
    current_user: dict = Depends(require_role("planner")),
) -> APIResponse[UserInfo]:
    """Allow Planners to maintain the public profile couples use for selection."""
    with store.transaction(immediate=True):
        record = store.users.get(current_user["user_id"])
        if not record or record.get("role") != "planner" or not record.get("active"):
            raise PermissionDeniedError("An active Planner account is required.")
        record.update(payload.model_dump())
        record["updated_at"] = datetime.now(timezone.utc)
        store.users[record["id"]] = record
    return APIResponse(success=True, data=UserInfo(**public_user(record)))


@router.post("/logout", response_model=APIResponse)
async def logout(request: Request, response: Response) -> APIResponse:
    """Revoke the current persisted session."""
    auth_header = request.headers.get("Authorization", "")
    parts = auth_header.split()
    token = request.cookies.get("everwed_session")
    if not token and len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
    revoked = delete_session(token) if token else False
    response.delete_cookie("everwed_session", path="/", httponly=True, samesite="lax", secure=not get_settings().debug)
    return APIResponse(
        success=True,
        data={"message": "Logged out successfully" if revoked else "No active session to invalidate"},
    )


def _set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key="everwed_session",
        value=token,
        max_age=settings.session_ttl_minutes * 60,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        path="/",
    )


@router.get("/me", response_model=APIResponse[UserInfo])
async def me(current_user: dict = Depends(get_current_user)) -> APIResponse[UserInfo]:
    """Return the current authenticated user's public profile."""
    return APIResponse(success=True, data=UserInfo(**current_user))
