"""
Royal Knot OS — Demo Data Seeder for Demonstrations and Manual Testing.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from app.services.store import STANDARD_WEDDING_TASKS, store

logger = logging.getLogger("royal_knot.seed")


def seed_demo_data() -> dict:
    """Seed demo records once without overwriting user or business records."""
    with store.transaction(immediate=True):
        if "enq-royal-demo-001" in store.enquiries:
            return {
                "message": "Demo data already exists; existing records were preserved",
                "wedding_id": "wed-royal-jaipur-001",
                "already_seeded": True,
            }
        result = _seed_demo_records()
        result["already_seeded"] = False
        return result


def _seed_demo_records() -> dict:
    """Populate the baseline luxury wedding demo records."""
    now = datetime.now(timezone.utc)
    
    # 1. Enquiry
    enquiry_id = "enq-royal-demo-001"
    store.enquiries[enquiry_id] = {
        "id": enquiry_id,
        "bride_name": "Aisha Sharma",
        "groom_name": "Vikram Singh Rathore",
        "contact_email": "aisha.vikram@heritageknot.com",
        "contact_phone": "+91 98290 12345",
        "enquiry_source": "Instagram",
        "package_type": "Full-Service",
        "target_date": "2026-12-10",
        "destination": "Jaipur",
        "estimated_guests": 450,
        "theme": "Royal Heritage Palace",
        "estimated_budget": 35000000.0,
        "requirements": "Destination palace wedding with authentic royal banquet, vintage drapes, and celebrity dhol.",
        "status": "confirmed",
        "meetings": [
            {
                "meeting_date": datetime(2026, 11, 5, 15, 0, tzinfo=timezone.utc),
                "location_or_link": "Rambagh Palace Jaipur Lounge",
                "notes": "Couple confirmed 450 guests, approved full-service planning.",
                "outcome": "Service agreement signed digitally.",
                "created_at": now,
            }
        ],
        "agreement_signed": True,
        "agreement_file": "https://storage.royalknot.in/agreements/aisha-vikram-signed.pdf",
        "converted_wedding_id": "wed-royal-jaipur-001",
        "odoo_lead_id": None,
        "odoo_partner_id": None,
        "created_at": now,
        "updated_at": now,
    }

    # 2. Wedding
    wedding_id = "wed-royal-jaipur-001"
    store.weddings[wedding_id] = {
        "id": wedding_id,
        "enquiry_id": enquiry_id,
        "title": "The Royal Union: Aisha & Vikram",
        "bride_name": "Aisha Sharma",
        "groom_name": "Vikram Singh Rathore",
        "contact_phone": "+91 98290 12345",
        "contact_email": "aisha.vikram@heritageknot.com",
        "destination": "Jaipur",
        "primary_venue": "City Palace & Rambagh, Jaipur",
        "package_type": "Full-Service",
        "guest_estimate": 450,
        "theme": "Royal Heritage Palace",
        "budget_allocated": 35000000.0,  # planning budget
        "package_fee": 35000000.0,
        "start_date": "2026-12-10",
        "end_date": "2026-12-13",
        "status": "in_progress",
        "events_count": 4,
        "vendors_count": 4,
        "tasks_count": len(STANDARD_WEDDING_TASKS),
        "tasks_completed": 8,
        "total_agreed_vendor_cost": 5750000.0,
        "total_paid_by_client": 25000000.0,
        "total_paid_to_vendors": 2475000.0,
        "odoo_project_id": None,
        "odoo_partner_id": None,
        "created_at": now,
        "updated_at": now,
    }

    # 3. Events
    events_data = [
        ("evt-mehendi", "Royal Mehendi", "2026-12-10", "14:00", "18:00", "Zenana Courtyard", "Pooja Verma", 250),
        ("evt-sangeet", "Desert Beats Sangeet", "2026-12-11", "19:00", "01:00", "Manek Chowk Stage", "Rohan Joshi", 450),
        ("evt-pheras", "Vedic Wedding & Sacred Pheras", "2026-12-12", "16:00", "21:00", "Sarvato Bhadra Mandap", "Pooja Verma", 450),
        ("evt-reception", "Grand Imperial Reception", "2026-12-13", "19:30", "23:30", "Chandra Mahal Gardens", "Arjun Rathore", 500),
    ]
    for eid, name, dt, st, et, vh, coord, guests in events_data:
        store.events[eid] = {
            "id": eid,
            "wedding_id": wedding_id,
            "name": name,
            "date": dt,
            "start_time": st,
            "end_time": et,
            "venue_hall": vh,
            "coordinator_name": coord,
            "coordinator_phone": "+91 98290 99001",
            "guest_estimate": guests,
            "status": "scheduled",
            "notes": "Luxury protocol in place.",
            "odoo_task_id": None,
            "created_at": now,
            "updated_at": now,
        }

    # 4. Explicit demo vendor fixtures (never injected by Store startup).
    demo_vendors = [
        {"id": "v-royal-palace-caterers", "name": "Rajputana Royal Feast & Catering", "category": "Catering", "contact_person": "Demo Catering Contact", "phone": "+91 90000 10001", "email": "catering-demo@example.invalid", "city": "Jaipur", "rating": 4.9, "services_offered": ["Banquet catering", "Live counters"]},
        {"id": "v-shahi-caterers-udaipur", "name": "Mewar Shahi Banquets", "category": "Catering", "contact_person": "Demo Banquet Contact", "phone": "+91 90000 10002", "email": "banquet-demo@example.invalid", "city": "Udaipur", "rating": 4.8, "services_offered": ["Banquet catering", "Dessert service"]},
        {"id": "v-palace-decor", "name": "Virasat Decor & Spatial Design", "category": "Decor", "contact_person": "Demo Decor Contact", "phone": "+91 90000 10003", "email": "decor-demo@example.invalid", "city": "Jaipur", "rating": 5.0, "services_offered": ["Floral design", "Lighting"]},
        {"id": "v-royal-dhol-dj", "name": "Desert Beats Production", "category": "Entertainment/DJ", "contact_person": "Demo Entertainment Contact", "phone": "+91 90000 10004", "email": "music-demo@example.invalid", "city": "Jaipur", "rating": 4.9, "services_offered": ["DJ", "Live music"]},
        {"id": "v-regal-photo", "name": "The Heritage Reel Studios", "category": "Photography", "contact_person": "Demo Photography Contact", "phone": "+91 90000 10005", "email": "photo-demo@example.invalid", "city": "Udaipur", "rating": 4.95, "services_offered": ["Photography", "Film"]},
    ]
    for vendor in demo_vendors:
        vendor.update({"created_at": now, "updated_at": now})
        store.vendors.setdefault(vendor["id"], vendor)

    # 5. Standard Tasks
    for i, tpl in enumerate(STANDARD_WEDDING_TASKS):
        tid = f"task-demo-{i+1:02d}"
        status = "done" if i < 8 else ("in_progress" if i < 15 else "to_plan")
        store.tasks[tid] = {
            "id": tid,
            "wedding_id": wedding_id,
            "event_id": None,
            "title": tpl["title"],
            "category": tpl["category"],
            "owner": "Pooja Verma" if i % 2 == 0 else "Rohan Joshi",
            "due_date": "2026-12-10",
            "priority": tpl["priority"],
            "status": status,
            "notes": "Standard Full-Service luxury protocol.",
            "is_overdue": False,
            "odoo_task_id": None,
            "created_at": now,
            "updated_at": now,
        }

    # 6. Quotes (Catering selected, Decor selected)
    store.quotes["q-caterer-winner"] = {
        "id": "q-caterer-winner",
        "wedding_id": wedding_id,
        "vendor_id": "v-royal-palace-caterers",
        "vendor_name": "Rajputana Royal Feast & Catering",
        "vendor_category": "Catering",
        "event_id": "evt-reception",
        "pricing_type": "per_plate",
        "unit_price": 4500.0,
        "estimated_quantity": 500,
        "normalized_total": 2250000.0,
        "scope_of_work": "7-course Royal Marwari feast, 12 live counters",
        "inclusions": ["Silver service cutlery", "Uniformed royal waitstaff"],
        "exclusions": [],
        "extra_hour_rate": 25000.0,
        "status": "selected",
        "odoo_purchase_order_id": None,
        "created_at": now,
        "updated_at": now,
    }
    store.quotes["q-decor-winner"] = {
        "id": "q-decor-winner",
        "wedding_id": wedding_id,
        "vendor_id": "v-palace-decor",
        "vendor_name": "Virasat Decor & Spatial Design",
        "vendor_category": "Decor",
        "event_id": "evt-pheras",
        "pricing_type": "fixed",
        "unit_price": 3500000.0,
        "estimated_quantity": 1,
        "normalized_total": 3500000.0,
        "scope_of_work": "Full floral mandap, ambient palace chandeliers",
        "inclusions": ["Setup", "Teardown", "Fresh Dutch flowers"],
        "exclusions": [],
        "extra_hour_rate": 0.0,
        "status": "selected",
        "odoo_purchase_order_id": None,
        "created_at": now,
        "updated_at": now,
    }

    # 7. Client Payments
    store.client_payments["pay-client-demo-1"] = {
        "id": "pay-client-demo-1",
        "wedding_id": wedding_id,
        "stage": "booking_deposit",
        "amount": 10000000.0,  # 1 Crore
        "payment_method": "Bank Transfer",
        "transaction_reference": "TXN-DEMO-BOOKING-01",
        "payment_date": "2026-11-01",
        "status": "received",
        "notes": "Booking confirmation deposit.",
        "odoo_payment_id": None,
        "created_at": now,
    }
    store.client_payments["pay-client-demo-2"] = {
        "id": "pay-client-demo-2",
        "wedding_id": wedding_id,
        "stage": "advance_payment",
        "amount": 15000000.0,  # 1.5 Crores
        "payment_method": "Bank Transfer",
        "transaction_reference": "TXN-DEMO-ADVANCE-02",
        "payment_date": "2026-11-20",
        "status": "received",
        "notes": "Pre-wedding advance payment.",
        "odoo_payment_id": None,
        "created_at": now,
    }

    # 8. Vendor Bills & Payments
    bill_id = "bill-demo-caterer-01"
    store.vendor_bills[bill_id] = {
        "id": bill_id,
        "wedding_id": wedding_id,
        "vendor_id": "v-royal-palace-caterers",
        "vendor_name": "Rajputana Royal Feast & Catering",
        "vendor_category": "Catering",
        "event_id": "evt-reception",
        "quote_id": "q-caterer-winner",
        "bill_number": "INV-CAT-2026-DEMO",
        "agreed_amount": 2250000.0,
        "billed_amount": 2475000.0,
        "variance": 225000.0,
        "variance_reason": "Client confirmed 50 extra banquet guests on event eve.",
        "total_paid": 2475000.0,
        "outstanding_balance": 0.0,
        "status": "paid",
        "payments": [],
        "bill_date": "2026-12-14",
        "due_date": "2026-12-25",
        "odoo_invoice_id": None,
        "created_at": now,
    }
    store.vendor_payments["vpay-demo-1"] = {
        "id": "vpay-demo-1",
        "bill_id": bill_id,
        "vendor_id": "v-royal-palace-caterers",
        "amount": 1000000.0,
        "payment_type": "advance",
        "payment_method": "Bank Transfer",
        "transaction_reference": "TXN-VEND-CAT-ADV",
        "payment_date": "2026-12-01",
        "odoo_payment_id": None,
        "created_at": now,
    }
    store.vendor_payments["vpay-demo-2"] = {
        "id": "vpay-demo-2",
        "bill_id": bill_id,
        "vendor_id": "v-royal-palace-caterers",
        "amount": 1475000.0,
        "payment_type": "final",
        "payment_method": "Bank Transfer",
        "transaction_reference": "TXN-VEND-CAT-FINAL",
        "payment_date": "2026-12-15",
        "odoo_payment_id": None,
        "created_at": now,
    }

    # 9. Operational Schedule & Arrival
    store.schedules["sch-demo-1"] = {
        "id": "sch-demo-1",
        "wedding_id": wedding_id,
        "event_id": "evt-pheras",
        "time_slot": "16:00",
        "title": "Baraat Procession Begins",
        "description": "Groom departs Hawa Mahal gate on vintage carriage with brass band.",
        "responsible_person": "Pooja Verma",
        "location": "North Palace Courtyard",
        "status": "completed",
        "created_at": now,
        "updated_at": now,
    }
    store.vendor_arrivals["arr-demo-1"] = {
        "id": "arr-demo-1",
        "wedding_id": wedding_id,
        "event_id": "evt-reception",
        "vendor_id": "v-royal-palace-caterers",
        "vendor_name": "Rajputana Royal Feast & Catering",
        "service_category": "Catering",
        "planned_arrival_time": "12:00",
        "actual_arrival_time": "12:10",
        "status": "arrived",
        "contact_phone": "+91 98290 11223",
        "delay_minutes": 10,
        "notes": "Truck arrived at service gate, prep kitchen active.",
    }

    # 10. Operational Issue
    store.operational_issues["iss-demo-1"] = {
        "id": "iss-demo-1",
        "wedding_id": wedding_id,
        "event_id": "evt-reception",
        "title": "Ballroom chandelier electrical surge — backup generator engaged",
        "severity": "medium",
        "owner": "Vikram Rathore",
        "status": "resolved",
        "action_taken": "Generator truck connected and load-tested. Normal voltage restored.",
        "created_at": now,
        "resolved_at": now,
    }

    return {"message": "Demo data successfully seeded for The Royal Knot", "wedding_id": wedding_id}

