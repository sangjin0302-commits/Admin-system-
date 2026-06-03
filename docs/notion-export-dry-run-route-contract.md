# Notion Export Dry-run Route Contract

## 1. Purpose

This document defines the contract and safety rules for a future admin-only dry-run route before any real Notion export write is implemented.

Dry-run route goals:

- Verify export payload safety before writing to Notion.
- Block forbidden fields.
- Confirm idempotency key hash generation.
- Confirm destination mapping.
- Show admins safe result shape without writing to Notion.

Dry-run route must not:

- Call Notion API.
- Create or update Notion pages.
- Write to database.
- Mutate CaseMatter.
- Notify customer.
- Generate documents.
- Update payment state.

This document is contract-only. It does not implement a route.

## 2. Proposed Route

Candidate route:

- `POST /api/admin/case-matters/[id]/notion-export/dry-run`

Alternative route:

- `POST /api/admin/notion/export/dry-run`

Recommended first route:

- `POST /api/admin/case-matters/[id]/notion-export/dry-run`

Reason:

- Scope is clear.
- QA NON_CUSTOMER guard is easier.
- CaseMatter safe summary v0 already exists.
- Future Notion write remains isolated.

## 3. Access Control

Dry-run route requirements:

- Admin-only.
- Basic Auth/admin protection required.
- Unauthenticated request returns 401.
- Non-admin access blocked.

Future optional guards:

- Export feature flag.
- Environment-specific allowlist.
- QA-only guard.

## 4. Request Shape

Allowed request body:

```json
{
  "destination": "notion.case_management",
  "dryRun": true
}
```

Optional:

```json
{
  "destination": "notion.case_management",
  "dryRun": true,
  "includeAdminUrl": true
}
```

Forbidden request body fields:

- Client-provided export field values
- Client-provided Notion token
- Client-provided Notion database id
- Arbitrary payload
- Raw CaseMatter data
- Customer contact details

Rules:

- Server loads CaseMatter by id.
- Server builds allowlisted payload.
- Client body only chooses destination and dry-run mode.
- Unknown fields reject.
- `dryRun` must be `true`.

## 5. Response Shape

Success:

```json
{
  "ok": true,
  "dryRun": true,
  "wouldWrite": false,
  "destination": "notion.case_management",
  "entityType": "case_matter",
  "exportedFieldKeys": ["caseNo", "title", "status", "dueDate"],
  "forbiddenFieldCheck": {
    "ok": true,
    "blockedKeys": []
  },
  "idempotencyKeyHashPresent": true,
  "missingOptionalFields": []
}
```

Failure:

```json
{
  "ok": false,
  "dryRun": true,
  "wouldWrite": false,
  "errorCode": "NOTION_FORBIDDEN_FIELD_BLOCKED"
}
```

Response must not include:

- Full CaseMatter object
- Sensitive values
- `internalMemo`
- `communicationLogs`
- Raw payload
- Notion token
- Raw Notion response
- Stack trace
- Authorization header

## 6. Safe Error Codes

Allowed safe error codes:

- `CASE_NOT_FOUND`
- `CASE_NOT_SAFE_FOR_EXPORT`
- `NOTION_DESTINATION_NOT_CONFIGURED`
- `NOTION_SCHEMA_MISMATCH`
- `NOTION_FORBIDDEN_FIELD_BLOCKED`
- `NOTION_EXPORT_NOT_ALLOWED`
- `NOTION_DRY_RUN_ONLY`
- `NOTION_IDEMPOTENCY_CONFLICT`
- `UNAUTHORIZED`
- `INVALID_REQUEST`

Errors should be policy-safe and value-free.

## 7. QA NON_CUSTOMER Policy

Before preview or production testing:

- Target case must be QA/NON_CUSTOMER.
- Title or marker must clearly show QA/NON_CUSTOMER.
- No real customer data.
- No phone, email, or address.
- No `internalMemo` or `communicationLogs` in response.
- Dry-run response contains field keys only.

