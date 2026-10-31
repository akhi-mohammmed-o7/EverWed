"""Provision an additional Founder (admin) account for local development.

Credentials are supplied through environment variables so that no plaintext
password is committed to source control or printed in output:

    EVERWED_FOUNDER_EMAIL=...
    EVERWED_FOUNDER_PASSWORD=...   (minimum 12 characters)
    EVERWED_FOUNDER_NAME=...       (optional)

Existing accounts, including the current Founder, are never modified. If the
email already exists the script exits without changing its password.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import create_user_record, public_user  # noqa: E402
from app.services.store import store  # noqa: E402


def main() -> int:
    email = (os.environ.get("EVERWED_FOUNDER_EMAIL") or "").strip().lower()
    password = os.environ.get("EVERWED_FOUNDER_PASSWORD") or ""
    name = (os.environ.get("EVERWED_FOUNDER_NAME") or "EverWed Founder").strip()

    if not email or "@" not in email:
        print("EVERWED_FOUNDER_EMAIL must be set to a valid email address.", file=sys.stderr)
        return 2
    if len(password) < 12:
        print("EVERWED_FOUNDER_PASSWORD must contain at least 12 characters.", file=sys.stderr)
        return 2

    existing = next(
        (user for user in store.users.values() if user.get("email") == email),
        None,
    )
    if existing is not None:
        print(
            f"An account already exists for {email} (role={existing.get('role')}); "
            "no credentials were changed."
        )
        return 0

    with store.transaction(immediate=True):
        user = create_user_record(
            name=name or "EverWed Founder",
            email=email,
            password=password,
            role="admin",
        )

    profile = public_user(user)
    print(
        f"Founder account provisioned: uid={profile['uid']} email={profile['email']} "
        f"role={profile['role']} active={profile['active']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
