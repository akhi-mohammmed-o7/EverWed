# EverWed implementation progress

Updated: 2026-10-31

## Current state

- Synced the checkout to `origin/master` at `8cb194f` (fast-forward from `69220c2`).
- The app supports a demo frontend adapter and a FastAPI backend with wedding, enquiry, vendor, quote, task, operations, and finance workflows.
- The backend has an Odoo XML-RPC client and selected create/sync hooks. Local in-memory storage remains the fallback and is reset on process restart.
- Odoo credentials and an Odoo instance were not available here. Odoo connectivity and model compatibility have not been verified; mappings are documented as proposed in `backend/app/integrations/odoo/mappings.py`.

## Changes in this session

- Fixed strict TypeScript nullability in the Emerald Silk shader render callback.
- Made `DEBUG=release`, `DEBUG=production`, and `DEBUG=prod` valid false values so deployment labels do not prevent API startup.
- Made Odoo opt-in by default instead of treating placeholder `admin/admin` settings as a configured integration.
- Corrected frontend environment examples and README: the API base URL is the server origin, while API paths already include `/api/v1`.
- Installed the declared frontend and backend dependencies in the execution environment.

## Verification

- `frontend`: `npm run build` passed. Vite reports the main bundle at about 846 kB minified (238 kB gzip); route-level code splitting remains a performance improvement to consider.
- `frontend`: `npm run lint -- --quiet` passed.
- `backend`: `python -m pytest -q -p no:cacheprovider` passed: 15 tests.
- Local smoke checks returned API health `healthy`/HTTP 200 and frontend HTTP 200 with the React root present.
- A browser UI check was attempted but stopped by the computer-use safety layer because it could not verify the active browser URL. No user workflow was changed in the browser.
- One upstream Starlette/AnyIO deprecation warning remains during backend tests.
- The dev server also emitted a PostCSS warning that a plugin omitted the `from` option.

## Remaining work

1. Configure Odoo URL, database, user, and password, then validate the proposed field mappings and run live integration tests against the target Odoo version.
2. Replace process-local session and business-record storage with durable, multi-worker-safe persistence before deployment.
3. Review authentication roles and secret management for the deployment environment; current role inference and sessions are MVP-level.
4. Consider route-level lazy loading to reduce initial JavaScript download size.

## Decisions

- The demo/offline experience remains available when Odoo is not configured.
- Odoo is not described as verified or authoritative in the running setup until credentials, models, and live synchronization are validated.
- No persistent user data was available in the checkout to migrate.
