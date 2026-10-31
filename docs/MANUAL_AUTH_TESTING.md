# Manual authentication and portal checks

Automated API tests cover Couple registration/onboarding, hashed passwords,
duplicate email, rejected role injection, portal role data, session revocation,
planner assignment and Couple A/B isolation. A real browser pass could not be
completed in this environment because the Windows browser host did not reliably
identify the current URL. Use these steps for a manual browser acceptance pass.

## Prepare a safe browser-test database

Create a private SQLite backup using the method in `DATABASE_GUIDE.md`. Use the
backup file as `DATABASE_PATH` for manual browser checks so test accounts and
wedding records do not enter the existing application database. The backup
contains private data and must remain on the user's machine.

## Start the application against the test copy

In PowerShell, from the repository root, start the backend in one terminal:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
$env:DATABASE_PATH = "$env:USERPROFILE\Documents\EverWedBackups\everwed-backup.sqlite3"
uvicorn app.main:app --reload --port 8000
```

Start the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Open the Vite URL shown in the frontend terminal. Verify the backend is using
the test-copy path using the command in `DATABASE_GUIDE.md`. Keep demo preview
disabled so all requests use SQLite.

## Accounts and portal checks

1. At `/login`, confirm three distinct Founder, Planner and Couple choices.
2. Sign in to `/login/founder` with the existing Founder account. Confirm the
   Founder company overview and Team & Access page load. Do not reset the
   existing account merely to perform this check.
3. In Team & Access, create a Planner with a unique email and strong password.
   Assign that Planner to one existing wedding.
4. Sign out. Sign in at `/login/planner`; confirm the Planner home shows only
   that assigned wedding. Try the same credentials at `/login/founder`; the app
   should reject the portal mismatch and end the issued session.
5. Open `/register/couple`, create Couple A with unique email, matching strong
   password/confirmation, valid phone, and accepted account terms. Confirm the
   success notice and proceed to wedding setup. Submit real test details and
   verify the Couple dashboard uses that wedding.
6. Try the same Couple A account at `/login/planner`; expect a portal mismatch
   and signed-out state. Sign into `/login/couple`; refresh the page and verify
   the session restores from the HttpOnly cookie.
7. In a private browser profile, register Couple B and create a different test
   wedding. While signed in as Couple A, try Couple B's wedding ID in a couple
   API URL; expect HTTP 403. Repeat in the other direction.
8. Log out. Confirm the protected couple route returns to login and the old
   cookie cannot access `/api/v1/auth/me`.
9. In DB Browser for SQLite, confirm the two test user roles and weddings were
   added to the test copy. Discard the copy after checks; do not modify the
   existing application database for browser acceptance testing.
10. Use browser responsive mode at 360, 390, 768, 1024, 1280 and 1440 pixels.
    Check the portal cards, signup form, onboarding form, nav drawer and Planner
    workspace for clipped controls or horizontal overflow; record results.

The live database inspection on 2026-11-01 showed one existing admin and no
Planner/Couple test accounts. The automated tests use an isolated temporary
SQLite database and do not create test accounts in the live database.
