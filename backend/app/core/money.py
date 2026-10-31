"""Exact INR conversion helpers; application amounts are persisted as paise."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Iterable, Mapping


def to_paise(amount: int | float | str | Decimal | None) -> int:
    """Convert an INR amount to integer paise, rounding half up to 2 decimals."""
    if amount is None:
        return 0
    try:
        value = Decimal(str(amount))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("Money amount must be a finite decimal number") from exc
    if not value.is_finite():
        raise ValueError("Money amount must be a finite decimal number")
    return int((value * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def from_paise(amount_paise: int) -> float:
    """Return an API-compatible INR number from integer paise."""
    return int(amount_paise) / 100


def normalize_rupees(amount: int | float | str | Decimal | None) -> float:
    """Normalize a rupee amount to the precision that can be represented in paise."""
    return from_paise(to_paise(amount))


def sum_paise(records: Iterable[Mapping[str, object]], field: str) -> int:
    """Sum legacy-shaped INR records without floating point arithmetic."""
    return sum(to_paise(record.get(field)) for record in records)
