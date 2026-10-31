# EverWed API and frontend integration audit

Updated: 2026-11-01 (post-fix inventory)

Architecture: React/TypeScript frontend, FastAPI REST backend, SQLite persistent
storage. The frontend's adapter is selected in `frontend/src/services/index.ts`;
unless `VITE_USE_REAL_API=false` is explicitly set, it selects the real
adapter. Browser authentication uses an HttpOnly session cookie; the real
adapter uses `frontend/src/services/api/client.ts`, which unwraps
`{success, data}` responses and normalizes unreadable responses. See
`docs/BUG_AUDIT.md` for root causes, fixes and remaining work.

## Implemented backend endpoints

All listed endpoints return the shared API envelope unless marked health.
Sensitive route authorization noted here is enforced by backend dependencies,
not just frontend navigation.

| Method and path | Backend handler/service | Access and persistence | Frontend caller/status |
| --- | --- | --- | --- |
| GET `/health` | `health.health_check` | Public; checks SQLite health | No dedicated adapter call; available for startup checks |
| GET `/api/v1/auth/setup/status` | `auth.founder_setup_status` | Public; reads user collection | Login page, real adapter |
| POST `/api/v1/auth/setup` | `auth.setup_first_founder` / security helpers | Public only while no user exists; transaction creates admin/password hash/session; sets HttpOnly cookie and returns no token | Login page via AuthContext |
| POST `/api/v1/auth/login` | `auth.login` / security helpers | Public; generic credential failure; persists revocable session; sets HttpOnly cookie and returns no token | Role-specific Founder/Planner/Couple forms verify returned role before redirect |
| POST `/api/v1/auth/couple-signup` | `auth.couple_signup` / `create_user_record` | Public after an active Founder initializes the workspace; extra fields rejected; backend assigns `couple`; unique email, strong password, required storage consent; creates hashed-password account and HttpOnly session | Couple registration form |
| POST `/api/v1/auth/logout` | `auth.logout` | Revokes browser cookie session or explicit Bearer session, then clears cookie | AuthContext, real adapter |
| GET `/api/v1/auth/me` | `auth.me` | Requires valid session; public user profile | AuthContext restore, real adapter |
| POST `/api/v1/auth/users` | `auth.create_user` / `create_user_record` | Admin only; creates a non-admin account | Founder Team & Access page |
| GET `/api/v1/auth/users` | `auth.list_users` | Admin only; reads users | Founder Team & Access page |
| PATCH `/api/v1/auth/users/{user_uid}/status` | `auth.update_user_status` | Admin only; activation state is persisted; deactivation revokes existing sessions; self-deactivation is blocked | Founder Team & Access page |
| POST `/api/v1/demo/seed` | `main.seed_data` / `seed_demo_data` | Admin only; transactional, idempotent fictional demo records | No explicit adapter method |
| POST `/api/v1/enquiries` | `enquiries.create_enquiry` | Public; writes SQLite; optional best-effort Odoo attempt | Enquiry form, real adapter |
| GET `/api/v1/enquiries` | `enquiries.list_enquiries` | Admin, planner, finance; SQLite read | Enquiries page |
| GET `/api/v1/enquiries/{enquiry_id}` | `enquiries.get_enquiry` | Admin, planner, finance; SQLite read | Real adapter method; used by pages as needed |
| PATCH `/api/v1/enquiries/{enquiry_id}` | `enquiries.update_enquiry` | Admin/planner; SQLite write; meeting is embedded JSON, agreement is a bool/path | Enquiries page |
| POST `/api/v1/enquiries/{enquiry_id}/convert` | `enquiries.convert_enquiry_to_wedding` | Admin/planner; checks agreement flag and setup fields; transaction persists wedding/enquiry link | Enquiries page |
| POST `/api/v1/weddings` | `weddings.create_wedding` | Admin/planner only; persists wedding | Protected wedding builder; partial event save can resume without duplicate creates |
| POST `/api/v1/weddings/onboarding` | `weddings.couple_onboarding` / `WeddingService.create_wedding` | Authenticated couple without an existing wedding; transaction creates a real submitted wedding and links it to that account | Couple wedding setup form |
| GET `/api/v1/weddings` | `weddings.list_weddings` | Authenticated; filters returned rows through wedding access | Weddings page |
| GET `/api/v1/weddings/{wedding_id}` | `weddings.get_wedding` | Wedding access dependency; SQLite read | Wedding detail/couple pages |
| PATCH `/api/v1/weddings/{wedding_id}` | `weddings.update_wedding` | Admin/planner plus wedding access; SQLite write | Builder/detail as wired |
| POST `/api/v1/weddings/{wedding_id}/planner-assignment` | `weddings.assign_planner` | Admin only; validates active planner email and stores a `users` foreign-key relation transactionally | Founder Team & Access page |
| POST `/api/v1/weddings/{wedding_id}/events` | `events.create_event` | Admin/planner plus wedding access; SQLite write and counters | Builder/detail |
| GET `/api/v1/weddings/{wedding_id}/events` | `events.list_events_for_wedding` | Wedding access; SQLite read | Couple events and detail |
| GET `/api/v1/events/{event_id}` | `events.get_event` | Event-to-wedding access; SQLite read | Real adapter |
| PATCH `/api/v1/events/{event_id}` | `events.update_event` | Admin/planner plus event-to-wedding access; SQLite write | Detail pages |
| GET `/api/v1/vendors` | `vendors.list_vendors` | Any authenticated user; global directory | Vendor pages |
| POST `/api/v1/vendors` | `vendors.create_vendor` | Admin/planner; SQLite write | Vendor management |
| GET `/api/v1/vendors/{vendor_id}` | `vendors.get_vendor` | Any authenticated user; global record read | Real adapter |
| PATCH `/api/v1/vendors/{vendor_id}` | `vendors.update_vendor` | Admin/planner; SQLite write | Vendor management |
| POST `/api/v1/quotes` | `quotes.create_quote` | Admin/planner and wedding access; SQLite write | Quotes page |
| GET `/api/v1/quotes?wedding_id=...` | `quotes.list_quotes` | Wedding access; SQLite read | Quotes page |
| GET `/api/v1/quotes/compare?wedding_id=...&category=...` | `quotes.compare_quotes` | Wedding access; SQLite read/calculation | Quotes page |
| POST `/api/v1/quotes/{quote_id}/select` | `quotes.select_winning_quote` | Admin/planner and quote-wedding access; transaction selects one and rejects competitors | Quotes page |
| POST `/api/v1/weddings/{wedding_id}/tasks` | `tasks.create_task` | Admin/planner/team and wedding access; SQLite write | Tasks/detail |
| GET `/api/v1/weddings/{wedding_id}/tasks` | `tasks.list_tasks` | Wedding access; optional status/category/priority/owner filters | Tasks/couple checklist |
| PATCH `/api/v1/tasks/{task_id}` | `tasks.update_task` | Admin/planner/team and task-wedding access; SQLite write | Tasks/couple checklist |
| POST `/api/v1/operations/weddings/{wedding_id}/events/{event_id}/schedule` | `operations.add_schedule_item` | Admin/planner/team plus wedding/event scope; SQLite write | Operations/detail |
| GET `/api/v1/operations/weddings/{wedding_id}/schedule` | `operations.list_schedule` | Wedding access; optional event filter | Operations/couple events |
| PATCH `/api/v1/operations/schedule/{item_id}` | `operations.update_schedule_item` | Role plus schedule-wedding access | Operations |
| POST `/api/v1/operations/vendor-arrivals` | `operations.log_vendor_arrival` | Role plus wedding/event/vendor references; SQLite write | Operations |
| POST `/api/v1/operations/issues` | `operations.report_operational_issue` | Role plus wedding access; SQLite write | Operations |
| POST `/api/v1/operations/issues/{issue_id}/resolve` | `operations.resolve_operational_issue` | Role plus issue-wedding access; SQLite write | Operations |
| GET `/api/v1/operations/weddings/{wedding_id}/overview` | `operations.get_operations_overview` | Wedding access; SQLite-derived aggregate | Operations |
| GET `/api/v1/weddings/{wedding_id}/guests` | `guests.list_guests` / `GuestService` | Admin/planner/couple with wedding-level access; SQLite read | Couple guest page, real adapter |
| POST `/api/v1/weddings/{wedding_id}/guests` | `guests.create_guest` / `GuestService` | Admin/planner/couple with wedding-level access; validates and persists guest | Couple guest page, real adapter |
| PATCH `/api/v1/guests/{guest_id}` | `guests.update_guest` / `GuestService` | Admin/planner/couple; resolves record's wedding then checks access | Couple guest page, real adapter |
| DELETE `/api/v1/guests/{guest_id}` | `guests.delete_guest` / `GuestService` | Admin/planner/couple; resolves record's wedding then checks access | Couple guest page, real adapter |
| POST `/api/v1/finance/client-payments` | `finance.record_client_payment` | Admin/planner/finance role plus wedding access; atomic SQLite write, duplicate reference protection, booking deposit plan generation | Finance page |
| GET `/api/v1/finance/client-payments?wedding_id=...` | `finance.list_client_payments` | Wedding access; SQLite read | Finance/couple budget |
| POST `/api/v1/finance/vendor-bills` | `finance.record_vendor_bill` | Admin/planner/finance plus wedding access; SQLite write | Finance page |
| GET `/api/v1/finance/vendor-bills?wedding_id=...` | `finance.list_vendor_bills` | Wedding access; SQLite read | Finance page |
| POST `/api/v1/finance/vendor-payments` | `finance.record_vendor_payment` | Admin/finance; bill-level record access must be validated in service; SQLite write | Finance page |
| GET `/api/v1/finance/weddings/{wedding_id}/summary` | `finance.get_wedding_financial_summary` | Wedding access; integer-paise-derived summary | Finance/couple budget |
| GET `/api/v1/dashboard/overview` | `dashboard.get_dashboard_overview` | Admin/finance get company totals; planner gets aggregates filtered to accessible weddings | Planner overview |

