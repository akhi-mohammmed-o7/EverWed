# Architecture decision

Date: 2026-10-31

## Decision

Use the existing React, TypeScript, Tailwind, FastAPI, and SQLite architecture
for the hackathon build. SQLite is the persistent source for application
business records and supports the project requirement to run locally without
internet. Odoo stays an optional integration for the workflows already wired
through its XML-RPC client.

## Evidence and trade-off

The supplied `finaldocclaude.docx` marks React + TypeScript + Tailwind, Python
FastAPI, and SQLite as the confirmed team stack. Its compliance matrix also
describes FastAPI REST/WebSocket APIs and a local database as the approved
implementation. The separate request to use MongoDB Atlas is conditional on
architecture approval and conflicts with that confirmed SQLite/offline design.
The Atlas settings are therefore left unused and no MongoDB credentials are
read, logged, or copied.

The repository does not contain an Odoo-native module. The current hackathon
requirements document treats the standalone local application architecture as
the build target, so this work does not replace the backend with native Odoo
views or claim that Odoo is the source of business records.

## Implementation consequences

- All thirteen implemented business entities use SQLite tables through the
  mapping-compatible repository in `backend/app/services/store.py` (the guest
  entity was added after the original twelve-collection inventory).
- Relationship columns use foreign keys, frequently queried fields are
  indexed, and the database enables foreign keys, WAL, and a busy timeout.
- The configured database is mandatory: startup and writes fail visibly when
  storage is unavailable; the application does not silently fall back to RAM.
- Demo seeding is transactional and idempotent; it preserves existing records.
- Odoo connectivity remains optional and unverified until a real instance and
  compatible models are available.

## Follow-up architecture check

On 2026-10-31, the repository requirements were rechecked in response to a
request to make MongoDB Atlas the primary store. The final-for-build document
still names SQLite as the confirmed database and requires the demo to run on one
laptop without internet. Its compliance matrix specifies SQLite and its storage
rules require foreign keys, WAL, a busy timeout, UTC datetimes and integer
paise. It does not approve Atlas as an alternate primary database.

The user reports Atlas and all twelve collections are configured and that a
manual Python ping test succeeded. That report was not independently repeated.
After reviewing the conflict, the user confirmed SQLite remains the approved
primary store for hackathon compliance. MongoDB is not wired into the app; the
configured environment values were not displayed or copied.
