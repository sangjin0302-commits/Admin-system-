# Deployment Preview Checklist

## Database

- Local development keeps `DATABASE_PROVIDER=sqlite`.
- Local development keeps `DATABASE_URL=file:...`.
- Preview or production should switch to `DATABASE_PROVIDER=postgresql`.
- Preview or production should use a managed PostgreSQL `DATABASE_URL`.
- PostgreSQL runtime support is now wired through `@prisma/adapter-pg` in [src/lib/prisma/client.ts](/C:/codex-buildcheck/admin-office-mvp/src/lib/prisma/client.ts).
- Prisma Client generation is provider-specific, so:
  - SQLite local mode uses `npx prisma generate --schema prisma/schema.prisma`
  - PostgreSQL mode uses `npm run prisma:generate:postgres`
- Re-run the matching generate command after any datasource or client change.

## File Storage

- Local development keeps `DOCUMENT_STORAGE_DRIVER=local`.
- Local development can use `LOCAL_DOCUMENT_UPLOAD_DIR=uploads`.
- Preview or production should not rely on the local filesystem for uploaded documents.
- Replace the placeholder remote adapter in [remote-storage-placeholder.ts](/C:/codex-buildcheck/admin-office-mvp/src/lib/document-storage/remote-storage-placeholder.ts) with:
  - S3
  - R2
  - Vercel Blob
- Keep `storagePath` as an opaque key so DB rows do not depend on filesystem paths.

## Runtime Variables

- `DATABASE_PROVIDER`
- `DATABASE_URL`
- `POSTGRES_PRISMA_URL` is not required; this project uses `DATABASE_URL` for both providers.
- `DOCUMENT_STORAGE_DRIVER`
- `LOCAL_DOCUMENT_UPLOAD_DIR`
- `NODE_ENV`

## Preview Readiness

- Confirm admin login works with seeded local accounts.
- Confirm `npm run build` succeeds with no lingering `next build` process.
- Confirm file upload, download, and delete still work on local storage.
- Confirm `/admin` routes redirect to `/admin/login` when no session exists.
- Confirm admin-only mutations reject `STAFF` where expected.
- Confirm key mutations write audit log rows.

## Before Real Deployment

- Add one real remote document storage adapter.
- Provision managed Postgres and object storage credentials.
- Run Prisma migrations against the managed Postgres database before routing real traffic.
- Decide whether preview should use shared seed data or isolated environment data.
