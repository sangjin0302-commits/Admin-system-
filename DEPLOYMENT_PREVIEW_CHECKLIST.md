# Deployment Preview Checklist

## Database

- Local development keeps `DATABASE_PROVIDER=sqlite`.
- Local development keeps `DATABASE_URL=file:...`.
- Preview or production should switch to `DATABASE_PROVIDER=postgresql`.
- Preview or production should use a managed PostgreSQL `DATABASE_URL`.
- PostgreSQL runtime support is now wired through `@prisma/adapter-pg` in [src/lib/prisma/client.ts](/C:/codex-buildcheck/admin-office-mvp/src/lib/prisma/client.ts).
- `npm run build` now auto-runs the correct Prisma client generation step through [prepare-prisma-client.mjs](/C:/codex-buildcheck/admin-office-mvp/scripts/prepare-prisma-client.mjs).
- Prisma Client generation is provider-specific, so:
  - SQLite local mode uses `npx prisma generate --schema prisma/schema.prisma`
  - PostgreSQL mode uses `npm run prisma:generate:postgres`
- Re-run the matching generate command after any datasource or client change.

## Recommended Preview Stack

- App hosting: Vercel
- Managed Postgres: Railway PostgreSQL
- Remote storage: Cloudflare R2
- Storage driver:
  - `r2` for Cloudflare R2 via the S3-compatible adapter
  - `s3` for AWS S3 when needed

## File Storage

- Local development keeps `DOCUMENT_STORAGE_DRIVER=local`.
- Local development can use `LOCAL_DOCUMENT_UPLOAD_DIR=uploads`.
- Preview or production should not rely on the local filesystem for uploaded documents.
- `DOCUMENT_STORAGE_DRIVER=s3` now uses a real S3-compatible adapter.
- `DOCUMENT_STORAGE_DRIVER=r2` reuses the same S3-compatible adapter with a custom endpoint.
- `DOCUMENT_STORAGE_DRIVER=vercel-blob` is still intentionally unsupported and fails fast.
- Keep `storagePath` as an opaque key so DB rows do not depend on filesystem paths.

## Runtime Variables

- `DATABASE_PROVIDER`
- `DATABASE_URL`
- `DOCUMENT_STORAGE_DRIVER`
- `LOCAL_DOCUMENT_UPLOAD_DIR`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT`
- `S3_FORCE_PATH_STYLE`
- `NODE_ENV`

## Preview Readiness

- Confirm admin login works with seeded local accounts.
- Confirm `npm run build` succeeds with no lingering `next build` process.
- Confirm file upload, download, and delete still work on local storage.
- Confirm `/admin` routes redirect to `/admin/login` when no session exists.
- Confirm admin-only mutations reject `STAFF` where expected.
- Confirm key mutations write audit log rows.

## Before Real Deployment

- Provision Railway PostgreSQL and Cloudflare R2 credentials.
- Run Prisma migrations against the managed Postgres database before routing real traffic.
- Decide whether preview should use shared seed data or isolated environment data.
- Put the Railway PostgreSQL connection string into Vercel as `DATABASE_URL`.
- Put the Cloudflare R2 credentials into Vercel using the `S3_*` variables.
- Keep Vercel for the app tier and reserve Railway app services for future workers or bots.
