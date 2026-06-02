# Notion Schema Mapping Snapshot

## 1. Purpose

This document records a read-only snapshot of the current Notion database schemas and maps them to Admin System safe export candidates.

Snapshot date: 2026-06-02

Rules:

- Admin System remains the primary system of record.
- Notion is a review workspace, operational mirror, and planning workspace.
- First implementation candidate is manual Admin -> Notion one-way export only.
- No Notion write, token setup, DB schema change, API change, production mutation, or customer data export in this phase.
- No automatic two-way sync.

## 2. Inspected Notion Databases

| Notion database | Data source id | Admin System entity | Initial policy |
| --- | --- | --- | --- |
| 상담/문의 관리 | `collection://5e89a3ea-ec71-4d27-bd97-f1b1fbf36e1a` | Inquiry / Intake | Safe inquiry summary candidate |
| 고객 관리 | `collection://5a123530-17fd-4e5a-8a09-b602913e88d3` | Future Client / CaseParty | Deferred until client security policy |
| 계약·결제 관리 | `collection://140f1e02-ce55-4426-abd5-5b71074135e5` | CaseAccountingMemo / Ledger | Accounting status summary only |
| 사건 관리 | `collection://33d2259a-f6de-425f-acd3-1514d0ceb7b6` | CaseMatter | First one-way export candidate |
| 기한/일정 관리 | `collection://fc91edd5-ad1d-431a-a3ff-b061f81c7104` | dueDate / CaseTask / SupplementRequest | Due date safe summary candidate |

Only schema and property metadata were inspected. No database rows were queried or exported.

## 3. Schema Snapshot

### 상담/문의 관리

Purpose:

- Review intake and consultation pipeline status.
- Track conversion from inquiry to case.

Key properties:

| Property | Type | Notes |
| --- | --- | --- |
| 문의명 | title | Candidate safe title, if non-sensitive |
| 문의유형 | select | 출입국/비자, 행정심판, 인허가, 영업정지/과징금, 보조금/지원금, 기타 민원 |
| 상담상태 | select | 신규 접수, 검토 중, 상담 예정, 상담 완료, 견적 발송, 사건 전환, 보류, 거절 |
| 상담등급 | select | A, B, C, 거절 |
| 긴급도 | select | 긴급, 높음, 보통, 낮음 |
| 유입경로 | select | 홈페이지, 블로그, 검색, 광고, 지인소개, 카페/커뮤니티, 전화, 기타 |
| 견적상태 | select | 미작성, 작성 중, 발송, 수락, 거절, 보류 |
| 문의일 | date | Safe if derived from Admin createdAt |
| 상담예정일 | date | Safe if operational only |
| 다음 연락일 | date | Use carefully; no direct customer contact export without approval |
| 사건전환 여부 | checkbox | Safe boolean candidate |
| 관련 고객 | relation | Deferred |
| 전환 사건 | relation | Later relation candidate |
| 상담 요약 | text | Safe summary only |
| 후속 액션 | text | Safe operational action only |
| 외부 접수 링크 | url | Admin link only if safe |

Forbidden by default:

- 문의자명
- 연락처
- 이메일
- 고객 요청사항
- 메모
- 거절/주의 사유, unless reviewed and sanitized
- Raw request body
- Communication logs

### 고객 관리

Purpose:

- Customer master workspace.
- Future relation target for cases and inquiries.

Key properties:

| Property | Type | Notes |
| --- | --- | --- |
| 고객명 | title | Sensitive by default |
| 고객 유형 | select | 개인, 법인, 외국인, 대리인, 기타 |
| 고객상태 | select | 신규, 상담 중, 수임 고객, 휴면, 거절/주의 |
| 고객등급 | select | A, B, C, 주의 |
| 사용 언어 | multi_select | 한국어, 영어, 중국어, 일본어, 아랍어, 러시아어, 기타 |
| 국적 | text | Sensitive by default |
| 최초 문의일 | date | Deferred |
| 최종 연락일 | date | Deferred |
| 다음 연락일 | date | Deferred |
| 개인정보 동의 | checkbox | Deferred |
| 마케팅 수신 동의 | checkbox | Deferred |
| 민감정보 보유 | checkbox | Sensitive control marker |
| 관련 사건 | relation | Deferred |

