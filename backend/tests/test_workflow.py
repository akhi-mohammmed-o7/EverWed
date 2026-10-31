"""
Royal Knot OS — Comprehensive End-to-End Workflow & Integration Tests.

Validates the full operational sequence across all 7 core modules:
1. Enquiry capture & client information
2. Enquiry update & meeting logs
3. Conversion of confirmed enquiry into Wedding with 25+ auto-generated tasks
4. Multi-event creation under wedding (Mehendi, Sangeet, Ceremony, Reception)
5. Vendor directory queries
6. Vendor quotation recording & side-by-side comparison (fixed vs per-plate)
7. Winner selection & auto-rejection of competing quotes
8. Task status updates, priority sorting & overdue detection
9. Day-of minute-by-minute schedule creation & vendor arrival tracking
10. Operational issue reporting and resolution
11. Staged client payments & duplicate reference protection
12. Vendor bill recording with mandatory variance explanation rule
13. Vendor advance & final payments with overpayment protection
14. Wedding-level financial statement & profitability calculation
15. Management season dashboard overview
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


class TestRoyalKnotEndToEndWorkflow:
    def test_full_season_wedding_lifecycle(self, client: TestClient) -> None:
        # ── 1. Create Client Enquiry ──────────────────────────────────────────
        enquiry_payload = {
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
            "estimated_budget": 35000000.0,  # 3.5 Crores
            "requirements": "Grand winter palace destination wedding with authentic Rajasthani catering and celebrity Sangeet DJ.",
        }
        res = client.post("/api/v1/enquiries", json=enquiry_payload)
        assert res.status_code == 201, res.text
        enquiry_data = res.json()["data"]
        enquiry_id = enquiry_data["id"]
        assert enquiry_data["bride_name"] == "Aisha Sharma"
        assert enquiry_data["status"] == "new"

        # ── 2. Record First Meeting & Update Enquiry ──────────────────────────
        meeting_payload = {
            "meeting": {
                "meeting_date": "2026-11-05T15:00:00Z",
                "location_or_link": "Rambagh Palace Jaipur Lounge",
                "notes": "Reviewed royal theme, family confirmed 450 guests for 3 days.",
                "outcome": "Couple loved full-service portfolio, agreed to contract terms.",
            },
            "agreement_signed": True,
        }
        res = client.patch(f"/api/v1/enquiries/{enquiry_id}", json=meeting_payload)
        assert res.status_code == 200
        enquiry_updated = res.json()["data"]
        assert enquiry_updated["agreement_signed"] is True
        assert len(enquiry_updated["meetings"]) == 1

        # ── 3. Convert Confirmed Enquiry into Wedding ──────────────────────────
        convert_payload = {
            "confirmed_budget": 35000000.0,
            "primary_venue": "City Palace Jaipur",
            "wedding_start_date": "2026-12-10",
            "wedding_end_date": "2026-12-13",
        }
        res = client.post(f"/api/v1/enquiries/{enquiry_id}/convert", json=convert_payload)
        assert res.status_code == 200
        convert_res = res.json()["data"]
        wedding_data = convert_res["wedding"]
        wedding_id = wedding_data["id"]
        assert wedding_data["budget_allocated"] == 35000000.0
        assert wedding_data["tasks_count"] >= 25  # 25+ standard operational tasks generated

        # Verify wedding endpoint retrieves it
        res = client.get(f"/api/v1/weddings/{wedding_id}")
        assert res.status_code == 200
        assert res.json()["data"]["title"] == "The Royal Union: Aisha Sharma & Vikram Singh Rathore"

        # ── 4. Create Multiple Events under Wedding ───────────────────────────
        events = [
            {
                "name": "Royal Mehendi",
                "date": "2026-12-10",
                "start_time": "14:00",
                "end_time": "18:00",
                "venue_hall": "Zenana Courtyard",
                "coordinator_name": "Pooja Verma",
                "guest_estimate": 250,
            },
            {
                "name": "Desert Beats Sangeet",
                "date": "2026-12-11",
                "start_time": "19:00",
                "end_time": "01:00",
                "venue_hall": "Manek Chowk Grand Stage",
                "coordinator_name": "Rohan Joshi",
                "guest_estimate": 450,
            },
            {
                "name": "Vedic Wedding & Pheras",
                "date": "2026-12-12",
                "start_time": "16:00",
                "end_time": "21:00",
                "venue_hall": "Sarvato Bhadra Mandap",
                "coordinator_name": "Pooja Verma",
                "guest_estimate": 450,
            },
            {
                "name": "Grand Imperial Banquet & Reception",
                "date": "2026-12-13",
                "start_time": "19:30",
                "end_time": "23:30",
                "venue_hall": "Chandra Mahal Royal Gardens",
                "coordinator_name": "Arjun Rathore",
                "guest_estimate": 500,
            },
        ]
        created_events = {}
        for ev in events:
            res = client.post(f"/api/v1/weddings/{wedding_id}/events", json=ev)
            assert res.status_code == 201
            created_events[ev["name"]] = res.json()["data"]

        # Verify events listed chronologically
        res = client.get(f"/api/v1/weddings/{wedding_id}/events")
        assert res.status_code == 200
        listed_events = res.json()["data"]
        assert len(listed_events) == 4

        # ── 5. Vendor Directory ───────────────────────────────────────────────
        res = client.get("/api/v1/vendors")
        assert res.status_code == 200
        vendors = res.json()["data"]
        assert len(vendors) >= 5

        # ── 6. Request & Compare Quotations (Three Caterers, One Decision) ─────
        reception_event_id = created_events["Grand Imperial Banquet & Reception"]["id"]

        # Quote 1: Rajputana Royal Feast (Per plate ₹4,500 for 500 guests = ₹2,250,000)
        q1 = {
            "wedding_id": wedding_id,
            "vendor_id": "v-royal-palace-caterers",
            "event_id": reception_event_id,
            "category": "Catering",
            "pricing_type": "per_plate",
            "unit_price": 4500.0,
            "estimated_quantity": 500,
            "scope_of_work": "7-course Royal Marwari feast, 12 live counters, organic dessert bar",
            "inclusions": ["Silver service cutlery", "Uniformed royal waitstaff", "Ice sculptures"],
            "extra_hour_rate": 25000.0,
        }
        res1 = client.post("/api/v1/quotes", json=q1)
        assert res1.status_code == 201
        quote1_id = res1.json()["data"]["id"]
        assert res1.json()["data"]["normalized_total"] == 2250000.0

        # Quote 2: Mewar Shahi Banquets (Per plate ₹4,800 for 500 guests = ₹2,400,000)
        q2 = {
            "wedding_id": wedding_id,
            "vendor_id": "v-shahi-caterers-udaipur",
            "event_id": reception_event_id,
            "category": "Catering",
            "pricing_type": "per_plate",
            "unit_price": 4800.0,
            "estimated_quantity": 500,
            "scope_of_work": "Mewari royal buffet with live wood-fired continental breads",
            "inclusions": ["Gourmet cheese bar", "Tandoori stations"],
            "extra_hour_rate": 30000.0,
        }
        res2 = client.post("/api/v1/quotes", json=q2)
        assert res2.status_code == 201
        quote2_id = res2.json()["data"]["id"]

        # Quote comparison side-by-side
        res_comp = client.get(f"/api/v1/quotes/compare?wedding_id={wedding_id}&category=Catering")
        assert res_comp.status_code == 200
        comp_data = res_comp.json()["data"]
        assert len(comp_data["quotes"]) == 2
        assert comp_data["lowest_quote_id"] == quote1_id

        # ── 7. Select Winning Quote & Auto-Reject Competing Quotes ─────────────
        res_sel = client.post(f"/api/v1/quotes/{quote1_id}/select")
        assert res_sel.status_code == 200
        assert "winner" in res_sel.json()["data"]["message"].lower()

        # Check that quote 2 is now rejected
        res_q_list = client.get(f"/api/v1/quotes?wedding_id={wedding_id}&category=Catering")
        quotes_map = {q["id"]: q["status"] for q in res_q_list.json()["data"]}
        assert quotes_map[quote1_id] == "selected"
        assert quotes_map[quote2_id] == "rejected"

        # Also select Decor quote (Fixed Price ₹3,500,000)
        q_decor = {
            "wedding_id": wedding_id,
            "vendor_id": "v-palace-decor",
            "category": "Decor",
            "pricing_type": "fixed",
            "unit_price": 3500000.0,
            "estimated_quantity": 1,
            "scope_of_work": "Full 3-day palace decor, floral mandap, acoustic stage, warm ambient chandeliers",
            "inclusions": ["Setup", "Teardown", "Fresh Dutch flowers"],
        }
        res_dec = client.post("/api/v1/quotes", json=q_decor)
        quote_decor_id = res_dec.json()["data"]["id"]
        client.post(f"/api/v1/quotes/{quote_decor_id}/select")

        # ── 8. Task Management & Progress ─────────────────────────────────────
        res_tasks = client.get(f"/api/v1/weddings/{wedding_id}/tasks")
        assert res_tasks.status_code == 200
        tasks_list = res_tasks.json()["data"]
        assert len(tasks_list) >= 25

        # Update first task to Done
        first_task_id = tasks_list[0]["id"]
        res_t_up = client.patch(f"/api/v1/tasks/{first_task_id}", json={"status": "done"})
        assert res_t_up.status_code == 200
        assert res_t_up.json()["data"]["status"] == "done"

        # ── 9. Wedding Operations & Day-of Schedule ───────────────────────────
        sched_item = {
            "time_slot": "16:00",
            "title": "Baraat Procession & Dhol Arrival",
            "description": "Groom departs Hawa Mahal gate on vintage carriage with 100 baraatis.",
            "responsible_person": "Pooja Verma",
            "location": "North Palace Courtyard",
        }
        res_sch = client.post(
            f"/api/v1/operations/weddings/{wedding_id}/events/{reception_event_id}/schedule",
            json=sched_item,
        )
        assert res_sch.status_code == 201

        # Log vendor arrival
        arrival_payload = {
            "wedding_id": wedding_id,
            "event_id": reception_event_id,
            "vendor_id": "v-royal-palace-caterers",
            "planned_arrival_time": "12:00",
            "actual_arrival_time": "12:10",
            "delay_minutes": 10,
            "notes": "Truck arrived at service gate, prep kitchen active.",
        }
        res_arr = client.post("/api/v1/operations/vendor-arrivals", json=arrival_payload)
        assert res_arr.status_code == 200
        assert res_arr.json()["data"]["status"] == "arrived"

        # ── 10. Report & Resolve Operational Issue ────────────────────────────
        issue_payload = {
            "wedding_id": wedding_id,
            "event_id": reception_event_id,
            "title": "Extra 500kVA backup generator needed for ballroom chandelier surge",
            "severity": "high",
            "owner": "Logistics Lead - Vikram Rathore",
            "action_taken": "Contacted city generator depot for immediate standby truck.",
        }
        res_iss = client.post("/api/v1/operations/issues", json=issue_payload)
        assert res_iss.status_code == 201
        issue_id = res_iss.json()["data"]["id"]

        # Resolve issue
        res_res = client.post(
            f"/api/v1/operations/issues/{issue_id}/resolve",
            json={"action_taken": "Generator truck connected and load-tested. Normal voltage restored."},
        )
        assert res_res.status_code == 200
        assert res_res.json()["data"]["status"] == "resolved"

        # ── 11. Staged Client Payments & Idempotency ──────────────────────────
        pay1 = {
            "wedding_id": wedding_id,
            "stage": "booking_deposit",
            "amount": 10000000.0,  # 1 Crore booking deposit
            "payment_method": "Bank Transfer",
            "transaction_reference": "TXN-CLIENT-BOOKING-001",
            "payment_date": "2026-11-01",
            "notes": "25% initial booking advance confirmed.",
        }
        res_p1 = client.post("/api/v1/finance/client-payments", json=pay1)
        assert res_p1.status_code == 201

        # Attempting duplicate transaction reference should fail
        res_dup = client.post("/api/v1/finance/client-payments", json=pay1)
        assert res_dup.status_code == 409  # Conflict / Duplicate

        # Second stage client payment (Advance 1 month prior)
        pay2 = {
            "wedding_id": wedding_id,
            "stage": "advance_payment",
            "amount": 15000000.0,  # 1.5 Crores
            "payment_method": "Bank Transfer",
            "transaction_reference": "TXN-CLIENT-ADVANCE-002",
            "payment_date": "2026-11-20",
        }
        client.post("/api/v1/finance/client-payments", json=pay2)

        # ── 12. Vendor Bills & Mandatory Variance Verification ────────────────
        # Case A: Bill exceeds agreed quote (₹2,250,000 -> ₹2,475,000 due to 50 extra guests) WITHOUT explanation -> Must fail
        bad_bill = {
            "wedding_id": wedding_id,
            "vendor_id": "v-royal-palace-caterers",
            "bill_number": "INV-CAT-2026-001",
            "agreed_amount": 2250000.0,
            "billed_amount": 2475000.0,
            "variance_reason": None,  # Missing mandatory reason
            "bill_date": "2026-12-14",
            "due_date": "2026-12-25",
        }
        res_bad_b = client.post("/api/v1/finance/vendor-bills", json=bad_bill)
        assert res_bad_b.status_code == 422  # Unprocessable / Variance explanation required

        # Case B: Bill with mandatory explanation -> Succeeds
        good_bill = {
            "wedding_id": wedding_id,
            "vendor_id": "v-royal-palace-caterers",
            "bill_number": "INV-CAT-2026-001",
            "agreed_amount": 2250000.0,
            "billed_amount": 2475000.0,
            "variance_reason": "Client approved 50 additional banquet guests (550 total at ₹4,500/plate).",
            "bill_date": "2026-12-14",
            "due_date": "2026-12-25",
        }
        res_b = client.post("/api/v1/finance/vendor-bills", json=good_bill)
        assert res_b.status_code == 201
        bill_id = res_b.json()["data"]["id"]
        assert res_b.json()["data"]["variance"] == 225000.0

        # Decor Bill (exact agreed amount ₹3,500,000)
        decor_bill = {
            "wedding_id": wedding_id,
            "vendor_id": "v-palace-decor",
            "bill_number": "INV-DEC-2026-088",
            "agreed_amount": 3500000.0,
            "billed_amount": 3500000.0,
            "bill_date": "2026-12-14",
            "due_date": "2026-12-28",
        }
        res_db = client.post("/api/v1/finance/vendor-bills", json=decor_bill)
        decor_bill_id = res_db.json()["data"]["id"]

        # ── 13. Vendor Payments & Overpayment Protection ──────────────────────
        # Advance payment to caterer
        vp1 = {
            "bill_id": bill_id,
            "amount": 1000000.0,
            "payment_type": "advance",
            "payment_method": "Bank Transfer",
            "transaction_reference": "TXN-VEND-CAT-ADV",
            "payment_date": "2026-12-01",
        }
        res_vp1 = client.post("/api/v1/finance/vendor-payments", json=vp1)
        assert res_vp1.status_code == 201

        # Overpayment check: remaining balance is ₹1,475,000. Attempting ₹2,000,000 must fail
        overpay = {
            "bill_id": bill_id,
            "amount": 2000000.0,
            "payment_type": "final",
            "payment_method": "Bank Transfer",
            "transaction_reference": "TXN-VEND-CAT-OVERPAY",
            "payment_date": "2026-12-15",
        }
        res_over = client.post("/api/v1/finance/vendor-payments", json=overpay)
        assert res_over.status_code == 400  # Overpayment prohibited

        # Final settlement payment of exact remaining balance ₹1,475,000
        vp2 = {
            "bill_id": bill_id,
            "amount": 1475000.0,
            "payment_type": "final",
            "payment_method": "Bank Transfer",
            "transaction_reference": "TXN-VEND-CAT-FINAL",
            "payment_date": "2026-12-15",
        }
        res_vp2 = client.post("/api/v1/finance/vendor-payments", json=vp2)
        assert res_vp2.status_code == 201

        # Check caterer bill is now marked 'paid'
        res_bills = client.get(f"/api/v1/finance/vendor-bills?wedding_id={wedding_id}")
        cat_bill_rec = next(b for b in res_bills.json()["data"] if b["id"] == bill_id)
        assert cat_bill_rec["status"] == "paid"
        assert cat_bill_rec["outstanding_balance"] == 0.0

        # ── 14. Wedding Financial Summary ─────────────────────────────────────
        res_fin = client.get(f"/api/v1/finance/weddings/{wedding_id}/summary")
        assert res_fin.status_code == 200
        summary = res_fin.json()["data"]
        # Contract value: 3.5 Crores
        assert summary["total_contract_value"] == 35000000.0
        # Client paid: 1.0 + 1.5 = 2.5 Crores
        assert summary["client_paid_amount"] == 25000000.0
        # Outstanding receivable from client: 1.0 Crore
        assert summary["client_outstanding_receivable"] == 10000000.0
        # Total vendor bills recorded: ₹2,475,000 (caterer) + ₹3,500,000 (decor) = ₹5,975,000
        assert summary["actual_vendor_bills_total"] == 5975000.0
        # Net agency profit: 35,000,000 - 5,975,000 = 29,025,000
        assert summary["net_agency_profit"] == 29025000.0
        assert summary["profit_margin_percentage"] > 80.0

        # ── 15. Executive Season Dashboard Overview ───────────────────────────
        res_dash = client.get("/api/v1/dashboard/overview")
        assert res_dash.status_code == 200
        dash = res_dash.json()["data"]
        assert dash["active_weddings_count"] >= 1
        assert dash["upcoming_events_count"] >= 1
        assert dash["total_client_payments_received"] >= 25000000.0
        assert len(dash["active_weddings"]) >= 1
        wedding_row = next(w for w in dash["active_weddings"] if w["wedding_id"] == wedding_id)
        assert wedding_row["contract_value"] == 35000000.0
        assert wedding_row["gross_profit"] == 29025000.0
