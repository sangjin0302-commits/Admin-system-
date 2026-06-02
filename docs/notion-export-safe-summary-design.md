# Notion Safe Summary Export Design

## 1. Purpose

This document defines the first safe design boundary for manual one-way export from Admin System to Notion.

Core principles:

- Admin System is the primary system of record.
- Notion is review workspace and operational mirror.
- Export is manual only.
- Export is admin-only.
- First implementation is QA NON_CUSTOMER only.
- Export uses safe summary allowlist only.
- No automatic sync.
- No Notion to Admin import.
- No customer notification.
- No document generation.
- No payment update.
- No customer data export by default.

This is a design document only. It does not implement Notion API calls, Notion writes, env setup, route changes, DB schema, or production mutation.

## 2. First Implementation Candidate

Recommended first target:

- CaseMatter safe summary -> Notion `사건 관리`

Why:

- CaseMatter is already central in Admin System.
- Case summary is useful in Notion.
- Safer than customer or contact sync.
- Safer than accounting amount sync.
- Easier to test with a QA NON_CUSTOMER case.
- Mapping is already documented in `docs/notion-schema-mapping-snapshot.md`.

Not first:

- `고객 관리`
- `계약·결제 관리` with amounts
- `기한/일정 관리` automatic sync
- Document Lab file or export sync
- Two-way sync

## 3. Export Contract v0

Function-level contract candidate:

```ts
type NotionCaseSummaryExportInput = {
  caseMatterId: string;
  destination: "notion.case_management";
  actor: {
    id: string;
    role: "admin";
  };
  dryRun?: boolean;
};

type NotionCaseSummaryExportSuccess = {
  ok: true;
};

type NotionCaseSummaryExportFailure = {
  ok: false;
  errorCode: NotionSafeExportErrorCode;
};
```

Response must not include:

- Full CaseMatter object
- Notion token
- Raw Notion response
- Sensitive fields
- `internalMemo`
- `communicationLogs`
- Raw payload
- Stack trace

## 4. CaseMatter Safe Summary Allowlist v0

Allowed fields:

- `caseNo`
- `title`
- `matterTypeLabel`
- `status`
- `dueDate`
- `assignedTo`
- `safeSummary`
- `createdAt`
- `updatedAt`
- `adminCaseUrl`, internal only if safe
- `sourceTrackingCode`, if safe and non-sensitive

Not allowed:

- phone
- email
- full address
- passport number
- alien registration number
- resident registration number
- birthdate
- `internalMemo`
- `communicationLogs`
- raw inquiry body
- raw provider response
- uploaded files
- private Drive link
- actual file path
- immigration detail summaries containing sensitive facts
- family, residence, or employment details
- payment amount
- paid amount

Text fields must be generated as safe summaries. Do not copy raw customer input.

## 5. Notion `사건 관리` Mapping Draft

Use actual property names from the schema snapshot.

| Admin field | Notion property | Required | Policy |
| --- | --- | --- | --- |
| `caseNo` | 사건번호 | yes | Safe identifier |
| `title` | 사건명 | yes | Sanitized title only |
| `matterTypeLabel` | 업무분야 | yes | Select option mapping |
| `status` | 진행상태 | yes | Select option mapping |
| `dueDate` | 제출기한 | no | Date only |
| `assignedTo` | 담당자 | no | Role/person mapping later |
| `safeSummary` | 다음 액션 or safe summary property | no | Only sanitized summary |
| `adminCaseUrl` | external link property, if later added | no | Internal link only, optional |

If a Notion property does not exist:

- Do not create it automatically in the first implementation.
- Document the missing property.
- Fail safe for required fields.
- Skip optional fields.
- Return safe error code or dry-run warning.

## 6. Idempotency Policy

An idempotency key is required before broad usage to prevent duplicate Notion pages.

Candidate:

- `adminSystem:CaseMatter:{caseMatterId}:notionCaseManagement`

Alternatives:

- `caseNo`
- `caseMatterId`
- workspace + data source + `caseMatterId`

Policy:

- First implementation may be create-only for QA NON_CUSTOMER.
- Production must decide create-or-update before broad use.
- Duplicate detection should use stored export record or Notion property if available.
- Do not rely only on title search.

