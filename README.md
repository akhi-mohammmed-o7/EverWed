# EverWed

Local-first wedding planning and management platform.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + Vite |
| Backend | Python + FastAPI |
| Database | SQLite (persistent local-first storage) |
| ERP Integration | Optional Odoo XML-RPC hooks for supported workflows |

## Project Structure

The project requirements document confirms FastAPI and SQLite for the hackathon
build and requires the demo to run locally without internet. MongoDB Atlas is
not used by this approved architecture. Odoo remains an optional integration;
live synchronization depends on the target instance and verified field
mappings.

```
EverWed/
├── backend/          # FastAPI application
│   ├── app/          # Application code
│   │   ├── api/      # Route handlers
│   │   ├── core/     # Config, security, exceptions
│   │   ├── integrations/  # Odoo client & mappings
│   │   ├── schemas/  # Pydantic models
│   │   └── services/ # Business logic
│   └── tests/        # Backend tests
├── frontend/         # React + Vite application
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── lib/
│       └── types/
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env        # Set a private SECRET_KEY before using accounts
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env        # Uses the persistent FastAPI backend
npm run dev
```

### Health Check
```
GET http://localhost:8000/health
```

## First launch

The backend creates the local SQLite database automatically. Open `/login` in the
frontend to choose the Founder, Planner, or Couple portal. If the database has
no accounts, first-time Founder provisioning is available only in the Founder
portal. Couples can register at `/register/couple`; the server assigns the
Couple role and directs new accounts to wedding setup. Founder accounts can
provision planner and couple accounts and assign weddings. Sample records are not seeded on
startup by default. Set `SEED_DEMO_DATA_ON_STARTUP=true` only in a disposable
demo database if you want the fictional sample records.

The frontend uses the FastAPI backend by default. Set `VITE_USE_REAL_API=false`
only for an isolated, in-memory UI preview; the login page and navigation label
that mode as a non-persistent demo. Set a private random `SECRET_KEY` in
`backend/.env` before creating accounts. Browser sessions use an HttpOnly cookie.

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

For the active SQLite file, safe backup, and DB Browser instructions, see
[`docs/DATABASE_GUIDE.md`](docs/DATABASE_GUIDE.md). Browser authentication and
portal acceptance steps are in [`docs/MANUAL_AUTH_TESTING.md`](docs/MANUAL_AUTH_TESTING.md).

