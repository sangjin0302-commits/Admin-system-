-- Migration: Add firstResponseAt to Inquiry for SLA tracking
-- Postgres syntax; sqlite dev uses schema.sqlite.prisma via prisma db push

ALTER TABLE "Inquiry" ADD COLUMN IF NOT EXISTS "firstResponseAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Inquiry_firstResponseAt_idx" ON "Inquiry"("firstResponseAt");
