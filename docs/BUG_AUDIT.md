# EverWed bug and root-cause audit

Updated: 2026-11-01 (post-fix audit)

This audit is based on the current source in `backend/` and `frontend/src/`,
the project README, environment examples, and the recorded SQLite architecture
decision. Findings below describe verified code paths; items marked fixed are
also recorded in `docs/IMPLEMENTATION_PROGRESS.md` with their test evidence.

The finding descriptions preserve the original root cause for traceability.
Their current state is listed in the remediation column: several have been
fixed during this pass; the remaining rows are still open and should not be
read as proof that every workflow is complete.

## Critical

| Finding | Affected files | Root cause and user impact | Required correction | Verification |
| --- | --- | --- | --- | --- |
| Builder forges a couple identity and session token | `frontend/src/pages/builder/WeddingBuilderPage.tsx`, `frontend/src/router.tsx` | Historical root cause: fake couple token and navigation after failed writes. | **Fixed in code:** removed synthetic auth; protected builder by role; preserves errors and only navigates after writes. Partial save resumes safely. Browser workflow remains unverified. | Backend/frontend checks pass; browser tool stopped before UI validation. |
| Planner assignment is not a complete workflow | `backend/app/core/security.py`, `backend/app/api/routes/weddings.py`, `backend/app/services/wedding_service.py`, `frontend/src/pages/planner/TeamManagementPage.tsx` | Historical root cause: no API/UI to provision a planner wedding relation. | **Fixed for assignment:** Founder-only Team & Access page calls the admin API, which validates an active planner and stores the relation transactionally. | Automated assigned/unassigned planner access and dashboard tests; browser UI remains unverified. |
| Planner can record a client payment against an unassigned wedding | `backend/app/api/routes/finance.py` | Historical root cause: role check without wedding access check. | **Fixed:** client payment write checks wedding access before creating the payment. | Backend suite passes; finance scope regression coverage included. |
| Demo seed data is inserted on every server startup | `backend/app/main.py`, `backend/app/services/seed.py` | Historical root cause: lifespan unconditionally seeded fictional records. | **Fixed:** default startup does not seed; explicit `SEED_DEMO_DATA_ON_STARTUP=true` enables sample insertion. | Startup tests cover empty default startup and explicit idempotent seed behavior. |
| Real-adapter guest mutations silently succeed without persistence | `frontend/src/services/adapters/real.ts`, `frontend/src/pages/couple/CoupleGuestsPage.tsx` | Historical root cause: guest adapter returned empty/in-memory results. | **Fixed:** added SQLite guest entity and scoped CRUD, wired to real adapter. | Automated CRUD and cross-wedding denial tests. |

## High

