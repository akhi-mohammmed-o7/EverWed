# EverWed SQLite database guide

## Active database

The backend currently resolves its configured database to:

```text
backend/data/everwed.sqlite3
```

The backend uses this existing file; it does not connect to MongoDB. The
resolved path was checked against the repository database file on 2026-11-01.
That read-only inspection found schema version 4, 15 application tables, 54
explicit indexes, an `integrity_check` result of `ok`, and no foreign-key
violations. The live user-role aggregate was one admin account; no test
accounts were added to the user's database. No user names, email addresses, or
credential data were printed during inspection.

The backend setting is `DATABASE_PATH`. A relative path is resolved from the
backend directory. Check the effective path without printing environment
secrets by running this from `backend/`:

```powershell
python -c "from pathlib import Path; from app.core.config import get_settings; print(Path(get_settings().database_path).resolve())"
```

## Tables

| Table | Purpose |
| --- | --- |
| `users` | Founder, planner, team, finance and couple account records; password hashes are private credentials. |
| `sessions` | Expiring, revocable authenticated sessions linked to users. |
| `enquiries` | Prospective wedding client enquiries and their current agreement/meeting fields. |
| `weddings` | Wedding workspaces, couple and planner relationships, dates, venue and budget fields. |
| `events` | Wedding functions and event schedules. |
| `guests` | Wedding guest and RSVP records. |
| `vendors` | Vendor directory records. |
| `quotes` | Vendor quotations and selection status. |
| `tasks` | Planning tasks linked to weddings and, where present, events. |
| `schedules` | Operational schedule items. |
| `vendor_arrivals` | Vendor arrival and timing records. |
| `operational_issues` | Wedding operation issues and their resolution state. |
| `client_payments` | Client payment transactions. |
| `vendor_bills` | Vendor invoice and outstanding-balance records. |
| `vendor_payments` | Payments linked to vendor bills. |

Business records are persisted in SQLite tables with indexed relationship and
status columns. Foreign keys are enabled. Monetary fields are stored as integer
paise and converted to rupees in API responses.

## Inspect with DB Browser for SQLite

1. Install and open DB Browser for SQLite.
2. Select **Open Database** and choose `backend/data/everwed.sqlite3`.
3. Use **Database Structure** to view tables, indexes and foreign keys.
4. Use **Browse Data** to inspect records. Treat account and payment data as
   private; never copy passwords, password hashes, session tokens, or personal
   details into screenshots or reports.
5. Do not edit records directly while the backend is running. Use the EverWed
   application/API so validation, authorization and transactions are applied.

## Back up the database

Use SQLite's online backup API so committed data in the WAL is included. Run
this from `backend/`; choose a private backup destination and protect the copy:

```powershell
@'
import sqlite3
from pathlib import Path

source = sqlite3.connect("file:data/everwed.sqlite3?mode=ro", uri=True)
backup_directory = Path.home() / "Documents" / "EverWedBackups"
backup_directory.mkdir(parents=True, exist_ok=True)
destination = sqlite3.connect(backup_directory / "everwed-backup.sqlite3")
source.backup(destination)
destination.close()
source.close()
print("SQLite backup completed")
'@ | python -
```

Keep backups outside source control and verify a backup by opening the copy in
DB Browser or running SQLite integrity checks. Restoring a backup replaces the
database and should only be done with the backend stopped and after another
backup of the current file.

## Integrity check

From `backend/`, SQLite's read-only integrity check can be run with:

```powershell
python -c "import sqlite3; c=sqlite3.connect('file:data/everwed.sqlite3?mode=ro', uri=True); print(c.execute('PRAGMA integrity_check').fetchone()[0]); print('foreign-key errors:', len(list(c.execute('PRAGMA foreign_key_check')))); c.close()"
```

Expected output for a healthy database is `ok` and zero foreign-key errors.
