"""
Royal Knot OS — pytest configuration and shared fixtures.

NOTE: All tests in this module are **unit tests** (mocked, no live Odoo).
      Real integration tests against a live Odoo instance should be placed
      in ``tests/integration/``.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings


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
    from app.main import create_app
    test_app = create_app()
    return TestClient(test_app)