| Finding | Affected files | Root cause and user impact | Required correction | Verification |
| --- | --- | --- | --- | --- |
| Missing `VITE_USE_REAL_API` silently selects mock app | `frontend/src/services/index.ts`, `frontend/.env.example`, `README.md` | Historical root cause: default adapter was mock and arbitrary usernames became planners. | **Fixed:** real API is default; mock is explicit opt-in and accepts only documented preview credentials. | TypeScript/lint/build pass; no browser click-through. |
| Bearer session is stored in localStorage | `frontend/src/context/AuthContext.tsx`, `frontend/src/services/api/client.ts`, `backend/app/core/security.py` | Historical root cause: JS-readable token storage without origin validation. | **Fixed for browsers:** HttpOnly SameSite cookie, origin allow-list check for cookie-authenticated writes, no token in JSON/localStorage. Bearer remains for explicit API clients. | Backend tests and isolated live HTTP setup/me/logout smoke pass. |
| Local onboarding bypasses real accounts | `frontend/src/pages/builder/WeddingBuilderPage.tsx`, `frontend/src/router.tsx` | Historical root cause: public builder and fabricated session. | **Fixed in code:** builder requires authenticated admin/planner and no longer fabricates couple auth. | Frontend checks pass; browser route test unavailable. |
| Login error handling can expose backend detail and setup response is written outside AuthContext | `frontend/src/pages/public/LoginPage.tsx`, `frontend/src/context/AuthContext.tsx` | Historical root cause: split setup/login state and raw detail. | **Fixed in code:** founder setup and login transitions are centralized; credentials failures are generic. | Isolated live HTTP smoke confirms cookie setup/me/logout; UI flow not browser-tested. |
| Planner dashboard was unavailable and Founder/Planner home views were not separated | `backend/app/api/routes/dashboard.py`, `frontend/src/pages/planner/OverviewPage.tsx`, `frontend/src/pages/planner/PlannerHomePage.tsx` | Historical root causes: endpoint rejected planners and both roles shared a Founder-focused summary. | **Fixed in code:** planner aggregates are assignment-scoped and Planner home shows assigned weddings, tasks and events; Founder keeps company overview. | Assigned/unassigned backend dashboard tests; TypeScript/lint/build pass, browser view not tested. |
| All account types shared one login and couples could not self-register | `frontend/src/pages/public/LoginPage.tsx`, `frontend/src/router.tsx`, `backend/app/api/routes/auth.py` | A common login redirected after authentication but did not identify the portal, check role against the chosen portal, or offer public Couple registration. | **Fixed in code:** added separate Founder, Planner and Couple portal pages, role-match enforcement with server logout on mismatch, public Couple registration with server-assigned role, and first-wedding onboarding. No public privileged-role registration exists. | Backend registration/onboarding tests and frontend type/lint/build pass; browser portal combinations remain unverified. |
| Planner applications lacked a Founder approval workflow | `backend/app/api/routes/auth.py`, `frontend/src/pages/public/PlannerSignupPage.tsx`, `frontend/src/pages/planner/TeamManagementPage.tsx` | Planner self-registration had no persisted review state or barrier to account activation. | **Fixed:** applications are inactive/pending; ordinary account activation cannot bypass Founder review; Founder-only approve/reject changes persisted status. | Automated test verifies pending login rejection, activation bypass denial and approval enabling login. |
| Finance role access policy needs a full scope audit | `backend/app/api/dependencies.py`, `backend/app/api/routes/finance.py` | Wedding-scoped client payments/bills check access; finance users retain broader query scope, while vendor payments are admin/finance only and must resolve the bill consistently. | Document intended finance scope and verify every bill/payment read and write against it. | Current backend suite passes; a complete role/IDOR matrix remains open. |
| Credential reset and full role lifecycle are missing | `backend/app/api/routes/auth.py`, `backend/app/schemas/auth.py`, `frontend/src/pages/planner/TeamManagementPage.tsx` | Founder can create/list accounts, assign planners, and deactivate/reactivate non-self accounts, but cannot reset passwords or change roles through a managed workflow. | **Partially fixed:** added Founder-only Team & Access UI and protected status endpoint. Deactivation revokes sessions and self-deactivation is blocked. Add credential reset, role-change audit, and lifecycle policies. | Backend deactivation/session revocation and self-lockout tests pass; browser admin workflow remains unverified. |
| Seeded demo records contain fictitious agreement links and financial totals | `backend/app/services/seed.py` | Example records include made-up signed agreement URL, completed payments, and task stats. Without clear labeling they can be mistaken for real records. | Keep demo data opt-in and identify it as sample/demo in API/UI. | Verify default database and explicit demo labels. |

## Medium