Forbidden by default:

- 고객명
- 연락처
- 이메일
- 카카오/텔레그램
- 국적
- 메모
- 주의 메모
- 보관/파기 메모
- Any client identifier or contact detail

Client export is not part of the first MVP.

### 계약·결제 관리

Purpose:

- Review contract, estimate, payment, and receivable state.
- Keep payment follow-up visible without exporting amounts or sensitive memo by default.

Key properties:

| Property | Type | Notes |
| --- | --- | --- |
| 계약/결제명 | title | Candidate safe title if case-safe |
| 구분 | select | 견적, 계약, 결제요청, 입금확인, 미수관리, 환불/취소, 기타 |
| 계약상태 | select | 미작성, 작성 중, 발송, 체결, 보류, 취소 |
| 결제상태 | select | 미청구, 청구, 입금 대기, 일부 입금, 완납, 연체/미수, 환불/취소 |
| 세금계산서/현금영수증 | select | 미발행, 발행 예정, 발행 완료, 해당 없음 |
| 결제수단 | select | 계좌이체, 카드/PG, 토스/결제링크, 현금, 기타 |
| 납부기한 | date | Safe only as deadline summary if reviewed |
| 담당자 | person | Optional, if mapped to safe internal role |
| 관련 상담/문의 | relation | Later relation candidate |
| 관련 고객 | relation | Deferred |
| 관련 사건 | relation | Later relation candidate |

Forbidden by default:

- 견적금액
- 계약금액
- 입금액
- 미수금
- 견적서 링크
- 계약 링크
- 결제 링크
- 입금증/증빙 링크
- 고객 안내 문구
- 내부 메모
- Payment provider payload
- Any customer contact or identifier

First safe export candidate is accounting follow-up status only: status labels, reason labels, and case-safe title/case number.

### 사건 관리

Purpose:

- Operational mirror for case progress review.
- Best first target for manual one-way export because Admin System already centers on CaseMatter.

Key properties:

| Property | Type | Notes |
| --- | --- | --- |
| 사건명 | title | Safe title if sanitized |
| 사건번호 | text | Safe case identifier candidate |
| 업무분야 | select | 출입국/비자, 행정심판, 인허가, 영업정지/과징금, 보조금/지원금, 기타 민원 |
| 세부유형 | text | Use label only, no sensitive fact details |
| 진행상태 | select | 상담 전, 견적, 계약 대기, 서류 수집, 작성 중, 제출 완료, 보완 대응, 종결, 보류/거절 |
| 서류상태 | select | 미요청, 요청 완료, 일부 수령, 수령 완료, 보완 필요 |
| 긴급도 | select | 긴급, 높음, 보통, 낮음 |
| 보안등급 | select | 일반, 민감, 고위험 |
| 계약상태 | select | 미작성, 발송, 체결, 보류, 취소 |
| 결제상태 | select | 미정, 견적 발송, 입금 대기, 일부 입금, 완납, 환불/취소 |
| 접수일 | date | Safe candidate |
| 제출기한 | date | Safe deadline candidate |
| 다음 액션 기한 | date | Safe deadline candidate |
| 다음 액션 | text | Safe summary only |
| 담당자 | person | Optional, if mapped safely |

Forbidden by default:

- 의뢰인명
- 연락처
- 이메일
- 메모
- 수임료
- Detailed facts
- Disposition or notice text
- Violation or offense details
- Family relation details
- Raw documents

### 기한/일정 관리

Purpose:

- Operational mirror for deadlines, visits, submissions, supplements, and follow-up.

Key properties:

| Property | Type | Notes |
| --- | --- | --- |
| 일정명 | title | Safe deadline title candidate |
| 일정유형 | select | 상담, 제출기한, 보완기한, 방문예약, 납부기한, 내부마감, 알림/후속연락, 기타 |
| 진행상태 | select | 예정, 진행 중, 완료, 연기, 취소 |
| 중요도 | select | 긴급, 높음, 보통, 낮음 |
| 일정일/마감일 | date | Safe deadline candidate |
| 완료 여부 | checkbox | Safe candidate |
| 알림 필요 | checkbox | Safe candidate if no notification is sent |
| 담당자 | person | Optional |
| 관련 상담/문의 | relation | Later relation candidate |
| 관련 고객 | relation | Deferred |
| 관련 사건 | relation | Later relation candidate |
| 제출처/방문처 | text | Use only official agency label, no sensitive details |
| 장소/기관 | text | Use only official agency label, no private address |
| 후속 액션 | text | Safe summary only |

