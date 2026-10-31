# EverWed

A small, local-first wedding management application with three working roles:
Founder, Planner and Couple.

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | SQLite (`backend/data/everwed.sqlite3`) |

The application is intentionally basic. It does not include AI, chat, payment
gateways, analytics dashboards, external integrations, an inspiration board or
a "royal guest" module. Everything below is backed by the existing FastAPI API
and the existing SQLite database.

## What each role can do

### Founder (`admin`)

- Secure login and logout.
- Dashboard built from real database records.
- View every wedding and open its details.
- View enquiries.
- Manage accounts: create Planner and Couple accounts, deactivate and
  reactivate accounts.
- Approve or reject Planner registration requests.
- Assign a Planner to a wedding.
- Edit wedding records, including contact details, dates, budget, client
  package fee and lifecycle status.
- View events, tasks, guests, vendors and a financial summary.
- Manage basic vendor records.

### Planner

- Public Planner registration request; the account stays inactive until a
  Founder approves it.
- Secure login and logout.
- Dashboard listing only the weddings assigned to that Planner.
- View assigned couple and wedding details.
- Add, edit and delete events and update event details.
- View and update planning tasks.
- Add, edit and delete guest records and update RSVP status.
- View the vendor directory (read-only).
- No Wedding Builder access.

### Couple

- Public Couple registration.
- Secure login and logout.
- Couple dashboard.
- Wedding Builder (create and later edit a wedding).
- Wedding details, tradition, regional customs and functions.
- Guest list with RSVP status, search and filters.
- Planning checklist with persisted completion.
- Budget overview: planned budget, actual recorded expenses, payments and
  remaining balance.
- View the assigned Planner, or an explicit "No planner assigned" message.
- Wedding Builder is exclusive to Couples; it is absent from Founder and
  Planner navigation.

## Main workflows

- **Wedding Builder:** an eight-step sequence covering partner names, wedding
  date, tradition, optional regional customs, functions, city and venue,
  planned guest count and planned budget. Traditions and functions can be
  custom-written; no ceremony is forced.
- **Events:** add, edit and delete functions, including date, start/end time
  and venue. Deleting a function removes the preparation tasks it generated
  and keeps manual tasks.
- **Guests:** add, edit, delete, update RSVP, search and filter. The planned
  guest estimate is shown separately from actual guest records. Couples can
  bulk import a CSV file (name, email, phone, side, RSVP, plus ones, meal, table,
  VIP, notes). Duplicate guests and invalid rows are reported and skipped.
- **Checklist:** generated from the wedding and each function; Couples and
  Planners can add, edit, complete, reopen and delete tasks. Changes persist in
  SQLite across reloads and backend restarts.
- **Budget:** planned budget is editable by the Couple; recorded payments and
  supplier bills are shown separately. No transactions are invented.

## Quick start

Requirements: Python 3.10+ and Node.js 20+.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env        # Set a private SECRET_KEY (32+ random characters)
uvicorn app.main:app --reload --port 8000
```

The backend creates or opens `backend/data/everwed.sqlite3` automatically. It
does not reset or recreate an existing database. Demo seeding is disabled by
default (`SEED_DEMO_DATA_ON_STARTUP=false`).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The frontend talks to the FastAPI backend at
`VITE_API_BASE_URL` (default `http://localhost:8000`).

You can also run `start.bat` (Windows Command Prompt) or `start.ps1`
(PowerShell) after installing dependencies.

### First Founder

Choose the Founder portal at `/login/founder`. If the database has no accounts,
the portal shows a one-time Founder setup form. Later Founder accounts cannot
be created through the UI or public registration.

To provision a Founder from the command line without putting a password in
source:

```bash
cd backend
EVERWED_FOUNDER_EMAIL="you@example.com" \
EVERWED_FOUNDER_PASSWORD="a-strong-development-password" \
python scripts/provision_founder.py
```

The password must be at least 12 characters and is stored as a scrypt hash.
The script refuses to overwrite an existing account.

## Authentication and access

- Passwords are scrypt-hashed; sessions are signed, expiring and revocable.
- Browser sessions use an HttpOnly cookie. The frontend never stores tokens.
- The backend verifies roles and wedding ownership on every request.
- Couples can only reach the wedding linked to their own account.
- Planners can only reach weddings assigned to them.
- Only a Founder can approve Planner registrations or change account status.
- Public registration can only create Couple accounts; only the one-time setup
  creates a Founder.

## Testing

Backend tests use temporary SQLite databases and do not touch the configured
application database.

```bash
cd backend
python -m pytest -q -p no:cacheprovider
python -m compileall -q app
```

```bash
cd frontend
npx tsc -b
npm run lint
npm run build
```

Latest verified results are recorded in
[`docs/IMPLEMENTATION_PROGRESS.md`](docs/IMPLEMENTATION_PROGRESS.md).

## Known limitations

- Password reset and role changes are not implemented. A Founder can deactivate
  and reactivate accounts and create new ones.
- Planner workloads and analytics are intentionally not modelled.
- Vendor records are a basic address book; supplier quotes and invoices remain
  API-level records without dedicated screens.
- Browser screenshots and responsive visual checks are not automated in this
  repository; the checks above are automated tests and production build only.
- Odoo integration code remains present but is optional and not part of the
  simplified application.
