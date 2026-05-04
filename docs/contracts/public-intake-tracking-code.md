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

Phase 1 stored the issued tracking code in `Inquiry.communicationLogs` as an internal log entry. The lookup-ready phase stores the same code in dedicated `Inquiry` fields while preserving the log entry for audit and backward compatibility:

- `publicTrackingCode String? @unique`
- `publicTrackingPhoneLast4 String?`
- `publicTrackingIssuedAt DateTime?`

Admin display should prefer `publicTrackingCode` and fall back to the legacy communication log entry when the dedicated field is empty.

## Sequence Policy

The monthly sequence is currently calculated as the count of inquiries in the Korea-local month plus one. A random check code and unique-code retry reduce collision risk.

The count-based sequence can still race between concurrent submissions. The unique `publicTrackingCode` constraint keeps lookup keys unique, but a future transactional sequence allocator can make the monthly sequence itself deterministic under heavy concurrency.

## Public Lookup Requirements

Future `/track` lookup must require both:

- `trackingCode`
- last four digits of the submitted phone number

The public tracking response must remain a safe DTO and must not expose internal ids, Lawbot status, approval gate data, draft content, admin notes, raw legal analysis, or reviewer-facing arrays.