## Frontend adapter gaps

The following `ServiceAdapter` operations do not persist via a backend endpoint:

| Frontend operation | Current implementation | Required correction |
| --- | --- | --- |
| Guest list/create/update/delete | Implemented as SQLite-backed scoped CRUD in `guests` | Verified with create/list/update/delete API coverage and couple cross-wedding denial |
| User lifecycle | Founder UI supports account creation/listing and planner assignment; no deactivation, credential reset, or role changes | Add protected lifecycle operations and authorization tests |
| Enquiry agreement lifecycle | Embedded `agreement_signed` boolean and `agreement_file`; no agreement CRUD/history | Add agreement record/version/state model and API |
| Wedding functions/cultural setup | Generic events endpoint; no separate preferences/setup-stage model | Add persisted setup fields and validations without defaulting to one tradition |
| Settlement/additional expenses | Finance routes cover payments and bills, not extras or close/settle workflow | Add paise-backed records and idempotent settlement workflow |
| RFQ groups / quote terms / acceptance history | Quote is a flat record and selection only updates statuses | Add quote lines/terms/audit history and workflow APIs |

## Cross-cutting findings

- API errors use a shared exception handler and successful responses use
  `{success, data}`. The frontend normalizes non-JSON responses; network
  failures still surface through the browser fetch error.
