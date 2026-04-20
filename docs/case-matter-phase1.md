# CaseMatter Phase 1 (Transitional)

This phase keeps the existing `Inquiry -> Quote -> CaseRecord` flow alive while introducing a stable `CaseMatter` root for the next stages.

## Implemented in this phase

1. Prisma additive expansion
- `CaseMatter`, `CaseParty`, `RequiredDocument`, `CaseDocument`, `DocumentVersion`
- `SubmissionPackage`, `SubmissionPackageItem`, `AgencySubmission`, `SupplementRequest`
- `CaseTask`, `CaseEvent`

2. Seed extension
- Added `seedCaseMatterFlow()` with migration-safe sample records.
- Legacy seed paths still run.

3. New conversion and query service
- `src/lib/services/case-matter-service.ts`
- Converts an inquiry into a case matter with event/task bootstrap.
- Reuses accepted quote/contract draft linkage when available.
- Returns computed next action snapshot.

4. New admin API endpoint
- `GET /api/admin/inquiries/:id/case-matters`
- `POST /api/admin/inquiries/:id/case-matters`

5. Operational next-action engine
- `src/lib/services/case-matter-next-action-helpers.ts`
- Handles supplement overdue, task overdue, doc follow-up, review, submission and closure hints.

6. Local smoke stability fix
- `scripts/smoke-admin-runtime-local.mjs`
- Clears timeout handles so successful runs do not appear stuck.

7. Case status transition guard and mutation API
- `src/lib/services/case-matter-status-transition-helpers.ts`
- `PATCH /api/admin/case-matters/:id/status`
- Enforces allowed transition map, optimistic concurrency (`expectedUpdatedAt`), and writes `CASE_STATUS_CHANGED` events.

## Immediate follow-up (Phase 2)

1. Add `/admin/cases` list and `/admin/cases/[id]` detail pages.
2. Split case detail tabs by:
- overview
- documents
- submissions
- supplements
- tasks
- billing
- AI snapshots
3. Move dashboard primary counters from inquiry-first to case-first.
4. Add state transition guards for `RequiredDocumentStatus`.
5. Add integration tests for inquiry-to-case conversion and next-action rules.
