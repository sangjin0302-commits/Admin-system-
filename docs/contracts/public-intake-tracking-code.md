# Public Intake Tracking Code Contract

## Current Scope

- Public intake may return a customer-facing `trackingCode` after a successful submit.
- The response must not return internal `inquiryId`, `caseId`, workflow status, Lawbot status, approval gates, draft bodies, or admin notes.
- The public completion UI may display the code as `접수번호`.
- The `/track` lookup page and API are intentionally not implemented in this phase.

## Code Format

Format:

```text
YYYYMMDD-CATEGORY-0000-CC
```

Category codes:

- `VI`: 비자
- `CO`: 법인
- `AP`: 행정심판
- `FC`: 사실조사 및 계약서 작성
- `PL`: 인허가
- `AR`: 아랍어 통번역
- `CP`: 기타 민원

The final check code uses at least two non-ambiguous characters and avoids `O`, `0`, `I`, and `1`.

## Storage Decision

Phase 1 stores the issued tracking code in `Inquiry.communicationLogs` as an internal log entry. This avoids a production schema dependency while preserving the code with the inquiry.

Long term, `/track` should use a dedicated indexed and unique database column, for example `Inquiry.publicTrackingCode String? @unique`, before public lookup is enabled. Searching JSON text in `communicationLogs` is acceptable for issuance display, but it is not the preferred lookup surface.

## Sequence Policy

The monthly sequence is currently calculated as the count of inquiries in the Korea-local month plus one. A random check code and retry reduce collision risk.

Before public tracking lookup ships, add a dedicated unique constraint or equivalent transactional allocation to close the race condition between concurrent submissions.

## Public Lookup Requirements

Future `/track` lookup must require both:

- `trackingCode`
- last four digits of the submitted phone number

The public tracking response must remain a safe DTO and must not expose internal ids, Lawbot status, approval gate data, draft content, admin notes, raw legal analysis, or reviewer-facing arrays.

