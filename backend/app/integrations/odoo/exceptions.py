"""
Royal Knot OS — Odoo-specific exception re-exports.

Keeps imports tidy for modules inside ``app.integrations.odoo``.
If Odoo-specific exceptions beyond the core set are ever needed, define them here.
"""

from app.core.exceptions import (  # noqa: F401 — re-exported
    OdooAuthenticationError,
    OdooConnectionError,
    OdooRecordNotFound,
    OdooValidationError,
)