Open decision:

- Where to store Notion page URL or id?
  - CaseEvent payload
  - Future NotionExportLog
  - Future ExternalMirror table
  - Avoid DB schema until design is complete

## 7. Audit Event Shape

Every export should eventually create an audit event.

Candidate event:

- `NOTION_CASE_SUMMARY_EXPORTED`

Safe payload shape:

```json
{
  "destination": "notion.case_management",
  "exportedFieldKeys": ["caseNo", "title", "status", "dueDate"],
  "notionPageUrlPresent": true,
  "dryRun": false,
  "idempotencyKeyHashPresent": true
}
```

Do not store:

- Notion token
- Authorization header
- Full Notion response
- Full exported payload if it contains sensitive data
- Raw error stack with secrets
- Customer contact details

## 8. Dry-run Policy

Before real Notion write:

- Build export payload.
- Validate allowlist.
- Validate forbidden fields are absent.
- Validate Notion property mapping.
- Return safe dry-run summary.
- Perform no Notion write.

Dry-run output:

- destination
- field keys
- missing optional fields
- forbidden field check result
- `wouldCreate` or `wouldUpdate`, if known
- safe error code, if blocked

Dry-run output must not include sensitive values.

## 9. QA Policy

Preview or staging:

- QA NON_CUSTOMER case only.
- One export attempt per QA step.
- No retry without approval.
- Status/body capture only in safe shape.
- Notion destination confirmed.
- Notion token not printed.
- Notion page created/updated only if explicitly approved.

Production:

- Separate explicit approval.
- One QA NON_CUSTOMER case only.
- One export attempt.
- Verify Notion page exists.
- Verify no forbidden fields.
- Verify audit event.
- No real customer data.

## 10. Error Handling

Safe error codes:

- `NOTION_DESTINATION_NOT_CONFIGURED`
- `NOTION_SCHEMA_MISMATCH`
- `NOTION_FORBIDDEN_FIELD_BLOCKED`
- `NOTION_EXPORT_NOT_ALLOWED`
- `NOTION_API_FAILED`
- `NOTION_IDEMPOTENCY_CONFLICT`
- `CASE_NOT_FOUND`
- `CASE_NOT_SAFE_FOR_EXPORT`

Do not expose:

- Token
- Raw Notion response
- Full request body
- Stack trace
- Customer data

Expected policy blocks should return `ok: false` with safe error code, not unsafe exception payload.

## 11. Security / Env Policy

Future env vars may include:

- `NOTION_API_TOKEN`
- `NOTION_CASE_DATABASE_ID` or data source id
- `NOTION_EXPORT_ENABLED`

Policy:

- Never print env values.
- Never commit env files.
- Do not add env in this docs PR.
- Production env changes require separate approval.
- Preview env must be separate from production when testing writes.
- Fail closed if destination or token is missing.

## 12. Future Implementation Plan

Step 1:

- This design doc.

Step 2:

- Code constants only:
  - Allowlist
  - Forbidden field scanner
  - Mapping config
  - Tests
  - No Notion API call

Step 3:

- Dry-run service:
  - No Notion write
  - No production env required
  - Mocked destination in tests

Step 4:

- Admin-only manual export route:
  - Preview only
  - QA NON_CUSTOMER only
  - Response `{ ok: true }` or safe error shape
  - Basic Auth/admin protection reused

Step 5:

- Real Notion write:
  - One QA case
  - Explicit approval
  - Audit event
  - No automatic sync

Step 6:

- Expand only after safety pass.

## 13. PR Size Policy

Can bundle:

- Docs
- Mapping tables
- Allowlist constants
- Tests
- Dry-run view model

Must split:

- Notion API write
- Env/token setup
- Production write QA
- Database schema/migration
- Two-way sync
- Customer or sensitive data export

## 14. Related Docs

- Notion integration strategy: `docs/notion-integration-strategy.md`
- Notion schema mapping snapshot: `docs/notion-schema-mapping-snapshot.md`
- Product vision: `docs/admin-system-product-vision.md`
- Policy invariants: `docs/POLICY_INVARIANTS.md`
