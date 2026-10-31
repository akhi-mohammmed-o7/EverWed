# EverWed implementation progress

Updated: 2026-11-01 (Planner approvals and Couple onboarding repair)

## Current phase

Persistent backend and secure local authentication are implemented. Booking
deposit confirmation now triggers the initial plan exactly once, and financial
amounts use integer paise in storage and calculations. The current build remains
a foundation, not the complete wedding lifecycle requested in the master prompt.

## Architecture decision

- The project requirements document `finaldocclaude.docx` confirms React,
  TypeScript, Tailwind, FastAPI, SQLite and local/offline operation.
- MongoDB Atlas was not adopted because the explicit project architecture and
  hackathon requirements take precedence. No MongoDB credentials were read or
  used. See `docs/ARCHITECTURE_DECISION.md`.
- Odoo remains optional. There is no verified target instance or field mapping;
  no live sync is claimed.
- Rechecked the final-for-build requirements after the user reported Atlas was
  set up. The user confirmed SQLite remains primary for hackathon compliance.
  Atlas was not integrated; reported connectivity was not repeated and no
  configured values were read or exposed.

## Completed

### Persistence and reliability

- Replaced process-local business dictionaries with SQLite-backed collections
  for enquiries, weddings, events, vendors, quotes, tasks, schedules, vendor
  arrivals, operational issues, client payments, vendor bills and vendor
  payments. Users and revocable sessions are persisted too.
- Added indexed relation/status columns and foreign keys, WAL, foreign-key
  enforcement, a configurable busy timeout, startup/health pings and shutdown
  cleanup. Database failures do not silently switch to memory.
- Added transactions around wedding/task creation, enquiry conversion, event
  counters, quote selection, vendor payment handling and idempotent demo seeds.
- Removed automatic insertion of synthetic vendor accounts and bank details.
- Persist all INR fields as integer paise in SQLite JSON payloads while restoring
  the established rupee-valued API shapes on reads. Added schema version 2
  migration from legacy rupee payloads.
- Use integer-paise arithmetic for payment overage, invoice variance, summaries
  and season receivables/payables. Budget and client package fee are separate;
  only an explicitly recorded package fee contributes to contracted revenue.
- Added package-fee entry during enquiry conversion and wedding setup.
- Wedding creation and enquiry conversion now leave the plan ungenerated.
  Recording the booking deposit confirms the wedding and creates the 29-task
  baseline in the same SQLite transaction; duplicate deposit references cannot
  generate another plan. Task due dates are relative to the wedding date.
- Replaced the fixed-size, Hindu-specific luxury wedding defaults with an
  inclusive planning baseline. Ceremony-specific tasks are phrased around
  preferences selected by the couple; guest counts and premium suppliers are
  no longer hard-coded into templates.

### Authentication and access control

- Added scrypt password hashes, signed expiring bearer sessions, session
  revocation and one-time first-Founder setup.
- Added user creation/listing and server-side role checks across business APIs.
- Enforced couple ownership and planner/team wedding assignment for wedding,
  event, task, schedule, quote, issue, operation and finance routes.
- Fixed login/setup API responses to use the same `{success, data}` envelope as
  the shared frontend API client.
- Added a real-backend first-Founder form and removed default demo credentials
  from the login inputs. Demo role switches are only visible in demo mode.
- Browser login/setup use revocable HttpOnly SameSite cookies; credentials are
  not returned in JSON or stored in localStorage. Cookie-authenticated writes
  reject an Origin outside configured CORS origins. Bearer authentication is
  retained for explicit API clients and test clients.
- Removed the builder's fabricated couple session. The builder now requires an
  authenticated admin/planner, reports failed API writes, and resumes partial
  event creation without creating duplicates.
- Added an admin-only planner assignment endpoint backed by a foreign key to an
  active planner user. Planner dashboard aggregates are limited to assigned
  weddings; client payments enforce wedding access.
- Removed planner/couple demo role switching from real mode and label the
  optional mock adapter as nonpersistent preview functionality.

### Guests and startup behavior

- Added a persistent SQLite guests table and scoped list/create/update/delete
  endpoints. Wired the couple guest screen to the real adapter and reject
  cross-wedding access.
- Startup demo seeding is disabled by default. Fictional sample records are
  inserted only when explicitly enabled in local configuration or requested by
  the protected admin seed endpoint.
- The real API adapter is selected by default; mock preview requires the
  explicit `VITE_USE_REAL_API=false` setting.
