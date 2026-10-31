"""
Royal Knot OS — Health endpoint tests.

These are **unit tests** (mocked) — Odoo is not required to be running.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Tests for ``GET /api/v1/health``."""

    def test_health_returns_200(self, client: TestClient) -> None:
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_health_has_expected_fields(self, client: TestClient) -> None:
        data = client.get("/api/v1/health").json()
        assert "status" in data
        assert "version" in data
        assert "odoo_connected" in data
        assert "timestamp" in data

    def test_health_status_is_healthy(self, client: TestClient) -> None:
        data = client.get("/api/v1/health").json()
        assert data["status"] == "healthy"

    def test_health_version_matches_config(self, client: TestClient) -> None:
        from app.core.config import get_settings
        settings = get_settings()
        data = client.get("/api/v1/health").json()
        assert data["version"] == settings.app_version

    def test_health_odoo_not_connected_when_unavailable(self, client: TestClient) -> None:
        """Odoo is not running in the test environment — should be False."""
        data = client.get("/api/v1/health").json()
        assert data["odoo_connected"] is False


class TestAuthEndpointsWithoutOdoo:
    """Basic smoke tests for auth routes when Odoo is unavailable."""

    def test_login_without_odoo_returns_error(self, client: TestClient) -> None:
        """Login should fail gracefully when Odoo is not reachable."""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin"},
        )
        # Should be 503 (Odoo unreachable) or 401 (auth failed)
        assert response.status_code in (401, 503)

    def test_me_without_auth_returns_401(self, client: TestClient) -> None:
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_me_with_invalid_token_returns_401(self, client: TestClient) -> None:
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token-xxx"},
        )
        assert response.status_code == 401

    def test_logout_without_session_succeeds(self, client: TestClient) -> None:
        """Logout should gracefully handle no active session."""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 200

