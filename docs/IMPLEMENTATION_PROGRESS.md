# EverWed implementation progress

Updated: 2026-11-01 (Simplification, role portals and core workflow delivery)

## Latest reliability update (2026-11-01)

- Fixed the Couple page blank/blurred state shown in the user screenshot. The
  page entrance animation creates a containing block, which trapped fixed
  dialogs inside the content region and centered them outside the viewport.
  Shared dialogs now render through a document-level React portal above app
  navigation, fixing guest/task and other modal forms consistently.
- Couple guest and task saves now show API validation errors inside their open
  dialogs and prevent accidental repeated submissions. The shared modal no
  longer resets page scroll state when callback props rerender.
- Added a manual/offline client payment report path for deployments without
  Razorpay. Couple submissions are persisted as `pending`, reserved against
  duplicate/overpayment, and excluded from receipts/balances until an assigned
  Planner or Founder verifies the actual transfer reference. Planners can reject
  invalid reports; rejected reports remain in history and release the reserved
  balance. Online link creation is blocked while an offline report awaits review.
- Removed online checkout and link history controls from Couple and Planner
  finance screens. Planner Finance now explains the two offline flows directly:
  confirmed money received from the couple, and vendor bills recorded before
  actual payments are entered against each bill.
- Added backend workflow coverage for couple task create/update and the offline
  report → Planner verification → recalculated balance path. Current checks:
  backend suite `60 passed`; frontend TypeScript build check passed; frontend
  Oxlint completed with existing project-wide warnings.

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

### Couple workflow and checklist repair (final pass, 2026-11-01)

- Fixed a data-integrity defect in `TaskService.update_task`: the API returned the
  new status but never wrote the task back to SQLite, so checklist completion was
  lost on reload and backend restart. Task updates now persist.
- Couples can complete their own checklist items through
  `PATCH /api/v1/tasks/{task_id}`. They may change only `status` and `notes`;
  ownership/deadline edits remain restricted to agency roles.
- Couple onboarding now generates the baseline checklist immediately instead of
  waiting for an internal booking deposit that a couple cannot record. Each
  created function additionally generates three preparation tasks. Generation is
  idempotent and never duplicates, rewrites or removes existing/manual tasks.
- Couples can edit their own wedding preferences (destination, venue, guest
  estimate, budget, dates, theme, tradition and regional customs) and their
  functions. Contract value and lifecycle status remain agency-controlled.
  Function dates/times and the wedding date window are validated server-side.
- Added the couple-only Wedding Builder at `/couple/builder` and a Couple
  navigation entry. The staff creation wizard is now labelled "Create Wedding"
  and is separate from the Couple Wedding Builder. Public landing-page builder
  CTAs now lead to Couple registration or the Planner portal, not a protected
  staff route.
- Couple budget now uses `/api/v1/finance/weddings/{id}/summary` and keeps the
  planned budget, agreed contract, amount paid, remaining balance, agreed vendor
  total, supplier bills, vendor payments and outstanding payables distinct.
- Replaced hardcoded dashboard decisions with real pending checklist tasks that
  update through the API. Added guest editing and function editing; checklist and
  guest failures are shown instead of silently rendering an empty screen.
- Added `backend/scripts/provision_founder.py`. It reads credentials from
  `EVERWED_FOUNDER_EMAIL` / `EVERWED_FOUNDER_PASSWORD`, never prints plaintext,
  hashes the password and refuses to modify an existing account. The requested
  local `admin@gmail.com` Founder was provisioned (uid 4, role admin); the
  pre-existing Founder account was not changed.

### Final verification (2026-11-01)

- Backend: `python -m pytest -q -p no:cacheprovider` — **41 passed**, one upstream
  Starlette/AnyIO deprecation warning. `python -m compileall -q app` passed.
- Frontend: `npx tsc -b` passed; `npm run lint -- --quiet` passed with 0 errors
  (156 existing warnings); `npm run build` passed. Vite emitted its usual
  oversized-chunk warning (887.89 kB JS, 246.06 kB gzip).
- Founder provisioning was run once and a read-only check confirmed
  `role=admin`, `active=True` and `password_hash_verifies=True` without printing
  the password or hash.
- Browser and responsive checks at 360/390/768/1024/1280/1440 px were **not**
  performed; no browser result is claimed.

