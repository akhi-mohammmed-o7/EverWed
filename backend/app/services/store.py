"""
Royal Knot OS — Central In-Memory Store & Odoo Synchronization Hub.

Maintains data persistence for development, evaluation, and offline workflows,
and delegates to Odoo XML-RPC endpoints when Odoo is configured and reachable.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.config import get_settings
from app.integrations.odoo.client import get_odoo_client


# Standard 25+ Luxury Wedding Task Templates from Royal Knot operational playbook
STANDARD_WEDDING_TASKS = [
    # ── Venue & Legal ──
    {"title": "Execute Palace / Heritage Venue Rental Agreement", "category": "Venue", "priority": "urgent", "days_offset": -90},
    {"title": "Obtain Local Sound & Late-Night Music Licenses (PPL / IPRS)", "category": "Legal/Contract", "priority": "high", "days_offset": -60},
    {"title": "Finalize Room Block Allocation for 400+ Guests", "category": "Hospitality", "priority": "high", "days_offset": -45},
    {"title": "Coordinate Helicopter / Vintage Car Charter for Baraat", "category": "Logistics", "priority": "medium", "days_offset": -30},
    
    # ── Theme & Decor ──
    {"title": "Approve Royal Heritage Floral Design & Lighting Renders", "category": "Decor", "priority": "high", "days_offset": -45},
    {"title": "Confirm Mandap Structure Engineering & Fabric Drapes", "category": "Decor", "priority": "high", "days_offset": -30},
    {"title": "Reserve Backup Power Generators (500kVA for Mandap & Sound)", "category": "Logistics", "priority": "urgent", "days_offset": -20},
    {"title": "Design & Print Gold-Embossed Welcome Itineraries & Menus", "category": "Invitations", "priority": "medium", "days_offset": -25},
    
    # ── Food & Beverage ──
    {"title": "Conduct Menu Tasting with Shortlisted Heritage Caterers", "category": "Catering", "priority": "high", "days_offset": -50},
    {"title": "Lock 400-Guest Per-Plate Banquet Contract & Live Counters", "category": "Catering", "priority": "urgent", "days_offset": -40},
    {"title": "Source Imported Glassware & Personalized Barware", "category": "Catering", "priority": "low", "days_offset": -20},
    {"title": "Approve Midnight Snack & Chai Station Menu", "category": "Catering", "priority": "medium", "days_offset": -15},
    
    # ── Entertainment & Production ──
    {"title": "Book Sangeet Celebrity DJ & Live Dhol Troupe", "category": "Entertainment/DJ", "priority": "high", "days_offset": -60},
    {"title": "Schedule Couple & Family Sangeet Choreography Rehearsals", "category": "Entertainment/DJ", "priority": "medium", "days_offset": -35},
    {"title": "Install Line-Array Acoustics & Truss Lighting in Ballroom", "category": "Audio/Visual", "priority": "high", "days_offset": -2},
    {"title": "Review Drone Videography & Multi-Cam Photography Shot List", "category": "Photography", "priority": "medium", "days_offset": -15},
    
    # ── Events: Mehendi & Haldi ──
    {"title": "Setup Poolside Yellow & Marigold Decor for Haldi", "category": "Decor", "priority": "medium", "days_offset": -2},
    {"title": "Arrange 10 Master Mehendi Artists & Organic Henna Cones", "category": "Day-of", "priority": "medium", "days_offset": -3},
    {"title": "Deliver Custom Floral Jewelry for Bride & Bridesmaids", "category": "Day-of", "priority": "medium", "days_offset": -2},
    
    # ── Events: Wedding Day & Varmala ──
    {"title": "Verify Groom Baraat Route, Horse & Brass Band Timing", "category": "Day-of", "priority": "urgent", "days_offset": 0},
    {"title": "Inspect Fresh Rose Petal Showers & Pyro Cold-Fire Setup", "category": "Day-of", "priority": "high", "days_offset": 0},
    {"title": "Check Priest / Pandit Ji Vedic Setup & Sacred Fire Wood", "category": "Day-of", "priority": "high", "days_offset": 0},
    {"title": "Coordinate Bridal Suite Touch-Ups & Hair/Makeup Call Times", "category": "Day-of", "priority": "high", "days_offset": 0},
    
    # ── Events: Grand Reception ──
    {"title": "Setup 12-Piece Orchestra & Red Carpet Walkway", "category": "Audio/Visual", "priority": "medium", "days_offset": +1},
    {"title": "Manage VIP Guest Seating & Security Escort", "category": "Hospitality", "priority": "high", "days_offset": +1},
    
    # ── Post-Event & Settlement ──
    {"title": "Verify Actual Guest Plate Count with Head Caterer", "category": "Catering", "priority": "urgent", "days_offset": +2},
    {"title": "Audit Vendor Overtime & Extra Equipment Hours", "category": "Legal/Contract", "priority": "high", "days_offset": +3},
    {"title": "Collect Raw Photography Footage & Highlight Teaser", "category": "Photography", "priority": "medium", "days_offset": +7},
    {"title": "Reconcile All Advance Vouchers vs Final Vendor Invoices", "category": "Legal/Contract", "priority": "urgent", "days_offset": +5},
]


class Store:
    """Singleton in-memory data store with Odoo synchronization hooks."""

    def __init__(self) -> None:
        self.enquiries: Dict[str, dict] = {}
        self.weddings: Dict[str, dict] = {}
        self.events: Dict[str, dict] = {}
        self.vendors: Dict[str, dict] = {}
        self.quotes: Dict[str, dict] = {}
        self.tasks: Dict[str, dict] = {}
        self.schedules: Dict[str, dict] = {}
        self.vendor_arrivals: Dict[str, dict] = {}
        self.operational_issues: Dict[str, dict] = {}
        self.client_payments: Dict[str, dict] = {}
        self.vendor_bills: Dict[str, dict] = {}
        self.vendor_payments: Dict[str, dict] = {}
        self._seed_default_vendors()

    def _seed_default_vendors(self) -> None:
        """Pre-populate vetted luxury vendors from Jaipur & Udaipur circuit."""
        default_vendors = [
            {
                "id": "v-royal-palace-caterers",
                "name": "Rajputana Royal Feast & Catering",
                "category": "Catering",
                "contact_person": "Chef Vikram Rathore",
                "phone": "+91 98290 11223",
                "email": "vikram@rajputanafeast.com",
                "city": "Jaipur",
                "rating": 4.9,
                "services_offered": ["Heritage Marwari Thali", "Live Continental Counters", "Mughlai BBQ", "Dessert Studios"],
                "pricing_model_default": "per_plate",
                "bank_account_details": "HDFC0001234 - AC 50200011223344",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
            {
                "id": "v-shahi-caterers-udaipur",
                "name": "Mewar Shahi Banquets",
                "category": "Catering",
                "contact_person": "Manish Sharma",
                "phone": "+91 94140 55667",
                "email": "manish@mewarbanquets.com",
                "city": "Udaipur",
                "rating": 4.8,
                "services_offered": ["Royal Mewari Feasts", "Chaat Street", "Gourmet Pan-Asian"],
                "pricing_model_default": "per_plate",
                "bank_account_details": "ICIC0004321 - AC 001205009988",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
            {
                "id": "v-palace-decor",
                "name": "Virasat Decor & Spatial Design",
                "category": "Decor",
                "contact_person": "Ananya Sen",
                "phone": "+91 98290 77889",
                "email": "ananya@virasatdesign.in",
                "city": "Jaipur",
                "rating": 5.0,
                "services_offered": ["Floral Mandaps", "Bespoke Lighting", "Vintage Drapes", "Stage Architectural Renders"],
                "pricing_model_default": "fixed",
                "bank_account_details": "SBIN0007890 - AC 30987654321",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
            {
                "id": "v-royal-dhol-dj",
                "name": "DJ Kabir & Desert Beats Production",
                "category": "Entertainment/DJ",
                "contact_person": "Kabir Mathur",
                "phone": "+91 99280 44332",
                "email": "booking@djkabir.in",
                "city": "Jaipur",
                "rating": 4.9,
                "services_offered": ["Sangeet DJ", "Rajasthani Folk Troupe", "Live Dhol Players", "Intelligent Stage Lighting"],
                "pricing_model_default": "fixed",
                "bank_account_details": "KKBK0001122 - AC 9876543210",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
            {
                "id": "v-regal-photo",
                "name": "The Heritage Reel Studios",
                "category": "Photography",
                "contact_person": "Rohan Mehra",
                "phone": "+91 98280 99887",
                "email": "rohan@heritagereel.com",
                "city": "Udaipur",
                "rating": 4.95,
                "services_offered": ["Cinematic 4K Films", "Candid Photography", "Drone Coverage", "Live Streaming"],
                "pricing_model_default": "fixed",
                "bank_account_details": "AXIS0005566 - AC 91234567890",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
        ]
        for v in default_vendors:
            self.vendors[v["id"]] = v


# Global singleton instance
store = Store()

