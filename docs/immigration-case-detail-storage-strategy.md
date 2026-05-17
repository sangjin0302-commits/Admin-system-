# Immigration Case Detail Storage Strategy

## 1. Purpose

This document defines how Admin-system should store immigration and administrative appeal deadline values before adding admin input UI or database migrations.

The goal is to choose a storage strategy for vertical-specific values such as:

- `appealDeadline`
- `departureDeadline`
- `serviceDate`
- `stayExpiryDate`
- `supplementDeadline`
- `dispositionDate`

This is a design document only. It does not add schema, API, input UI, file upload, document generation, or production mutation.

## 2. Decision Summary

Recommended strategy: **Hybrid with `ImmigrationCaseDetail` plus `CaseMatter.dueDate` sync**.

The system should eventually add a vertical-specific `ImmigrationCaseDetail` model for structured immigration facts and deadlines. `CaseMatter.dueDate` should remain the operational next-deadline field used by dashboard and due-soon views.

`ImmigrationCaseDetail` should store non-sensitive structured fields. `CaseMatter.dueDate` should mirror the most important verified next deadline only when an admin explicitly saves or confirms that sync.

## 3. Storage Options

### A. `CaseMatter.dueDate` only

Store only the most important next deadline in `CaseMatter.dueDate`.

Pros:

- No migration.
- Existing dashboard and D-day flows can use it immediately.
- Simple operational model.

Cons:

- Cannot track multiple immigration-specific deadlines.
- Cannot distinguish service date, disposition date, departure deadline, and appeal deadline.
- Too weak for document draft inputs and audit.

Verdict:

- Useful for short-term operational D-day.
- Not enough for vertical detail storage.

### B. CaseEvent or note-based temporary management

Store deadline facts in CaseEvent, ledger memo, or internal note style text.

Pros:

- No migration.
- Can preserve some audit trail.

Cons:

- Not structured.
- Hard to validate, search, filter, or sync.
- Hard to use safely for document draft inputs.
- Notes can create accidental internal data exposure risk if reused in UI or exports.

Verdict:

- Not recommended for primary storage.
- Acceptable only as supporting audit text.

### C. Generic vertical metadata JSON

Store detail values in a generic JSON field if one already exists.

Pros:

- Flexible.
- Could support multiple verticals.
- Migration can be small if metadata does not yet exist.

Cons:

- Weak type safety.
- Date validation and query/filter behavior become harder.
- Sensitive data can be mixed into a generic blob.
- More difficult to enforce field-level policy.

Verdict:

- Consider only if a metadata field already exists and strict validation is added.
- If adding a new migration anyway, a dedicated model is safer.

### D. Dedicated `ImmigrationCaseDetail` model

Add a one-to-one model connected to `CaseMatter`.

Pros:

- Structured dates and facts.
- Better validation and admin UI design.
- Better audit and document automation inputs.
- Easier to keep sensitive identifiers out.
- Easier to connect to future dashboard filters.

Cons:

- Requires migration.
- Requires admin input API and validation.
- Requires concurrency and audit policy.

Verdict:

- Recommended long-term structure.

### E. Hybrid

Store immigration-specific facts in `ImmigrationCaseDetail`, then sync the most important verified deadline to `CaseMatter.dueDate`.

Pros:

- Preserves existing dashboard behavior.
- Supports multiple immigration deadlines.
- Gives document automation a safer structured input layer.
- Keeps sensitive identifiers out of the core model.

Cons:

- Needs clear sync policy.
- Needs migration and input flow.
- Needs tests around dueDate changes and audit events.

Verdict:

- Recommended strategy.

## 4. `ImmigrationCaseDetail` Model Draft

Future model draft:

```prisma
model ImmigrationCaseDetail {
  id                              String   @id @default(cuid())
  caseId                          String   @unique
  caseMatter                      CaseMatter @relation(fields: [caseId], references: [id], onDelete: Cascade)

  dispositionType                 String?
  dispositionDate                 DateTime?
  noticeDate                      DateTime?
  serviceDate                     DateTime?
  appealDeadline                  DateTime?
  departureDeadline               DateTime?
  detentionStartDate              DateTime?
  stayExpiryDate                  DateTime?
  submissionDeadline              DateTime?
  supplementDeadline              DateTime?
  resultExpectedDate              DateTime?

  nationality                     String?
  currentStayStatus               String?
  familyInKoreaSummary            String?
  residenceBaseSummary            String?
  employmentOrSchoolSummary       String?
  violationHistorySummary         String?

  scopeReviewRequired             Boolean  @default(true)
  attorneyScopeRisk               Boolean  @default(true)
  officialFormCheckRequired        Boolean  @default(true)
  deadlineVerifiedAt              DateTime?
  verifiedBy                      String?

  createdAt                       DateTime @default(now())
  updatedAt                       DateTime @updatedAt
}
```