| Finding | Affected files | Root cause and user impact | Required correction | Verification |
| --- | --- | --- | --- | --- |
| Meeting and agreement history are embedded as unversioned enquiry JSON | `backend/app/schemas/enquiry.py`, `backend/app/services/enquiry_service.py`, SQLite schema | A single patch appends a meeting and toggles a boolean/file path; no separate agreement record, version, signature actor/time, or immutable history exists. | Add traceable consultation and agreement records with explicit states and history. | API tests for revision history and conversion eligibility. |
| Guest list, RSVP, and table allocation are not API-backed | `frontend/src/pages/couple/CoupleGuestsPage.tsx`, real adapter, backend routes/schema | Historical root cause: guest operations were stubs; RSVP and table allocation remain outside the implemented entity. | **Partially fixed:** guest list/create/update/delete persist in scoped SQLite CRUD. RSVP state and table allocation are not implemented. | Guest CRUD and cross-wedding denial covered by backend tests; browser and restart flow not tested. |
| Couple pages could fall back to an unrelated first wedding | `frontend/src/lib/utils.ts`, couple pages, CoupleLayout | Historical root cause: a missing/stale browser-global wedding ID triggered a first-row fallback. | **Fixed in touched home/overview/layout:** couple wedding selection comes directly from the authenticated profile; removed first-row fallback and added a no-wedding onboarding gate. Remaining couple pages still depend on the profile-synchronized active ID. | Backend cross-couple access tests pass; browser login-switch test unavailable. |
| Couple onboarding lacked ceremony choices and pages used seeded names/weddings | `backend/app/api/routes/weddings.py`, wedding service/schema, Couple pages | Onboarding created only a wedding row; other Couple pages retried a hard-coded demo wedding, and overview showed fictional planner identities. | **Fixed for initial setup:** saves tradition, regional notes and selected event rows transactionally; removes demo wedding fallbacks and hard-coded team names; planned guest estimate is separate from actual guest records. | Automated onboarding test verifies preferences and event rows; browser workflow remains unverified. |
| No delete routes, pagination, or consistent list filtering across core APIs | API route modules | CRUD is generally create/read/update; large collections load fully and UI cannot remove records. | Add only business-safe deletion/archive semantics and pagination/filtering where needed. | API contract tests and large-list tests. |
| Startup creates/migrates SQLite at module import time | `backend/app/services/store.py`, `backend/app/database/sqlite.py` | Global `Store()` initializes schema during imports, including tooling/tests, rather than inside the application lifespan. | Consider an explicit repository lifecycle while preserving startup failure behavior and persistent path. | Import-only check does not create production DB; lifespan initializes and closes. |
| Public enquiry endpoint has no throttling or abuse controls | `backend/app/api/routes/enquiries.py` | `POST /enquiries` is unauthenticated and unthrottled. This may be intended for a public lead form but can be abused. | Add local-appropriate request limits and validation; keep intended public behavior. | Burst test and request validation. |
| Fixed demo-oriented copy and hard-coded ceremony assumptions remain in screens/README | `frontend/src/pages`, `README.md`, some seed fixtures | Marketing/demo text can overstate which features are API-backed; some examples imply culturally specific ceremonies. | Mark demo-only capabilities and use user-provided ceremonies/preferences. | Copy and component audit plus UI review. |

## Low

| Finding | Affected files | Root cause and user impact | Required correction | Verification |
| --- | --- | --- | --- | --- |
| README feature claims exceed live API coverage | `README.md` | README describes instant deployment, guests, full role switcher, and API-backed workflows more broadly than current implementation supports. | Reconcile documentation with real mode and verified features. | Cross-check each claim against route/service/persistence and tests. |
| Auth and application modules retain old Royal Knot/ShaadiOS labels and encoding artifacts | Multiple backend files and README | Inconsistent product identity and mojibake reduce polish and can confuse operators. | Clean touched files selectively; avoid unrelated broad rewrites. | Text scan and frontend build. |
| Production security headers and rate-limits are not configured | `backend/app/main.py` | Current local-first service has CORS but no explicit security headers or rate-limits. | Apply an appropriate local deployment baseline without adding unnecessary services. | Header and rate-limit checks. |

## Audit state

SQLite is the approved primary database. The existing repository uses
`backend/data/everwed.sqlite3` by default, enables WAL, foreign keys, and a
5-second busy timeout, and stores thirteen business entity tables plus users and
sessions. Tests use an isolated temporary database. Previous test and build
results are recorded in `docs/IMPLEMENTATION_PROGRESS.md`; browser responsive
verification has not been performed.

This is a working audit, not a declaration that every finding is fixed. Mark a
finding complete only after the stated correction and verification are done.
