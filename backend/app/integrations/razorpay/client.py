"""Small async Razorpay Payment Links client; secrets never leave the backend."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import Settings
from app.core.exceptions import RoyalKnotException

logger = logging.getLogger("everwed.razorpay")


class PaymentProviderError(Exception):
    def __init__(self, message: str, *, outcome_unknown: bool) -> None:
        super().__init__(message)
        self.outcome_unknown = outcome_unknown


class RazorpayClient:
    BASE_URL = "https://api.razorpay.com/v1"

    def __init__(self, settings: Settings) -> None:
        if not settings.razorpay_configured:
            raise RoyalKnotException(
                status_code=503,
                detail="Online payments are not configured. Contact the wedding team to pay offline.",
                error_code="PAYMENTS_NOT_CONFIGURED",
            )
        self._key_id = settings.razorpay_key_id.strip()
        self._key_secret = settings.razorpay_key_secret.get_secret_value()
        self._timeout = settings.razorpay_api_timeout_seconds

    async def create_payment_link(self, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    f"{self.BASE_URL}/payment_links/",
                    auth=(self._key_id, self._key_secret),
                    json=payload,
                )
        except httpx.RequestError as exc:
            logger.warning("Razorpay Payment Link request had an unknown outcome (%s)", type(exc).__name__)
            raise PaymentProviderError("The payment provider could not be reached.", outcome_unknown=True) from exc

        if response.is_error:
            # Do not include the provider response body; it may contain customer data.
            logger.warning("Razorpay Payment Link request rejected with HTTP %s", response.status_code)
            raise PaymentProviderError(
                "The payment provider rejected this payment request.",
                outcome_unknown=response.status_code >= 500,
            )
        try:
            result = response.json()
        except ValueError as exc:
            raise PaymentProviderError("The payment provider returned an unreadable response.", outcome_unknown=True) from exc
        if not isinstance(result, dict) or not result.get("id") or not result.get("short_url"):
            raise PaymentProviderError("The payment provider returned an incomplete payment link.", outcome_unknown=True)
        if not str(result["short_url"]).startswith("https://"):
            raise PaymentProviderError("The payment provider returned an invalid checkout URL.", outcome_unknown=True)
        return result