Production:

- Explicit approval required.
- One QA NON_CUSTOMER case only.
- One dry-run call.
- No Notion write.
- No production mutation other than read-only server computation.
- Response body must be captured only in safe shape.

## 8. Server-side Flow

Expected dry-run flow:

1. Verify admin auth.
2. Parse and validate request body.
3. Load CaseMatter by id with minimal select.
4. Check QA/NON_CUSTOMER guard, if enabled for test.
5. Build safe summary payload.
6. Scan forbidden fields.
7. Build idempotency key hash or redacted marker.
8. Build dry-run response.
9. Return safe JSON.

No Notion call.

## 9. Minimal Data Select

CaseMatter select should include only:

- `id`
- `caseNo`
- `title`
- `matterType`
- `status`
- `dueDate`
- `assignedTo`
- `createdAt`
- `updatedAt`
- source inquiry tracking code, if safe and existing

Do not select:

- `internalMemo`
- `communicationLogs`
- raw payload
- sensitive immigration detail summaries
- uploaded files
- payment memo
- amount fields

## 10. Validation Policy

Request validation:

- Strict schema.
- Destination enum only.
- `dryRun` must be `true`.
- Unknown fields reject.
- No arbitrary export fields.

Response validation:

- Only safe keys.
- No full entity.
- No forbidden strings.
- No secret or env markers.
- No raw stack trace.

## 11. Test Plan

Required tests when implemented:

- Unauthenticated route returns 401.
- Invalid body returns 400.
- Unknown destination rejected.
- `dryRun: false` rejected.
- Case not found returns safe 404.
- Non-QA case blocked in QA guard mode, if enabled.
- QA NON_CUSTOMER case returns ok dry-run.
- Response has `wouldWrite: false`.
- Response has exported field keys only.
- Forbidden fields absent.
- `internalMemo` and `communicationLogs` not selected or not returned.
- Idempotency hash present.
- No Notion API call mock invoked.
- No env required.
- Safe error shape.

## 12. Preview QA Plan

Preview dry-run only:

- Branch-specific safe env not required.
- No Notion token.
- Admin auth required.
- One QA NON_CUSTOMER dry-run call.
- Status/body split capture.
- Verify no forbidden fields.
- Verify no Notion page created.

## 13. Production QA Plan

Production dry-run:

- Explicit approval required.
- One QA NON_CUSTOMER case only.
- One dry-run call.
- No Notion write.
- No Notion token required.
- No production mutation.
- Verify response safe shape.
- Verify logs do not contain secrets.

## 14. What This Does Not Enable

Dry-run route does not enable:

- Notion export
- Notion write
- Notion sync
- Notion import
- Customer notification
- Document generation
- Payment update
- File upload/download
- Agency submission

## 15. Implementation Roadmap

Step 1:

- This contract doc.

Step 2:

- Dry-run route implementation.
- No Notion API.
- No env.
- No write.

Step 3:

- Admin UI dry-run button, optional.
- Still no Notion write.

Step 4:

- Notion write route design.
- Separate PR.

Step 5:

- Env/token setup.
- Separate PR.

Step 6:

- Preview QA Notion write.
- Separate approval.

Step 7:

- Production one-time QA write.
- Separate approval.

## 16. PR Size Policy

Can bundle:

- Route contract docs
- Test plan
- Response shape docs
- Safe error code docs

Must split:

- Route implementation
- UI button
- Notion API write
- Env/token setup
- Production write QA
- DB schema/migration
- Audit event implementation

## 17. Related Docs

- Notion integration strategy: `docs/notion-integration-strategy.md`
- Notion schema mapping snapshot: `docs/notion-schema-mapping-snapshot.md`
- Notion safe summary export design: `docs/notion-export-safe-summary-design.md`
- Policy invariants: `docs/POLICY_INVARIANTS.md`