Forbidden by default:

- 메모
- 준비물, unless sanitized
- Private address or customer location
- Customer relation export before client policy
- Sensitive fact details

## 4. Admin System to Notion Mapping

### CaseMatter -> 사건 관리

| Admin field | Notion property | Policy |
| --- | --- | --- |
| `caseNo` | 사건번호 | Allow |
| `title` | 사건명 | Allow only if sanitized |
| `matterType` label | 업무분야 | Allow |
| `status` | 진행상태 | Allow with option mapping |
| document request state | 서류상태 | Allow if derived from safe status |
| `dueDate` | 제출기한 | Allow |
| `nextActionAt` | 다음 액션 기한 | Allow |
| safe next action summary | 다음 액션 | Allow only sanitized text |
| risk/sensitivity label | 보안등급 | Allow label only |
| assigned role | 담당자 | Optional |

### Inquiry / Intake -> 상담/문의 관리

| Admin field | Notion property | Policy |
| --- | --- | --- |
| tracking code / safe title | 문의명 | Allow |
| inquiry type label | 문의유형 | Allow |
| inquiry status | 상담상태 | Allow with option mapping |
| created date | 문의일 | Allow |
| safe source label | 유입경로 | Allow |
| converted flag | 사건전환 여부 | Allow |
| safe consultation summary | 상담 요약 | Allow sanitized summary only |

### CaseAccountingMemo / Ledger -> 계약·결제 관리

| Admin field | Notion property | Policy |
| --- | --- | --- |
| case-safe title | 계약/결제명 | Allow if sanitized |
| accounting summary kind | 구분 | Allow |
| fee status label | 계약상태 | Allow label only |
| payment status label | 결제상태 | Allow label only |
| follow-up due date | 납부기한 | Optional |
| follow-up reason label | safe summary only | Deferred |

### Due Date / Task / SupplementRequest -> 기한/일정 관리

| Admin field | Notion property | Policy |
| --- | --- | --- |
| safe title | 일정명 | Allow |
| due date type | 일정유형 | Allow with option mapping |
| due status | 진행상태 | Allow |
| urgency | 중요도 | Allow |
| due date | 일정일/마감일 | Allow |
| completed flag | 완료 여부 | Allow |
| safe agency label | 제출처/방문처 | Optional |
| safe follow-up action | 후속 액션 | Allow sanitized summary only |

### Document Lab -> Notion planning only

Allowed metadata after separate approval:

- template id
- `titleKo`
- category
- risk level
- source verification status
- readiness status
- work queue reason label

Forbidden:

- File path
- Private Drive link
- HWP/HWPX/DOCX/PDF asset link
- Generated document
- Customer case data

## 5. Safe Export Allowlist

Global allowlist candidates:

- Public-safe identifiers such as `caseNo` or tracking code
- Sanitized title
- Status labels
- Category labels
- Risk labels
- Deadline dates
- Boolean workflow markers
- Safe summary written for operational review
- Admin internal role name, if approved
- Document Lab template metadata

Every exported text summary must be written as a safe summary, not copied from raw customer input.

## 6. Forbidden Fields

Forbidden by default:

- Phone number
- Email
- Address
- Passport number
- Alien registration number
- Resident registration number
- Birthdate, unless explicitly reviewed later
- Customer name, unless separate Client policy allows it
- Client nationality or language, unless separate policy allows it
- `internalMemo`
- `communicationLogs`
- Raw payload
- Raw provider response
- Secret, env, token, or header value
- Private Drive link
- Actual file path
- Uploaded file content
- Original notice/disposition text
- Family relation details
- Violation/offense details
- Payment amount
- Paid amount
- Contract amount
- Estimate amount
- Payment link
- Contract link
- Evidence link
- Generated document

## 7. Option Mapping Draft