- Added a Founder-only Team & Access screen to provision/list accounts and
  assign an existing planner to a wedding through the protected API. This does
  not yet provide credential reset or role changes. Founder can deactivate or
  reactivate other accounts; deactivation revokes their existing sessions and
  the current Founder cannot deactivate their own account.

### Role portals and couple onboarding

- Replaced the shared role-agnostic login form with a portal selector and
  separate Founder, Planner and Couple login pages. Portal choice never sets a
  role: the UI checks the authenticated backend role and revokes the session if
  it does not match the selected portal.
- Kept first-Founder provisioning on the Founder portal only. Existing accounts
  and the existing Founder are preserved.
- Added public Couple registration with partner names, unique email, phone,
  strong password, confirmation and required account/data-storage acceptance.
  Extra request fields are rejected, the server assigns `couple`, stores a
  password hash and creates an HttpOnly session. Duplicate email returns 409.
- Added authenticated wedding onboarding for unassigned couple accounts. It
  creates a workspace only from submitted details and atomically links it to
  the account; couples cannot create a second workspace or access another
  couple's wedding.
- Added a separate Planner home dashboard sourced from the server-filtered
  assigned wedding list, tasks and events. Founder remains on company overview.
- Couple home/layout/overview resolve the wedding from the authenticated
  profile and no longer fall back to the first listed wedding.

### Database inspection

- Read-only inspection confirmed the effective backend path is
  `backend/data/everwed.sqlite3`, matching the requested existing database. It
  has schema version 4, 15 tables, 54 explicit indexes, a passing integrity
  check and zero foreign-key-check errors. Its current user-role aggregate is
  one admin. Table counts were checked without printing private record fields;
  existing data was not modified.
- Added `docs/DATABASE_GUIDE.md` with table descriptions, DB Browser steps,
  integrity checks and WAL-safe backup instructions.

### Existing business workflows

- Persistent CRUD remains available for enquiries, weddings, events, vendors,
  quotes, tasks, schedule, operations and finance.
- Quote winner selection is transactional and only selects one quote.
- Enquiry conversion requires a signed agreement, explicit wedding dates and a
  primary venue; task due dates use each template's configured date offset.
- Dashboard totals are sourced from persisted records; removed silent exception
  swallowing from wedding financial summaries.
- Updated first-run documentation, EverWed branding in touched screens, and the
  frontend example environment to use the real API.

## Historical verification (superseded by latest results below)

- Backend: `python -m pytest -q -p no:cacheprovider` — 28 passed, 1 upstream
  Starlette/AnyIO deprecation warning. `python -m compileall -q app` passed.
- `git diff --check` passed (Git printed existing working-copy line-ending
  notices for several files).
- Frontend: `npx tsc -b` and `npm run lint -- --quiet` passed.
- Frontend production build: `npm run build` passed after retrying outside the
  sandbox due to Windows `spawn EPERM`. Vite warns that the generated JS chunk is
  853.66 kB (gzip 240.10 kB).
- SQLite restart, relation, rollback, unique payment-reference and idempotent
  seed coverage exists. New tests verify integer-paise storage/read round trips,
  schema-v1 money migration, every paise payload mapping, and budget-vs-package-fee accounting. Auth tests
  cover password hashing, one-time setup, revocation, expiry, couple ownership
  and unassigned planner denial. Enquiry tests verify agreement/setup gates.

### Latest portal/registration repair verification (2026-11-01)

- Backend: `python -m pytest -q -p no:cacheprovider` — **35 passed**, one
  upstream Starlette/AnyIO deprecation warning. `python -m compileall -q app`
  passed.
- Frontend: `npx tsc -b` and `npm run lint -- --quiet` passed.
- Production frontend after role-specific navigation, portals, couple
  registration/onboarding and Planner home: `npm run build` passed; Vite emitted
  the oversized JavaScript chunk warning (862.77 kB minified, 241.98 kB gzip).
- `git diff --check` passed; Git displayed only working-copy line-ending
  notices.
- Isolated HTTP smoke: first Founder setup was available on an empty temporary
  database; setup returned no token in JSON and set an HttpOnly cookie;
  `/auth/me` restored the Founder and logout revoked the session. The smoke
  server/database were isolated from the configured application database.
- Browser/responsive checks were not completed. The Windows computer-use host
  stopped the session because it could not reliably identify the active URL;
  no UI/browser result is claimed.
- Earlier generated pytest databases were inspected and removed. In the latest
  isolated HTTP smoke check, both temporary servers were stopped and ports
  8765/5179 are no longer listening. Cleanup of the smoke SQLite file and logs
  under the system temp directory stalled in the Windows sandbox; those files
  may remain and are separate from the configured application database. The
  project `.env` file was not read or modified.