Notes:

- Field names should match the existing deadline field map where possible.
- Store summary text, not raw files or identifiers.
- Do not store passport number, alien registration number, full address, or family member identifiers in this model.
- Add indexes only after real query requirements are clear.

## 5. `CaseMatter.dueDate` Sync Policy

`CaseMatter.dueDate` remains the operational next deadline.

Recommended priority:

1. `appealDeadline`
2. `departureDeadline`
3. `supplementDeadline`
4. `stayExpiryDate`
5. `submissionDeadline`

Policy:

- Sync only when an admin saves or confirms immigration detail values.
- Do not auto-confirm deadlines before original disposition document and service date are checked.
- UI should show a checkbox such as “CaseMatter dueDate에 반영”.
- If the checkbox is not selected, preserve existing `CaseMatter.dueDate`.
- If all candidate fields are empty, preserve existing `CaseMatter.dueDate` unless admin explicitly clears it.
- Every sync should create an audit event.

Rationale:

- The dashboard can continue using one due date.
- Immigration detail can keep multiple dates.
- Admin remains responsible for final date verification.

## 6. Sensitive Data Policy

Do not store these until encryption, access logs, retention policy, and file security are designed:

- passport number
- alien registration number
- full address
- family member identifiers
- raw violation record files
- uploaded disposition documents

Allowed early fields:

- nationality
- currentStayStatus
- date fields
- summary text
- boolean review flags
- verification timestamp
- verifier name

Rules:

- Store “confirmed/checked” status rather than raw identity values when possible.
- Keep sensitive file handling out of this phase.
- Do not expose immigration detail fields to public or customer-facing routes.

## 7. Admin Input UI Policy

Future UI location:

- `/admin/cases/[id]`
- Panel title: `출입국 세부정보`

Behavior:

- Admin-only.
- Read existing `ImmigrationCaseDetail`.
- Save through one PATCH endpoint.
- Response shape should be minimal: `{ ok: true }`.
- Use `expectedUpdatedAt` or equivalent concurrency guard.
- No raw payload echo.
- No `caseMatter`, `internalMemo`, `communicationLogs`, or provider internals in response.
- Show manual verification warnings for deadline fields.

Do not implement in this design PR:

- input fields
- save button
- PATCH endpoint
- schema migration
- automatic dueDate sync

## 8. Audit Policy

Future CaseEvent:

- `IMMIGRATION_CASE_DETAIL_UPDATED`

Event requirements:

- Record actor name.
- Record whether `CaseMatter.dueDate` was synced.
- Record field names changed, not raw sensitive values.
- Do not store raw request payload.
- Do not store passport number, alien registration number, or uploaded file content.

## 9. Dashboard Integration Policy

Phase 1:

- Dashboard reads only `CaseMatter.dueDate`.
- Immigration detail date fields display only on case detail.

Phase 2:

- Add due-soon filters for immigration detail fields only if operational need is proven.
- Keep `CaseMatter.dueDate` as the main cross-vertical deadline.

Phase 3:

- Consider immigration-specific dashboard cards:
  - appeal deadline soon
  - departure deadline soon
  - supplement deadline soon
  - unverified deadline fields

## 10. Document Automation Readiness

Safe structured inputs for admin-only document draft preview:

- dispositionType
- dispositionDate
- serviceDate
- appealDeadline
- departureDeadline
- stayExpiryDate
- nationality
- currentStayStatus
- summary fields
- RequiredDocument checklist status
- evidence list

Unsafe or deferred inputs:

- unique identity numbers
- raw violation records
- full uploaded documents
- family member identifiers
- unverified legal conclusions

Rules:

- Document automation starts with admin-only preview.
- No customer sending automation.
- No automatic agency submission.
- Official form freshness must be checked before export.
- Attorney scope risk and administrative scrivener scope must be shown.

## 11. Migration Roadmap

Recommended order:

1. Design doc. Done by this document.
2. Add `ImmigrationCaseDetail` model and migration.
3. Add admin-only read/write panel.
4. Add dueDate sync checkbox and audit event.
5. Add dashboard read model only after dueDate sync is stable.
6. Add document template registry integration.
7. Add file upload only after security design.

## 12. Current Non-Goals

Do not implement yet:

- DB schema or migration
- API route
- admin input UI
- production mutation
- customer-facing display
- file upload
- document generation
- HWP/DOCX/PDF export
- automatic dueDate sync
- passport number storage
- alien registration number storage
