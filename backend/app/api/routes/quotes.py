"""
Royal Knot OS — Quotation & Price Comparison API Routes.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import ensure_wedding_access, require_quote_access, require_role, require_wedding_query_access
from app.schemas.common import APIResponse
from app.schemas.vendor import QuoteComparisonResponse, QuoteCreate, QuoteResponse
from app.services.vendor_service import QuoteService

router = APIRouter(prefix="/api/v1/quotes", tags=["quotes"])


@router.post("", response_model=APIResponse[QuoteResponse], status_code=status.HTTP_201_CREATED)
async def create_quote(
    payload: QuoteCreate,
    current_user: dict = Depends(require_role("admin", "planner")),
):
    """Record a vendor quotation (fixed or per-plate) for a wedding."""
    ensure_wedding_access(current_user, payload.wedding_id)
    data = QuoteService.create_quote(payload)
    return APIResponse(success=True, data=data)


@router.get("", response_model=APIResponse[List[QuoteResponse]])
async def list_quotes(
    wedding_id: str = Query(..., description="Wedding ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    _: dict = Depends(require_wedding_query_access),
):
    """Retrieve all quotations submitted for a wedding."""
    data = QuoteService.list_quotes(wedding_id=wedding_id, category=category)
    return APIResponse(success=True, data=data)


@router.get("/compare", response_model=APIResponse[QuoteComparisonResponse])
async def compare_quotes(
    wedding_id: str = Query(..., description="Wedding ID"),
    category: str = Query(..., description="Category to compare, e.g. Catering, Decor"),
    _: dict = Depends(require_wedding_query_access),
):
    """Side-by-side quotation comparison with price-per-plate normalized against wedding guest count."""
    data = QuoteService.compare_quotes(wedding_id=wedding_id, category=category)
    return APIResponse(success=True, data=data)


@router.post("/{quote_id}/select", response_model=APIResponse)
async def select_winning_quote(
    quote_id: str,
    _: dict = Depends(require_role("admin", "planner")),
    __: dict = Depends(require_quote_access),
):
    """Select winning vendor quote. Automatically marks competing quotes in that category as rejected."""
    data = QuoteService.select_winning_quote(quote_id)
    return APIResponse(success=True, data=data)

