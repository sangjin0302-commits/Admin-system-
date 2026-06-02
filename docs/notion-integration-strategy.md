# Notion Integration Strategy

## 1. Purpose

This document defines how Admin System and the Notion workspace should share responsibilities, map data, phase integration, and enforce safety policy.

Core principles:

- Admin System is the primary system of record.
- Notion is a review workspace, operational mirror, and planning workspace.
- The first allowed direction is one-way export only.
- Automatic two-way sync is not allowed.
- Customer sensitive data, contact details, internal memo, and raw payload are not exported to Notion by default.
- Notion write is allowed only after explicit admin approval.

## 2. Current Notion Workspace Structure

User-provided Notion root page:

- `고객 및 사건 정보`

Child databases:

1. `상담/문의 관리`
2. `고객 관리`
3. `계약·결제 관리`
4. `사건 관리`
5. `기한/일정 관리`

Admin System mapping:

| Notion database | Admin System source |
| --- | --- |
| `상담/문의 관리` | Inquiry / Intake |
| `고객 관리` | Client / CaseParty candidate |
| `계약·결제 관리` | CaseAccountingMemo / Ledger |
| `사건 관리` | CaseMatter |
| `기한/일정 관리` | dueDate / CaseTask / SupplementRequest |

## 3. Recommended System Boundary

Admin System owns:

- Intake
- Case conversion
- Case detail
- Immigration detail
- dueDate sync
- Ledger / accounting operations
- CSV export
- Document Lab
- Audit and safety controls

Notion owns:

- Operational review views
- Work boards
- Documentation and planning notes
- Customer/case safe-summary mirror
- Manual review dashboards
- Meeting and consultation notes
- Internal task planning

Forbidden:

- Using Notion as the primary database
- Triggering production writes directly from Notion
- Automatically applying Notion changes back into Admin System
- Bulk-exporting customer information
- Storing secrets, env values, or tokens in Notion

## 4. Phase 1: Docs-only Mapping

This phase only documents:

- Data mapping tables
- Safe and forbidden fields
- Export targets
- MVP usage purpose per Notion database

No implementation in this phase.

## 5. Phase 2: Manual One-way Export MVP

First implementation candidate:

- Admin System to Notion one-way manual export
- Executed only by an admin pressing an explicit action
- Sends safe summaries only
- Returns `{ ok: true }`
- Records an event or audit entry
- Does not run automatic sync

Recommended first targets:

1. CaseMatter safe summary to Notion `사건 관리`
2. Inquiry safe summary to Notion `상담/문의 관리`
3. Accounting follow-up summary to Notion `계약·결제 관리`
4. Due date summary to Notion `기한/일정 관리`

Initial implementation priority:

- CaseMatter safe summary export
- Single QA NON_CUSTOMER case in preview or staging
- Production write only after separate approval

## 6. Safe Export Fields

CaseMatter safe summary:

- `caseNo`
- `title`
- `matterType` label
- `status`
- `dueDate`
- `nextActionAt`, if exists
- `assignedTo`
- source inquiry `trackingCode`, if non-sensitive
- public-safe summary
- `createdAt`
- `updatedAt`

Inquiry safe summary:

- `trackingCode`
- inquiry title
- category
- requested inquiry type
- status
- `createdAt`
- source path/content id, if safe
- no phone/email by default

Accounting safe summary:

- `caseNo`
- `title`
- `feeStatus`
- `paymentStatus`
- follow-up reason labels
- no amount by default
- no internal memo
- no payment memo unless explicitly allowed later

Due date safe summary:

- `caseNo`
- `title`
- `dueDate`
- deadline type
- due status
- no sensitive fact details

Document Lab safe summary:

- template id
- `titleKo`
- category
- `riskLevel`
- source status
- readiness status
- no file path
- no private Drive link

## 7. Forbidden Export Fields

Forbidden by default:

- phone
- email
- full address
- passport number
- alien registration number
- resident registration number
- birthdate, unless explicitly reviewed later
- `internalMemo`
- `communicationLogs`
- raw payload
- raw provider response
- secret/env/header
- private Drive link
- actual file path
- uploaded file content
- original disposition or notice text
- family relation details
- violation/offense details
- payment amount, initially
- paid amount, initially

