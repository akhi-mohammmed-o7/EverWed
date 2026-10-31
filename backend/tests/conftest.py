"""
Royal Knot OS — pytest configuration and shared fixtures.

NOTE: All tests in this module are **unit tests** (mocked, no live Odoo).
      Real integration tests against a live Odoo instance should be placed
      in ``tests/integration/``.
"""

from __future__ import annotations

import atexit
import os
import shutil
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings


_original_database_path = os.environ.get("DATABASE_PATH")
_original_secret_key = os.environ.get("SECRET_KEY")
_original_debug = os.environ.get("DEBUG")
_test_database_directory = Path(tempfile.mkdtemp(prefix="everwed-tests-"))
os.environ["DATABASE_PATH"] = str(_test_database_directory / "test.sqlite3")
os.environ["SECRET_KEY"] = "pytest-secret-key-long-enough-for-hmac-tests-only"
os.environ["DEBUG"] = "true"
atexit.register(shutil.rmtree, _test_database_directory, ignore_errors=True)


def pytest_sessionfinish(session, exitstatus):
    if _original_database_path is None:
        os.environ.pop("DATABASE_PATH", None)
    else:
        os.environ["DATABASE_PATH"] = _original_database_path
    if _original_secret_key is None:
        os.environ.pop("SECRET_KEY", None)
    else:
        os.environ["SECRET_KEY"] = _original_secret_key
    if _original_debug is None:
        os.environ.pop("DEBUG", None)
    else:
        os.environ["DEBUG"] = _original_debug


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    """Clear the settings LRU cache before/after each test so that
    environment changes (or per-test overrides) take effect."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture()
def client() -> TestClient:
    """Return a ``TestClient`` bound to the Royal Knot OS application."""
    from app.core.security import create_session, create_user_record
    from app.services.store import store

    from app.main import create_app

    user = next(
        (item for item in store.users.values() if item.get("email") == "test-founder@example.com"),
        None,
    )
    with store.transaction(immediate=True):
        if user is None:
            user = create_user_record(
                name="Test Founder",
                email="test-founder@example.com",
                password="Test-Founder-Password-1!",
                role="admin",
            )
        token = create_session(user)
    test_app = create_app()
    return TestClient(test_app, headers={"Authorization": f"Bearer {token}"})
