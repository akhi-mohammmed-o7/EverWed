"""
Royal Knot OS — Odoo XML-RPC Client.

Central client for all Odoo interactions via the XML-RPC protocol.
Uses Python's built-in ``xmlrpc.client`` — no external dependencies.

Usage::

    from app.integrations.odoo.client import get_odoo_client

    client = get_odoo_client()
    uid = client.authenticate()
    partners = client.search_read("res.partner", [["is_company", "=", True]], ["name", "email"])
"""

from __future__ import annotations

import http.client
import logging
import socket
import xmlrpc.client
from typing import Any, Dict, List, Optional, Sequence

from app.core.config import get_settings
from app.core.exceptions import (
    OdooAuthenticationError,
    OdooConnectionError,
    OdooRecordNotFound,
    OdooValidationError,
)

logger = logging.getLogger("royal_knot.odoo_client")

# ── Timeout-aware XML-RPC transport ────────────────────────────────────

_XMLRPC_TIMEOUT = 10  # seconds


class _TimeoutTransport(xmlrpc.client.Transport):
    """XML-RPC transport with a configurable socket timeout."""

    def __init__(self, timeout: int = _XMLRPC_TIMEOUT, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self._timeout = timeout

    def make_connection(self, host: str) -> http.client.HTTPConnection:  # type: ignore[override]
        conn = super().make_connection(host)
        conn.timeout = self._timeout
        return conn


class _TimeoutSafeTransport(xmlrpc.client.SafeTransport):
    """XML-RPC safe (HTTPS) transport with a configurable socket timeout."""

    def __init__(self, timeout: int = _XMLRPC_TIMEOUT, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self._timeout = timeout

    def make_connection(self, host: str) -> http.client.HTTPSConnection:  # type: ignore[override]
        conn = super().make_connection(host)
        conn.timeout = self._timeout
        return conn


class OdooClient:
    """Thin wrapper around Odoo's XML-RPC API (``/xmlrpc/2/``)."""

    def __init__(
        self,
        url: str,
        db: str,
        username: str,
        password: str,
        timeout: int = _XMLRPC_TIMEOUT,
    ) -> None:
        self._url = url.rstrip("/")
        self._db = db
        self._username = username
        self._password = password  # never logged
        self._uid: Optional[int] = None
        self._timeout = timeout

        logger.info(
            "OdooClient initialised — url=%s db=%s user=%s",
            self._url,
            self._db,
            self._username,
        )

    # ── Proxy helpers ────────────────────────────────────────────────

    def _make_transport(self) -> xmlrpc.client.Transport:
        """Return a transport with timeout, picking HTTP or HTTPS."""
        if self._url.startswith("https"):
            return _TimeoutSafeTransport(timeout=self._timeout)
        return _TimeoutTransport(timeout=self._timeout)

    def _get_common_proxy(self) -> xmlrpc.client.ServerProxy:
        """Return a ServerProxy for ``/xmlrpc/2/common``."""
        return xmlrpc.client.ServerProxy(
            f"{self._url}/xmlrpc/2/common",
            transport=self._make_transport(),
            allow_none=True,
        )

    def _get_object_proxy(self) -> xmlrpc.client.ServerProxy:
        """Return a ServerProxy for ``/xmlrpc/2/object``."""
        return xmlrpc.client.ServerProxy(
            f"{self._url}/xmlrpc/2/object",
            transport=self._make_transport(),
            allow_none=True,
        )

    # ── Properties ───────────────────────────────────────────────────

    @property
    def is_connected(self) -> bool:
        """``True`` if :meth:`authenticate` has successfully run."""
        return self._uid is not None

    # ── Authentication ───────────────────────────────────────────────

    def authenticate(self) -> int:
        """
        Authenticate against Odoo and cache the resulting UID.

        Raises:
            OdooAuthenticationError: If credentials are rejected.
            OdooConnectionError: If the server is unreachable.
        """
        try:
            common = self._get_common_proxy()
            uid = common.authenticate(
                self._db,
                self._username,
                self._password,
                {},
            )
        except (ConnectionRefusedError, socket.timeout, OSError) as exc:
            raise OdooConnectionError(
                detail=f"Cannot reach Odoo at {self._url}: {exc}",
            ) from exc
        except xmlrpc.client.Fault as exc:
            raise OdooAuthenticationError(
                detail=f"Odoo XML-RPC fault during authentication: {exc.faultString}",
            ) from exc

        if not uid:
            raise OdooAuthenticationError(
                detail="Invalid Odoo credentials (uid is falsy)",
            )

        self._uid = int(uid)
        logger.info("Authenticated as uid=%s user=%s", self._uid, self._username)
        return self._uid

    # ── Generic execute ──────────────────────────────────────────────

    def execute(
        self,
        model: str,
        method: str,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        """
        Call ``execute_kw`` on an Odoo model.

        The client must be authenticated first.

        Raises:
            OdooConnectionError: On network-level failures.
            OdooAuthenticationError: If the client hasn't authenticated.
            OdooValidationError: If Odoo returns a fault.
        """
        if self._uid is None:
            raise OdooAuthenticationError(
                detail="OdooClient is not authenticated — call authenticate() first",
            )

        try:
            proxy = self._get_object_proxy()
            return proxy.execute_kw(
                self._db,
                self._uid,
                self._password,
                model,
                method,
                list(args) if args else [],
                kwargs if kwargs else {},
            )
        except (ConnectionRefusedError, socket.timeout, OSError) as exc:
            raise OdooConnectionError(
                detail=f"Lost connection to Odoo during execute: {exc}",
            ) from exc
        except xmlrpc.client.Fault as exc:
            fault = exc.faultString
            if "Record does not exist" in fault or "MissingError" in fault:
                raise OdooRecordNotFound(detail=fault) from exc
            raise OdooValidationError(detail=fault) from exc

    # ── Convenience wrappers ─────────────────────────────────────────

    def search_read(
        self,
        model: str,
        domain: Optional[List] = None,
        fields: Optional[List[str]] = None,
        limit: int = 80,
        offset: int = 0,
        order: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Search and read records in one call."""
        kwargs: Dict[str, Any] = {
            "fields": fields or [],
            "limit": limit,
            "offset": offset,
        }
        if order:
            kwargs["order"] = order

        return self.execute(model, "search_read", domain or [], **kwargs)

    def create(self, model: str, values: Dict[str, Any]) -> int:
        """Create a single record. Returns the new record ID."""
        return self.execute(model, "create", [values])

    def write(
        self,
        model: str,
        record_ids: Sequence[int],
        values: Dict[str, Any],
    ) -> bool:
        """Update existing records. Returns ``True`` on success."""
        return self.execute(model, "write", list(record_ids), values)

    def unlink(self, model: str, record_ids: Sequence[int]) -> bool:
        """Delete records. Returns ``True`` on success."""
        return self.execute(model, "unlink", list(record_ids))

    def read(
        self,
        model: str,
        record_ids: Sequence[int],
        fields: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Read specific records by ID."""
        kwargs: Dict[str, Any] = {}
        if fields:
            kwargs["fields"] = fields
        return self.execute(model, "read", list(record_ids), **kwargs)

    def search_count(self, model: str, domain: Optional[List] = None) -> int:
        """Return the count of records matching *domain*."""
        return self.execute(model, "search_count", domain or [])

    # ── Connectivity check ───────────────────────────────────────────

    def check_connection(self) -> Dict[str, Any]:
        """
        Test connectivity by calling ``version()`` on the common endpoint.

        Returns:
            A dict with Odoo version info (``server_version``, etc.).

        Raises:
            OdooConnectionError: If the server is unreachable.
        """
        try:
            common = self._get_common_proxy()
            version_info: Dict[str, Any] = common.version()
            return version_info
        except (ConnectionRefusedError, socket.timeout, OSError) as exc:
            raise OdooConnectionError(
                detail=f"Odoo connectivity check failed: {exc}",
            ) from exc
        except xmlrpc.client.Fault as exc:
            raise OdooConnectionError(
                detail=f"Odoo XML-RPC fault on version check: {exc.faultString}",
            ) from exc


# ── Module-level helper ─────────────────────────────────────────────────


def get_odoo_client() -> OdooClient:
    """
    Create and return an :class:`OdooClient` using the application settings.

    The client is **not** authenticated — call :meth:`OdooClient.authenticate`
    explicitly when needed.
    """
    settings = get_settings()
    return OdooClient(
        url=settings.odoo_url,
        db=settings.odoo_db,
        username=settings.odoo_username,
        password=settings.odoo_password,
        timeout=settings.odoo_timeout,
    )