## 8. Notion Database Mapping Draft

### 상담/문의 관리

Admin source:

- Inquiry / Intake

Potential properties:

- 문의명 ← inquiry title
- 문의유형 ← category/requestedInquiryType mapping
- 상담상태 ← inquiry status mapping
- 긴급도 ← due/urgency, if known
- 문의일 ← `createdAt`
- 외부 접수 링크 ← Admin public tracking or admin link, only if safe
- 사건전환 여부 ← converted boolean
- 상담 요약 ← safe summary only

Do not export by default:

- contact number
- email
- raw request body
- communication logs

### 고객 관리

Admin source:

- Future Client / CaseParty

Current policy:

- Do not sync until client master/security policy exists.
- Do not create customer records automatically from raw inquiry data.

### 계약·결제 관리

Admin source:

- CaseAccountingMemo / Ledger

Potential properties:

- `caseNo`
- title
- `feeStatus`
- `paymentStatus`
- follow-up reason
- internal accounting status

Do not export by default:

- `feeAmount`
- `paidAmount`
- `paymentMemo`
- `invoiceMemo`
- `internalMemo`

### 사건 관리

Admin source:

- CaseMatter

Potential properties:

- `caseNo`
- title
- `matterType`
- status
- `dueDate`
- `assignedTo`
- current phase
- safe checklist status
- Notion page URL back-reference, later

Do not export:

- raw immigration details
- sensitive family/residence/employment summaries
- uploaded files

### 기한/일정 관리

Admin source:

- CaseMatter.dueDate
- CaseTask
- SupplementRequest
- ImmigrationCaseDetail deadline fields, only as safe summary

Potential properties:

- title
- `caseNo`
- deadline date
- deadline type
- status
- owner
- link back to Admin case

Do not export:

- detailed legal reasoning
- raw disposition text
- sensitive evidence details

## 9. Sync Direction Policy

Allowed initially:

- Admin System to Notion
- Manual one-way export
- QA NON_CUSTOMER only until approved
- Safe summaries only

Not allowed:

- Notion to Admin System automatic sync
- Automatic scheduled sync
- Automatic customer record creation
- Automatic case mutation
- Automatic payment status update
- Automatic document generation
- Automatic customer notification

Future possible direction:

- Notion import dry-run
- Conflict report
- Admin review
- Approved import
- Audit log

## 10. Audit Policy

Every future Notion export should record:

- source entity id
- destination Notion database
- destination Notion page id/url
- exported fields allowlist version
- actor
- timestamp
- result
- safe error code, if failed

Do not log:

- Notion token
- authorization header
- full payload containing sensitive data

## 11. Implementation Roadmap

### Step 1. Mapping docs

This document.

### Step 2. Notion schema fetch/confirm

- Inspect exact database schemas.
- Document property names and option mappings.
- No writes.

### Step 3. Safe export allowlist

- Add code constants for export field allowlists.
- Add tests.
- No Notion API call yet.

### Step 4. Manual export draft route, staging only

- Admin-only route.
- One entity type only, likely CaseMatter.
- QA NON_CUSTOMER only.
- Response `{ ok: true }`.
- No production write until approved.

### Step 5. Production one-way export

- One QA case only.
- Explicit approval.
- Audit event.
- No automatic sync.

### Step 6. Expand carefully

- Inquiry
- CaseMatter
- Accounting follow-up
- Due date summary
- Document Lab summary

## 12. PR Size Policy

Can bundle:

- Docs
- Mapping tables
- Allowlist constants
- Tests
- Read-only UI markers

Must split:

- Notion API write route
- env/token setup
- production write QA
- schema/migration
- two-way sync
- customer/sensitive data export

## 13. Safety Checklist

Before any Notion write:

- Confirm destination database.
- Confirm schema.
- Confirm field allowlist.
- Confirm no forbidden fields.
- Confirm QA NON_CUSTOMER data.
- Confirm actor.
- Confirm audit plan.
- Confirm no automatic sync.
- Confirm token not logged.
- Confirm error body safe.