### Case status to 사건 관리 진행상태

| Admin status | Notion option |
| --- | --- |
| intake / consultation | 상담 전 |
| quoted | 견적 |
| contract_pending | 계약 대기 |
| collecting_documents | 서류 수집 |
| drafting | 작성 중 |
| submitted | 제출 완료 |
| supplement_requested / supplementing | 보완 대응 |
| closed | 종결 |
| hold / rejected | 보류/거절 |

### Matter type to 업무분야

| Admin matter type | Notion option |
| --- | --- |
| immigration | 출입국/비자 |
| administrative_appeal | 행정심판 |
| licensing | 인허가 |
| business_suspension | 영업정지/과징금 |
| subsidy | 보조금/지원금 |
| general | 기타 민원 |

### Inquiry status to 상담/문의 관리 상담상태

| Admin inquiry status | Notion option |
| --- | --- |
| new | 신규 접수 |
| reviewing | 검토 중 |
| scheduled | 상담 예정 |
| completed | 상담 완료 |
| quote_sent | 견적 발송 |
| converted | 사건 전환 |
| hold | 보류 |
| rejected | 거절 |

### Accounting status to 계약·결제 관리

| Admin status | Notion property | Notion option |
| --- | --- | --- |
| not_billed | 결제상태 | 미청구 |
| billed | 결제상태 | 청구 |
| awaiting_payment | 결제상태 | 입금 대기 |
| partially_paid | 결제상태 | 일부 입금 |
| paid | 결제상태 | 완납 |
| overdue | 결제상태 | 연체/미수 |
| refunded_or_cancelled | 결제상태 | 환불/취소 |

### Deadline type to 기한/일정 관리 일정유형

| Admin due type | Notion option |
| --- | --- |
| consultation | 상담 |
| submission_due | 제출기한 |
| supplement_due | 보완기한 |
| visit | 방문예약 |
| payment_due | 납부기한 |
| internal_deadline | 내부마감 |
| follow_up | 알림/후속연락 |
| other | 기타 |

## 8. Relation Property Policy

Current relation properties exist across Notion databases, but first MVP should avoid relation writes unless separately reviewed.

Reason:

- Relation writes increase blast radius.
- Customer database is sensitive and deferred.
- Safe summaries can be useful without relations.
- Case links can be added later after explicit export audit.

Deferred:

- 고객 관리 relation writes
- Customer master export
- Notion-to-Admin sync

## 9. First One-way Export Priority

Recommended sequence:

1. CaseMatter safe summary -> 사건 관리
2. Inquiry safe summary -> 상담/문의 관리
3. Accounting follow-up safe summary -> 계약·결제 관리
4. Due date safe summary -> 기한/일정 관리
5. Customer management -> deferred until Client security policy

First implementation candidate:

- Manual admin-only one-way export for one QA NON_CUSTOMER CaseMatter safe summary.
- No scheduled sync.
- No Notion-to-Admin sync.
- No customer contact fields.
- No amounts.
- No document generation.
- No automatic notifications.
- Record audit event before any production write.

## 10. Safety Rules

Allowed:

- Read-only schema inspection.
- Docs-only mapping.
- Manual one-way export design.
- QA NON_CUSTOMER preview export in a future isolated PR.

Forbidden:

- Notion write in this docs phase.
- Notion-to-Admin automatic sync.
- Scheduled sync.
- Case mutation.
- Payment mutation.
- Customer mutation.
- Document generation.
- Customer notification.
- Agency submission.
- Secret or token exposure.

## 11. Open Questions

- Should Notion pages store Admin deep links, or only public-safe identifiers?
- Should `담당자` map to Notion person, plain text role, or be omitted?
- Should accounting safe summary use `계약·결제 관리` or remain only inside Admin ledger until audit design exists?
- Should relation properties wait until deterministic idempotency key design exists?
- Should a separate export audit table exist before first Notion write?

## 12. Validation Notes

This snapshot intentionally contains:

- Schema and property names
- Data source IDs
- Option labels
- Mapping policy

This snapshot intentionally excludes:

- Notion page row data
- Customer data
- Private Notion page URLs
- Private Drive links
- File paths
- Tokens or env values
