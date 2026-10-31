# Royal Knot OS

Unified wedding management platform for **The Royal Knot** — a luxury wedding planning agency.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + Vite |
| Backend | Python + FastAPI |
| Business Platform | Odoo (optional integration; configure credentials to enable) |
| Integration | FastAPI ↔ Odoo XML-RPC |

## Project Structure

The local fallback stores records and sessions in process memory. Data resets
when the backend restarts. Live Odoo synchronization depends on the target
instance, its installed models, and verified field mappings.

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
cp .env.example .env        # Edit with your Odoo details
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env        # Edit API URL
npm run dev
```

### Health Check
```
GET http://localhost:8000/api/v1/health
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

