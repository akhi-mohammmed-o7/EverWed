"""
Royal Knot OS — Central In-Memory Store & Odoo Synchronization Hub.

Maintains data persistence for development, evaluation, and offline workflows,
and delegates to Odoo XML-RPC endpoints when Odoo is configured and reachable.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator, MutableMapping
from contextlib import contextmanager
from typing import Any, Dict, List, Optional

from app.core.config import get_settings
from app.database.sqlite import COLLECTIONS, SQLiteDatabase
from app.integrations.odoo.client import get_odoo_client


# Inclusive baseline templates; ceremony-specific tasks belong to selected events.
STANDARD_WEDDING_TASKS = [
    # ── Venue & Legal ──
    {"title": "Confirm venue requirements, access and signed agreement", "category": "Venue", "priority": "urgent", "days_offset": -90},
    {"title": "Obtain Local Sound & Late-Night Music Licenses (PPL / IPRS)", "category": "Legal/Contract", "priority": "high", "days_offset": -60},
    {"title": "Agree guest count range and update it as RSVPs arrive", "category": "Hospitality", "priority": "high", "days_offset": -45},
    {"title": "Create the couple's planning priorities and decision timeline", "category": "Planning", "priority": "medium", "days_offset": -30},
    
    # ── Theme & Decor ──
    {"title": "Confirm decor concept, materials and venue constraints", "category": "Decor", "priority": "high", "days_offset": -45},
    {"title": "Review ceremony and event preferences with the couple", "category": "Ceremony", "priority": "high", "days_offset": -30},
    {"title": "Review supplier insurance, permits and contingency plans", "category": "Logistics", "priority": "urgent", "days_offset": -20},
    {"title": "Review invitation wording, languages and distribution list", "category": "Invitations", "priority": "medium", "days_offset": -25},
    
    # ── Food & Beverage ──
    {"title": "Shortlist and contract catering based on guest needs", "category": "Catering", "priority": "high", "days_offset": -50},
    {"title": "Confirm guest dietary, accessibility and hospitality needs", "category": "Catering", "priority": "urgent", "days_offset": -40},
    {"title": "Confirm menus and service timing with the couple", "category": "Catering", "priority": "low", "days_offset": -20},
    {"title": "Confirm supplier balances and any approved extras", "category": "Finance", "priority": "medium", "days_offset": -15},
    
    # ── Entertainment & Production ──
    {"title": "Book entertainment and production requested by the couple", "category": "Entertainment", "priority": "high", "days_offset": -60},
    {"title": "Confirm photography and videography coverage", "category": "Photography", "priority": "medium", "days_offset": -35},
    {"title": "Confirm sound, lighting and venue technical requirements", "category": "Audio/Visual", "priority": "high", "days_offset": -2},
    {"title": "Prepare and approve the photo and video priorities", "category": "Photography", "priority": "medium", "days_offset": -15},
    
    # ── Events: Mehendi & Haldi ──
    {"title": "Confirm event-specific suppliers and their deliverables", "category": "Vendor Management", "priority": "medium", "days_offset": -2},
    {"title": "Prepare a schedule for each confirmed event", "category": "Planning", "priority": "medium", "days_offset": -3},
    {"title": "Confirm accommodation and rooming requirements", "category": "Hospitality", "priority": "medium", "days_offset": -2},
    
    # ── Events: Wedding Day & Varmala ──
    {"title": "Confirm guest arrival, transport and access arrangements", "category": "Day-of", "priority": "urgent", "days_offset": 0},
    {"title": "Check venue readiness and supplier setup against the run sheet", "category": "Day-of", "priority": "high", "days_offset": 0},
    {"title": "Coordinate ceremony requirements selected by the couple", "category": "Day-of", "priority": "high", "days_offset": 0},
    {"title": "Coordinate event transitions and respond to live issues", "category": "Day-of", "priority": "high", "days_offset": 0},
    
    # ── Events: Grand Reception ──
    {"title": "Confirm strike, lost property and venue handover", "category": "Logistics", "priority": "medium", "days_offset": +1},
    {"title": "Collect guest feedback and return borrowed items", "category": "Hospitality", "priority": "high", "days_offset": +1},
    
    # ── Post-Event & Settlement ──
    {"title": "Reconcile supplier invoices, approved extras and final balances", "category": "Finance", "priority": "urgent", "days_offset": +2},
    {"title": "Review supplier delivery and record outstanding items", "category": "Vendor Management", "priority": "high", "days_offset": +3},
    {"title": "Collect agreed photography and video deliverables", "category": "Photography", "priority": "medium", "days_offset": +7},
    {"title": "Close the event budget and document final variances", "category": "Finance", "priority": "urgent", "days_offset": +5},
]


class PersistentCollection(MutableMapping[str, dict]):
    """Mapping-compatible repository for one SQLite collection table."""

    def __init__(self, database: SQLiteDatabase, name: str) -> None:
        if name not in COLLECTIONS:
            raise ValueError(f"Unknown EverWed collection: {name}")
        self.database = database
        self.name = name

    def __getitem__(self, key: str) -> dict:
        value = self.database.get(self.name, str(key))
        if value is None:
            raise KeyError(key)
        return value

    def __setitem__(self, key: str, value: dict) -> None:
        record = dict(value)
        record["id"] = str(key)
        self.database.upsert(self.name, str(key), record)

    def __delitem__(self, key: str) -> None:
        if not self.database.delete(self.name, str(key)):
            raise KeyError(key)

    def __iter__(self) -> Iterator[str]:
        return iter(self.database.all(self.name, ids_only=True))

    def __len__(self) -> int:
        return self.database.count(self.name)

    def values(self) -> list[dict]:
        return self.database.all(self.name)

    def items(self) -> list[tuple[str, dict]]:
        return [(record["id"], record) for record in self.values()]


class Store:
    """Persistent repository used by all backend business services."""

    def __init__(self, database: SQLiteDatabase | None = None) -> None:
        settings = get_settings()
        self.database = database or SQLiteDatabase(
            settings.database_path,
            busy_timeout_ms=settings.database_busy_timeout_ms,
        )
        # Fail startup on database errors; never mask a failure by using a
        # fresh in-memory store.
        self.database.initialize()
        for collection in COLLECTIONS:
            setattr(self, collection, PersistentCollection(self.database, collection))

    @contextmanager
    def transaction(self, *, immediate: bool = False):
        with self.database.transaction(immediate=immediate):
            yield

    def ping(self) -> bool:
        return self.database.ping()

    def close(self) -> None:
        self.database.close()

# Global singleton instance
store = Store()

