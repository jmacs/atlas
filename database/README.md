# Database

Shared durable-state code belongs here: SQLite initialization, migrations,
schema definitions, transactions, and repositories. Both `server/` and
`worker/` may depend on this directory. It must not depend on either runtime.

The SQLite files live outside this source directory. Their location is derived
from `ATLAS_APPDATA_DIR` in `paths.ts`.