- API list endpoints are generally unpaginated.
- Guest deletion is supported; most other core business records have no DELETE
  route and should use explicit archive/closure semantics if introduced.
- Wedding-scoped finance writes check access. Vendor payment is admin/finance
  only and resolves the bill in the service; verify scope policy before adding
  broader payment roles.
- Browser sessions use an HttpOnly, SameSite=Lax cookie; state-changing cookie
  requests with an Origin outside configured CORS origins are rejected. Bearer
  remains available for explicit API clients and legacy tests.
- The database is SQLite at `backend/data/everwed.sqlite3` by default. Its schema
  has thirteen business entity tables plus user/session tables, foreign keys,
  indexes, WAL, and a versioned money migration. This establishes persistence
  for implemented entities, not for guest/agreement/settlement entities that do
  not yet exist.
- The frontend selects the real API unless `VITE_USE_REAL_API=false` is
  explicitly set. Mock login is restricted to documented preview credentials
  and the UI marks the preview non-persistent; it is not a production auth path.

## Verification state

API inventory was cross-checked against FastAPI route decorators, service
adapter methods, and SQLite schema. Auth cookie, planner assignment, guest CRUD,
finance scope, and planner dashboard behavior have automated tests. Not every
row has a standalone contract test; browser verification is still unperformed
because the Windows browser host stopped the session when it could not reliably
identify the current URL. See `docs/IMPLEMENTATION_PROGRESS.md` for latest
test results and known incomplete workflows.