### Simplification and delivery pass (2026-11-01)

- Removed advanced modules from navigation and routing: quote comparison,
  day-of operations, financial statement, wedding risk radar and the separate
  staff Wedding Builder. Their API/data layers remain intact but they are no
  longer reachable screens.
- The Wedding Builder is now Couple-only and is an eight-step sequential flow:
  partner names, dates, tradition (including custom), regional customs,
  functions (including custom functions and no forced ceremony), city/venue,
  planned guest count and planned budget. The same flow edits saved details.
- Added event deletion with safe cleanup: generated preparation tasks for the
  deleted function are removed, manual tasks are unlinked, and day-of records
  block deletion with a clear error instead of being silently discarded.
- Added partner-name capture/editing to the Couple onboarding and wedding
  record, and exposed partner names to the couple's profile.
- Removed the contact-email fallback from wedding access. A Couple can only
  access the wedding explicitly linked to their account.
- Planner assignment now records the planner's name and transfers generated
  task ownership to that planner. Couples see the actual assigned planner.
- Restricted enquiry records and vendor writes to the Founder; Planners keep
  read-only vendor access. Planner registration approval remains Founder-only.
- Planner wedding workspace now has working guest CRUD (add, edit, delete,
  RSVP, search, filter) alongside event and task management. Admin-only finance
  summary remains on the same page.
- Removed hard-coded demo coordinator names, dates, owners and wedding IDs from
  the planner workspace and task screens.
- Couples can update their planned budget from the Budget page; recorded
  payments and expenses remain separate and are never fabricated.
- Added tests for event deletion, partner-name editing, email-based access
  denial, guest CRUD, planner assignment and Planner role restrictions.

### Guest import, checklist CRUD and Founder management (2026-11-01)

- Added guest duplicate prevention to create and edit, based on email, then
  phone, then normalised name within the same wedding.
- Added CSV bulk import at `POST /api/v1/weddings/{id}/guests/import`. It accepts
  common header aliases, validates every row, skips duplicates, reports row
  errors, and imports the valid rows in one transaction. The Couple guest page
  exposes file upload plus a clear import summary.
- Added add/edit/delete checklist tasks. Couples may manage task titles,
  categories, due dates, priorities, notes and status; ownership and unrelated
  fields stay protected. Planners can edit and delete tasks from both the task
  list and the wedding workspace.
- Added Founder wedding management for contact details, dates, venue, budget,
  client package fee and lifecycle status. Dashboard contract value now reflects
  an explicitly recorded package fee.
- Added enquiry status editing and visible API errors, vendor edit support, and
  removed the unused operations-issues panel from the Founder dashboard.
- Added tests for CSV import/duplicates, checklist CRUD and persistence, Founder
  wedding management, and dashboard contract value.

### Latest verification (2026-11-01, guest/checklist pass)

- Backend: `python -m pytest -q -p no:cacheprovider` — **50 passed**, one
  upstream Starlette/AnyIO deprecation warning; `python -m compileall -q app`
  passed.