### Planner approval and Couple onboarding repair (2026-11-01)

- Added public Planner applications with normalized email/phone validation and
  strong password validation. Applications are stored as inactive users with
  `approval_status=pending`; login cannot proceed until Founder approval.
- Added Founder-only approve/reject API and Team & Access review controls.
  Pending accounts cannot be activated through the ordinary status endpoint.
  Rejection deactivates the account and revokes its sessions.
- Direct Founder-created Planner accounts remain active and approved. Planner
  assignment lists only active, non-pending accounts.
- Couple onboarding saves ceremony tradition, regional/family customizations
  and selected functions into SQLite wedding/event records in one transaction.
  Function dates must fit the wedding dates. The couple account is the recorded
  coordinator until a Planner is assigned. Couples may also add functions from
  their event page; the API enforces ownership, wedding date range and server-
  assigned coordinator identity.
- Removed unrelated seeded-wedding fallbacks from Couple event, checklist and
  vendor pages; they resolve the wedding from the authenticated Couple profile.
  Replaced hard-coded Couple team members with the actual assigned Planner,
  removed Hindu-specific countdown and "Royal Guest" labels, removed the
  Inspiration Board navigation entry, and separate planned guest estimates
  from actual guest records and RSVP counts.
- Automated tests cover pending Planner login/approval, Couple event ownership
  denial, server-controlled coordinator, and persistence of Couple tradition,
  regional notes and scheduled functions across a new SQLite Store instance.
  Tests use temporary SQLite databases.
- Verification: `python -m pytest -q -p no:cacheprovider` — **37 passed**, one
  upstream Starlette/AnyIO deprecation warning; `npx tsc -b` passed;
  `npm run lint -- --quiet` passed (Oxlint). `npm run build` passed after
  sandbox escalation for Vite's Windows subprocess (`spawn EPERM` in sandbox);
  final generated JS chunk is 868.55 kB (242.68 kB gzip).
- Opened the configured application database in the FastAPI lifespan without
  writing business rows; `/api/v1/health` returned HTTP 200 with SQLite
  connected and demo seeding disabled. The configured file is
  `backend/data/everwed.sqlite3`.
- The configured database contains one active Founder. The requested
  `admin@gmail.com` identity is not present, so no account or password was
  overwritten and no default credential was inserted into source, logs, or
  the existing database. Continue using the existing Founder account or use
  the one-time setup only with an empty database.
- Browser clicks and responsive widths remain unverified; the Windows
  computer-use host could not reliably identify its active URL in the prior
  session. No browser test is claimed.

## Remaining work (master prompt)

1. Add credential reset and role lifecycle audit; expand role-specific
   financial access tests, including vendor payment bill scope. Account
   activation/deactivation, Team & Access UI and planner assignment are
   implemented.
2. Add a local startup/restart verification on the configured user database to
   confirm the version-1 to version-2 money migration preserves existing data.
3. Add explicit, traceable consultation and agreement CRUD/signing states.
4. Add RFQ groups and quote line items, deliverables, availability, terms,
   additional costs and acceptance/rejection audit history.
5. Finish guided wedding setup and persist ceremony, regional, accommodation,
   transport, venue-per-event and custom destination data. Tradition, regional
   notes and selected initial functions now persist; editing these preferences
   after setup remains open.
6. Generate additional tasks from selected ceremony/event functions without
   duplicating or removing manually created tasks; add milestones and task
   assignment UI. The inclusive baseline plan is implemented.
7. Implement extras, settlement closure and verified financial summaries.
8. Add founder metrics for enquiries, pipeline, planner workload and issue
   triage, with filters and drill-down. Clearly separate seeded demo data from
   real records and remove any remaining fake dashboard defaults.
9. Review all client-facing screens for API-backed data and access-appropriate
   actions; handle team/finance roles and assigned wedding UX.
10. Run the whole lifecycle via API/browser and responsive checks at 360, 390,
    768, 1024, 1280 and 1440 px. Browser control host was unavailable in this
    session, so the UI and responsive widths remain unverified.
11. Confirm actual Odoo workflows only if a target instance and permitted
    standard-app mappings are available.

## Data and repository notes

- Changes remain local; no commit or push was made.
- `backend/.env` remains ignored and untouched; secrets were not emitted.
- Demo seeding remains idempotent and does not overwrite existing records, but
  demo records are still fictional sample data and must be clearly indicated in
  user-facing views.
