# Vercel + Railway PostgreSQL + Cloudflare R2

## Roles

- Vercel hosts the Next.js admin app and serves the `/admin` UI and API routes.
- Railway PostgreSQL stores application data for preview and production environments.
- Cloudflare R2 stores uploaded files and document versions through the S3-compatible adapter.

## Runtime split

- Local development
  - `DATABASE_PROVIDER=sqlite`
  - `DATABASE_URL=file:...`
  - `DOCUMENT_STORAGE_DRIVER=local`
- Preview / production
  - `DATABASE_PROVIDER=postgresql`
  - `DATABASE_URL=<Railway PostgreSQL connection string>`
  - `DOCUMENT_STORAGE_DRIVER=r2`

## Vercel environment variables

- `DATABASE_PROVIDER=postgresql`
- `DATABASE_URL=postgresql://postgres:password@roundhouse.proxy.rlwy.net:5432/railway?sslmode=require`
- `PGSSL_REJECT_UNAUTHORIZED=false`
- `DOCUMENT_STORAGE_DRIVER=r2`
- `S3_BUCKET=<r2-bucket-name>`
- `S3_REGION=auto`
- `S3_ACCESS_KEY_ID=<r2-access-key-id>`
- `S3_SECRET_ACCESS_KEY=<r2-secret-access-key>`
- `S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com`
- `S3_FORCE_PATH_STYLE=true`

## Build flow

- Vercel runs `npm run build`.
- The `prebuild` hook runs `scripts/prepare-prisma-client.mjs`.
- When `DATABASE_PROVIDER=postgresql`, the project generates the PostgreSQL Prisma client before the Next.js build starts.
- Runtime Prisma connections use `@prisma/adapter-pg` with the Railway PostgreSQL `DATABASE_URL`.
- Railway Public/TCP Proxy certificates may require `PGSSL_REJECT_UNAUTHORIZED=false` unless you provide a trusted CA chain.

## Preview deployment checklist

1. Create the Railway PostgreSQL database and copy its connection string.
2. Create the R2 bucket and API token.
3. Add the environment variables above to the Vercel Preview environment.
4. Trigger a preview deployment.
5. Verify `/admin/login`, inquiry detail pages, file upload, file download, and audit log writes.

## Future Railway worker expansion

- A future Railway worker service such as `issue-bot-worker` can reuse:
  - the same `DATABASE_URL`
  - the same `DOCUMENT_STORAGE_DRIVER=r2`
  - the same R2 credentials
- Keep worker-only queues, cron jobs, or background automation out of the Vercel request path.
- The current app remains Vercel-only; Railway is DB-first today and worker-ready later.