- Frontend: `npx tsc -b` passed; `npm run lint -- --quiet` passed with 0 errors
  and 147 warnings; `npm run build` passed (805.36 kB JS, 231.12 kB gzip, with
  Vite's existing large-chunk warning).
- No browser or responsive-width check was performed in this pass, so no visual
  result is claimed.

## Remaining work (master prompt)

1. Add credential reset/role-change workflow and a complete role/IDOR access
   matrix, including vendor-payment bill scope. Account activation/deactivation,
   Team & Access UI and planner assignment are implemented.
2. Add a local startup/restart verification on the configured user database to
   confirm the version-1 to version-2 money migration preserves existing data.
3. Add explicit, traceable consultation and agreement CRUD/signing states.
4. Add RFQ groups and quote line items, deliverables, availability, terms,
   additional costs and acceptance/rejection audit history.
5. Implemented: couples can edit wedding details, destination, venue, guest
   count, budget, dates, theme, tradition, regional customs and functions after
   setup at `/couple/builder`. Accommodation and transport requirement fields
   are still not modelled.
6. Implemented: baseline and per-function checklist tasks are generated
   idempotently, and couples can complete tasks without altering planner-owned
   fields. Milestones and a dedicated assignment UI remain open.
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

### Planner workflow and vendor payment hardening (2026-11-01)

- Kept SQLite as the primary/offline database for hackathon compliance. Applied
  the additive schema v4-to-v5 migration to the configured database after
  checking for case-insensitive duplicate payment references and duplicate
  vendor bill numbers. Both checks were clean; all 84 records in 15 tables
  remained after migration.
- Planner-created weddings are now assigned to their creator, so the Planner
  can immediately open and manage the workspace. Existing Founder assignment
  controls remain unchanged.
- Strengthened Planner relationship checks for event-linked operations, vendor
  quotes and vendor bills. Cross-wedding event/quote references are rejected;
  nonexistent vendors no longer produce placeholder arrival records.
- Vendor bills and agency finance summaries now enforce role and wedding
  assignment access. Couples cannot access internal vendor bills, payments or
  agency margin summaries. Vendor bank details are omitted from Planner/Couple
  vendor responses.
- Vendor payment records now validate and retain payment date, method, actual
  transaction reference and notes. Amounts are limited to paise precision,
  duplicate references are rejected case-insensitively, and overpayments are
  blocked inside an immediate transaction. Bill balances and paid status are
  recalculated from durable payment records. Payment history is visible under
  each Planner bill, and the UI explicitly says EverWed records payments but
  does not transfer funds.
- Added API coverage for partial/final payment balances, duplicate/invalid and
  overpayment rejection, payment history, reopen-and-read persistence, Planner
  wedding scoping, Couple financial access denial, bank-detail filtering and
  immediate access to Planner-created weddings.

### Verification (2026-11-01, Planner/payment pass)

- Backend: `python -m compileall -q app tests` passed; `python -m pytest -q
  -p no:cacheprovider` — **53 passed**, one upstream Starlette/AnyIO
  deprecation warning.
- Existing configured SQLite database: schema migrated 4 -> 5; pre/post row
  counts matched across all 15 tables (**84 records preserved**); duplicate
  preflight checks passed. Application startup and `/api/v1/health` returned
  HTTP 200 with SQLite connected and demo seeding disabled.
- Frontend: `npm run build` passed (Vite produced the production bundle;
  existing large-chunk warning). `npm run lint -- --quiet` passed. A first
  sandboxed Vite attempt hit Windows `spawn EPERM`; the same build passed when
  run with the required elevated filesystem process access.
- `git diff --check` passed. No commit, push or deployment was performed.
- Browser-driven visual/responsive checks were not run in this pass. Existing
  broad application follow-ups listed above remain outside this Planner/payment
  repair, including Odoo live-instance workflows and full lifecycle browser QA.

### Couple planner assignment and online contract payments (2026-11-01)

- Couples can browse active Planner profiles during onboarding, select or change
  their Planner from the couple dashboard, and see who owns their wedding.
  Onboarding without a selection load-balances to an active Planner. Previously
  unassigned weddings are assigned when a Planner becomes available and on app
  startup. Planner profile fields are editable by the Planner.
- Couple-created workspace records remain the same wedding/event/task records
  consumed by Planner APIs; assignment and access checks are server-side.
- Added Razorpay hosted Payment Links for the agreed contract fee (not the
  couple-editable planning budget). Links allow provider-configured methods and
  partial payments. Signed webhook processing records only provider-captured
  transactions in the shared SQLite ledger; payment links and event IDs are
  persisted, duplicate deliveries/payments are handled idempotently, and
  unknown provider outcomes block unsafe retries. No card/UPI credentials are
  stored. Couples and assigned Planners see the saved payment status/history.
- The webhook rejects payloads larger than 1 MB. API/webhook keys are optional
  environment configuration and were not printed or changed. A safe
  configuration check found the current environment does not have the full
  Razorpay credentials/webhook configuration. Actual live collection therefore
  requires the owner’s Razorpay account credentials and a public HTTPS webhook
  configured at Razorpay; no live charge was attempted.
- Existing user database preflight found no duplicate payment-reference or
  vendor-bill-number groups. It was already at schema v6, so initialization was
  a no-op migration (6 -> 6). SQLite integrity check passed; 94 records in 17
  existing tables remained unchanged, with both payment tracking tables empty.

### Verification (2026-11-01, couple/payment pass)

- Backend: compileall passed; `python -m pytest -q -p no:cacheprovider` passed:
  **56 passed**, one upstream Starlette/AnyIO deprecation warning. Tests cover
  Planner selection/assignment, shared wedding access, payment-link API
  behavior, signed simulated partial/full provider webhooks, duplicate event
  idempotency, unauthorized access and persistence. Provider calls are stubbed;
  no live Razorpay charge was performed.
- Frontend: `npx tsc -b --pretty false` passed; `npm run lint -- --quiet`
  passed; `npm run build` passed (813.30 kB JS / 233.21 kB gzip, existing
  large-chunk warning). The first sandboxed build hit Windows `spawn EPERM`; it
  passed with process access enabled.
- `git diff --check` passed after the final webhook-size guard. Browser-driven
  interaction and responsive-width checks remain unverified.
- No commit, push, deployment or GitHub change was made. `backend/.env` was not
  read or changed for display, and no credential values were emitted.

### Frontend usability and payment-flow pass (2026-11-01)

- Replaced the landing page's internal jargon/unsupported metric strip with
  four plain-language product benefits: choose a Planner, plan in one shared
  workspace, pay against a clear contract balance and see payment updates.
- Root cause of Planners not seeing couple financial activity: the existing
  Finance page was not mounted in the route tree or Planner navigation. Added
  `/planner/finance` for Planner and Founder accounts, linked it from the
  desktop/mobile Planner menus, and made the Couple payment section the initial
  view so recorded transactions and links are visible immediately.
- Rewrote the Couple payment panel as a four-step process. It distinguishes
  Planner contract setup from payment approval, provides a prominent
  continue-to-checkout action for an active link, shows pending/reconciliation
  states, explains automatic provider confirmation, and avoids implying that a
  Planner has to accept a successful online payment. Planner Finance now states
  that confirmed links are recorded automatically and require no acceptance.
- Improved all signed-in pages through shared shell and component styles:
  stronger type rhythm, non-shrinking icons, consistent focus visibility,
  larger touch navigation, clearer card hierarchy, page transitions and
  reduced-motion handling.
- Verification after changes: frontend TypeScript build (`npx tsc -b
  --pretty false`) passed; `npm run lint -- --quiet` passed; production
  `npm run build` passed (839.33 kB JavaScript / 238.64 kB gzip, existing
  large-chunk warning). One browser viewport near 800 px wide was inspected;
  the new benefit cards rendered without text/icon overlap. Route-level
  browser inspection was interrupted by the computer-use URL safety guard, so
  no additional visual or responsive-width verification is claimed.
- Backend was unchanged in this UI pass; the preceding payment/Planner suite
  remains **56 passed**. No commit, push or deployment was performed.

### Financial reconciliation, transaction safety and finance dashboard (2026-11-01)

- Root cause of the ₹2 lakh received / ₹0 contract mismatch: the app saved each
  client receipt, but payment entry did not require an agreed `package_fee`;
  summaries then treated an absent fee as zero. A second saved wedding has
  ₹2 lakh received against a ₹1 lakh saved fee. Neither record has a reliable
  amount in its linked enquiry that can be used to reconstruct the signed fee.
  Existing payment rows were preserved and no contract amount was guessed.
- Finance summaries now flag a missing contract amount and calculate/report
  legacy overpayment separately. Couple, selected-wedding Planner, portfolio
  dashboard and Founder views distinguish "not set" from a genuine ₹0 value.
  The Planner Finance page has an inline contract-fee reconciliation form; it
  requires the saved amount to be at least the amount already received.
- New client payments require a saved contract amount, are limited to the
  remaining balance, reject duplicate references case-insensitively, validate
  paise precision/method/date, and use a full UUID per transaction. Contract
  changes are serialized with payments, cannot go below recorded receipts, and
  cannot change while a live hosted payment link is outstanding.
- Added SQLite schema v7's case/whitespace-insensitive unique client-reference
  index. Duplicate preflight on the configured DB was clean. The DB was already
  on v7 when verified; its 111 rows across 17 collections were unchanged during
  verification, the index exists and `PRAGMA integrity_check` returned `ok`.
- Planner Finance now includes portfolio totals for contract value, received
  client money, known client balances due, vendor invoices, vendor payments,
  vendor balances due and estimated profit. Missing-fee and overpayment counts
  make incomplete historical figures visible. Per-wedding views show invoice
  totals separately from estimates based on selected vendor quotes.
- The demo adapter now uses contract fees and individual payment rows as its
  financial source of truth, consistent with SQLite behavior.
- Tests: `python -m compileall -q app tests` passed; full backend suite **57
  passed**, one upstream Starlette/AnyIO deprecation warning. The new workflow
  test covers preserved legacy receipts, contract reconciliation, advance and
  final payments, partial payment, duplicate/overpayment rejection, Couple vs
  Planner consistency, vendor balances, and portfolio KPI deltas. Frontend
  typecheck and lint passed; production build passed (848.75 kB JS / 240.81 kB
  gzip; existing large-chunk warning).
- Configured application startup smoke check passed: `/api/v1/health` returned
  HTTP 200 with SQLite connected; demo seeding remained disabled.
- Current historic rows remain flagged until a Planner verifies and enters
  their actual signed contract amounts in Finance & Payments. This is required
  to determine the true remaining balance and profit; amounts were not inferred
  from the planning budget or payment history.

### Couple Planner selection endpoint repair (2026-11-01)

- Fixed `/api/v1/weddings/{wedding_id}/planner-selection`: the route invoked
  `ensure_wedding_access` without importing it, causing the reassignment request
  to raise a server-side `NameError`.
- In debug/local mode, CORS and the cookie-origin guard now accept Vite running
  on `localhost`, `127.0.0.1`, or IPv6 loopback. Production continues to use
  the configured origin allowlist.
- Expanded the Couple planner workflow regression test to select a second
  Planner, verify the change is saved on the wedding, and exercise a PATCH from
  `http://127.0.0.1:5173` including its CORS preflight.
- Verification: focused planner workflow tests **2 passed**. Full backend suite
  `python -m pytest -q -p no:cacheprovider`: **57 passed**, one upstream
  Starlette/AnyIO deprecation warning. No saved production wedding was changed.

### Planner Finance action reliability (2026-11-01)

- The finance screen now loads the selected wedding's contract and ledger
  independently of the optional payment-link and portfolio widgets. A failure
  in either optional widget no longer blocks the client-payment and vendor-bill
  workflows.
- API/validation errors for client payments and vendor invoices are now shown
  inside their open forms (the previous page-level error was covered by the
  modal backdrop). Record buttons show a saving state; forms refresh their
  transaction/invoice references after successful saves to avoid accidental
  duplicate attempts.
- Client Payment now directs Planners to save a missing agreed contract fee
  before entering receipts. Vendor-directory loading errors and an empty
  directory are visible in the invoice form instead of silently leaving an
  unusable vendor selector.
- Verification: finance API workflow tests **6 passed**; frontend TypeScript
  `npx tsc -b --pretty false` passed; frontend lint completed with existing
  warnings. `npm run build` reached Vite after TypeScript passed but Vite config
  loading failed with a Windows `spawn EPERM` environment error.

### Couple secure payment-link feedback (2026-11-01)

- Separated payment-link action failures from budget-load polling errors so an
  8-second successful refresh cannot immediately clear the link-creation error.
- The Couple page now identifies an unconfigured Razorpay deployment, explains
  that the Founder/Admin must configure the API credentials and webhook secret,
  and confirms no payment was taken. After this response, it stops presenting
  the action as if checkout were ready.
- Environment readiness was checked without printing credentials: Razorpay API
  credentials and webhook secret are currently not configured, so a real link
  cannot be issued from this environment. Existing test-mode API coverage uses
  a mocked provider and does not simulate a real charge.
- Verification: `tests/test_razorpay_payments.py` **2 passed**;
  `npx tsc -b --pretty false` and Couple Budget lint passed; `git diff --check`
  passed. The unconfigured-provider test confirms the request returns 503 and
  saves no payment-link intent.
- Follow-up verification: added an assigned-Planner workflow test that starts
  without a contract, saves the agreed fee, records a client payment and
  records/reads a vendor invoice. Full backend suite: **58 passed**, one
  upstream Starlette/AnyIO deprecation warning. Frontend typecheck and targeted
  Couple Budget lint passed.
- The local backend environment contains none of the Razorpay variables, so
  real checkout remains unavailable until the account owner configures them.
  No contract values were inferred and no stored wedding/payment records were
  modified during these tests.
