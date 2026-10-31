"""
Royal Knot OS — Custom exception hierarchy.

Every domain exception inherits from :class:`RoyalKnotException` so that the
centralised error handler in ``app.middleware.error_handler`` can catch them
uniformly.
"""

from __future__ import annotations


class RoyalKnotException(Exception):
    """Base exception for all Royal Knot OS errors."""

    def __init__(
        self,
        status_code: int = 500,
        detail: str = "An unexpected error occurred",
        error_code: str = "INTERNAL_ERROR",
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        super().__init__(detail)


# ── Odoo-related exceptions ─────────────────────────────────────────────


class OdooConnectionError(RoyalKnotException):
    """Raised when the application cannot reach the Odoo server."""

    def __init__(self, detail: str = "Cannot connect to Odoo server") -> None:
        super().__init__(status_code=503, detail=detail, error_code="ODOO_CONNECTION_ERROR")


class OdooAuthenticationError(RoyalKnotException):
    """Raised when Odoo authentication fails (bad credentials)."""

    def __init__(self, detail: str = "Odoo authentication failed") -> None:
        super().__init__(status_code=401, detail=detail, error_code="ODOO_AUTH_ERROR")


class OdooRecordNotFound(RoyalKnotException):
    """Raised when a requested record does not exist in Odoo."""

    def __init__(self, detail: str = "Record not found in Odoo") -> None:
        super().__init__(status_code=404, detail=detail, error_code="ODOO_RECORD_NOT_FOUND")


class OdooValidationError(RoyalKnotException):
    """Raised when Odoo rejects data due to validation constraints."""

    def __init__(self, detail: str = "Odoo validation error") -> None:
        super().__init__(status_code=422, detail=detail, error_code="ODOO_VALIDATION_ERROR")


# ── Application-level exceptions ────────────────────────────────────────


class PermissionDeniedError(RoyalKnotException):
    """Raised when the user lacks the required permission / role."""

    def __init__(self, detail: str = "Permission denied") -> None:
        super().__init__(status_code=403, detail=detail, error_code="PERMISSION_DENIED")


class DuplicateRecordError(RoyalKnotException):
    """Raised when a create/write would violate a uniqueness constraint."""

    def __init__(self, detail: str = "Duplicate record") -> None:
        super().__init__(status_code=409, detail=detail, error_code="DUPLICATE_RECORD")
