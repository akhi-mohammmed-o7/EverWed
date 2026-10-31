# EverWed (ShaadiOS) — Master Frontend Application

> **Luxury Wedding Planning & Operations Management Platform**
> Built for high-stakes Indian & multicultural destination weddings.

---

## 🌟 Executive Overview

EverWed (ShaadiOS) is a modern luxury wedding technology platform bridging two interconnected operational workflows:
1. **Couple Experience Portal**: High-touch, editorial guest and itinerary management for the bride, groom, and family.
2. **Planner Operations Command Center**: High-density operational cockpit for wedding management agencies, logistics leads, and financial directors.

Built with **React 19, TypeScript (strict mode), Vite, Tailwind CSS, TanStack Query, Lucide Icons, and date-fns**.

---

## 🎨 Visual Design Language & Aesthetics

- **Forest Green (`#173B32`)**: Primary brand anchor representing heritage, opulence, and royal palaces.
- **Champagne Gold (`#D7B875`)**: Refined metallic accents, badges, and primary action triggers.
- **Warm Ivory (`#F7F3EC`)**: Editorial canvas background inspired by bespoke wedding stationery.
- **Terracotta (`#B85C52`)**: Warning indicators, overdue tasks, and operational risk highlights.
- **Typography**: Clean modern sans-serif typography paired with editorial serif display accents.

---

## 🚀 Key Modules & Capabilities

### 1. Wedding Setup Wizard (`/builder`)
- **Traditions**: Hindu, Muslim, Sikh, Christian, Fusion / Custom with cultural ceremony templates.
- **Ceremonies & Events**: Re-orderable, editable events with date pickers, venue hall assignments, guest count, and an **"Add Custom Event"** modal.
- **Curated Packages**: Essential, Signature, and Royal Bespoke tiers with inclusion breakdowns.
- **Add-on Services**: 11 luxury categories (Palace Venues, Royal Catering, Florals, Cinematography, Styling, Entertainment, Stationery, Chauffeur Fleet, Hospitality, Vedic Priests, Production).
- **Persistent Live Cost Summary**: Real-time calculations with per-plate catering math multiplied by guest headcount, service totals, and budget headroom.
- **Review & Instant Deployment**: One-click transition to Couple Portal or Planner Workspace.

### 2. Planner Operations Command Center (`/planner`)
- **Executive Overview (`/planner/overview`)**: Total pipeline value, client receivables, vendor payables, wedding margin table, and critical action alerts.
- **Enquiries CRM (`/planner/enquiries`)**: Full pipeline with status filters, consultation scheduler, meeting notes, and **"Convert to Wedding"** modal with automatic generation of 25+ milestone tasks.
- **Active Weddings (`/planner/weddings`, `/planner/weddings/:id`)**: Multi-tab dossier covering Overview, Ceremonies, Task Checklist, Vendor Quotes, and Financial Ledger.
- **Vendor Directory (`/planner/vendors`)**: Verified vendor catalog with ratings, price tiers, categories, and direct quote requests.
- **Quote Comparison Engine (`/planner/quotes`)**: Side-by-side bid comparison with normalized per-head rates, trade-off breakdowns, and **"Select As Winner"** single-click action.
- **Operational Task Checklist (`/planner/tasks`)**: Categorized milestones (Legal, Catering, Decor, Logistics) with overdue alerts and inline status updates.
- **Event Command Center (`/planner/operations`)**: Minute-by-minute execution timeline, vendor arrival gate status with delay flags, and **Incident Log** with modal resolution documentation.
- **Finance & Accounting (`/planner/finance`)**: Inflow/outflow tracking, client payment recording, vendor bill verification enforcing **mandatory variance explanations**, and payment disbursement with **overpayment prevention**.
- **Real-Time Risk Radar (`/planner/risk-radar`)**: Automated risk detection engine scoring delay severity, overdue deliverables, and vendor procurement margins.

### 3. Couple Portal (`/couple`)
- **Dashboard (`/couple/dashboard`)**: Live countdown timer, planning progress gauge, upcoming ceremony card, and pending decision approvals.
- **Wedding Story & Overview (`/couple/overview`)**: Venue dossier, budget progress, and dedicated entourage contact list.
- **Ceremony Itinerary (`/couple/events`)**: Complete multi-day schedule with guest attire guidelines, venue locations, and coordinator contacts.
- **Guest List & RSVP (`/couple/guests`)**: Guest roster with Bride/Groom side filters, attendance tracking, dietary requirements, table allocation, and **"Add Royal Guest"** modal.
- **Checklist (`/couple/checklist`)**: Couple milestone checklist with progress indicator.
- **Budget & Milestones (`/couple/budget`)**: Invoiced milestone tracking, payment vouchers, and remaining balances.
- **Curated Vendors (`/couple/vendors`)**: Verified partner network across catering, photography, and styling.
- **Inspiration Moodboard (`/couple/moodboard`)**: Color palettes, floral moodboards, and royal palace concepts.

---

## 🔑 1-Click Role Switcher & Demo Authentication

The top navigation bar features an instant **Role Switcher** allowing judges and reviewers to switch between personas seamlessly:
- **Planner**: Full access to all operations, CRM, financials, and vendor negotiations.
- **Couple**: Refined, welcoming couple portal with RSVP management and countdowns.
- **Founder / Admin**: Executive privileges.

### Demo Credentials (Pre-filled on `/login`):
- **Planner**: `priya@everwed.luxury` / `planner123`
- **Couple**: `aisha.vikram@gmail.com` / `couple123`
- **1-Click Buttons**: Instant login without typing credentials.

---

## 🔌 Dual Adapter Architecture (Mock & Real Backend)

The frontend implements a clean repository/adapter pattern:
- **`MockAdapter` (Default)**: Fully interactive, stateful, in-memory repository pre-loaded with realistic Royal Knot data (Aisha & Vikram's Udaipur Palace wedding). All mutations (creating enquiries, adding events, logging payments, resolving incidents) update live state across the session.
- **`RealApiAdapter`**: Connects directly to the FastAPI backend at `/api/v1` via standard REST calls (`/enquiries`, `/weddings`, `/vendors`, `/quotes`, `/tasks`, `/finance`, etc.).

### Toggling Between Mock and Real Backend:
Create or edit `.env` in `frontend/`:
```env
# Set to 'true' to point to running FastAPI backend on http://localhost:8000
VITE_USE_REAL_API=false

# Backend API base URL
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🛠️ Development & Build Commands

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (already completed)
npm install

# Start local development server
npm run dev

# Run TypeScript strict type-check & production build
npm run build

# Preview production build locally
npm run preview
```
