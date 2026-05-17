# Case Accounting Follow-up Runbook

## 1. Purpose

This runbook defines how to read and operate the case accounting follow-up status shown in `/admin/ledger` and the `/admin` dashboard.

Core rules:

- This feature is for internal operational review.
- It is not accounting or tax finalization material.
- It does not perform automatic billing, payment, or deposit confirmation.
- It does not send automatic notices to customers.

Use these labels as prompts for human review only. Do not treat them as a payment provider state, invoice state, tax filing state, or customer-facing conclusion.

## 2. Current UI Surfaces

Accounting follow-up appears in these admin-only surfaces:

- `/admin/ledger`
  - Accounting summary cards
  - Quick filter presets
  - Follow-up reason badges
  - Follow-up hints
- `/admin`
  - Compact `수임/입금 확인` card
- CSV export
  - Follow-up reason codes are not exported.
  - Amount columns remain excluded.
  - Phone, email, `internalMemo`, and `communicationLogs` remain excluded.

## 3. Follow-up Reason Codes

### `missing_accounting_memo`

- Label: `수임관리 메모 없음`
- Display condition: The case has no structured accounting memo.
- Operator check: Confirm whether fee and payment status have been recorded elsewhere and decide whether an accounting memo should be created.
- Caution: This does not mean there is no fee or no payment. It only means the admin accounting status is not structured here.
- No automatic handling: The system cannot infer contractual fee/payment state from missing memo alone.

### `fee_status_unset`

- Label: `수임료 상태 미확정`
- Display condition: Fee status is missing or unset.
- Operator check: Review contract, estimate, or internal case notes and update the accounting memo through the approved workflow.
- Caution: Do not interpret this as fee waived or fee confirmed.
- No automatic handling: Fee status requires human review of engagement context.

### `fee_status_pending`

- Label: `수임료 검토 중`
- Display condition: Fee status is pending or estimated.
- Operator check: Confirm whether fee terms are now fixed.
- Caution: Estimated or pending fee is not final accounting data.
- No automatic handling: The system does not finalize fee terms.

### `payment_status_unset`

- Label: `입금 상태 미확인`
- Display condition: Payment status is missing or unset.
- Operator check: Review the approved payment tracking source and update status if needed.
- Caution: Missing payment status is not evidence of non-payment.
- No automatic handling: Deposit confirmation is not performed automatically.

### `payment_unpaid`

- Label: `미입금`
- Display condition: Payment status is `UNPAID`.
- Operator check: Confirm whether follow-up is needed under office policy.
- Caution: This is an internal status, not an automated customer notice.
- No automatic handling: No billing, payment request, SMS, email, or AlimTalk is sent.

### `payment_partial`

- Label: `부분 입금`
- Display condition: Payment status is `PARTIAL`.
- Operator check: Confirm expected balance and next follow-up action.
- Caution: This runbook does not define receivable balance or tax treatment.
- No automatic handling: No invoice, receipt, or payment provider action is triggered.

### `paid_missing_paid_at`

- Label: `입금일 확인 필요`
- Display condition: Payment status is `PAID`, but paid date is missing.
- Operator check: Confirm the deposit date from the approved source.
- Caution: Paid status without paid date may be incomplete for internal operations.
- No automatic handling: The system does not infer paid date.

### `paid_amount_less_than_fee_amount`

- Label: `입금액 확인 필요`
- Display condition: Paid amount exists and is less than fee amount.
- Operator check: Confirm whether the case is partially paid, discounted, adjusted, or incorrectly recorded.
- Caution: This is a review hint only. It is not an accounting adjustment.
- No automatic handling: Amount discrepancies require human review.

### `unknown_fee_status`

- Label: `알 수 없는 수임료 상태`
- Display condition: Fee status is not one of the recognized values.
- Operator check: Inspect the source data and normalize it through the approved workflow.
- Caution: Unknown values should not be interpreted as confirmed or pending.
- No automatic handling: Unknown status is intentionally treated as review-needed.

### `unknown_payment_status`

- Label: `알 수 없는 입금 상태`
- Display condition: Payment status is not one of the recognized values.
- Operator check: Inspect the source data and normalize it through the approved workflow.
- Caution: Unknown values should not be interpreted as paid, unpaid, or partial.
- No automatic handling: Unknown status is intentionally treated as review-needed.

## 4. Filter Presets

`/admin/ledger` provides quick filters for internal review.

Recommended operating order:

1. `확인 필요`
2. `미입금`
3. `부분 입금`
4. `수임료 미확정`
5. `입금 완료`

### `전체`

- Includes: All rows after existing ledger filters are applied.
- Excludes: Nothing by accounting preset.
- Use when: You need full context or want to combine with date, status, matter type, or assignee filters.

### `확인 필요`

- Includes: Rows with at least one accounting follow-up reason.
- Excludes: Rows with no accounting follow-up reason.
- Use when: You want the main work queue for accounting review.

### `미입금`

- Includes: Rows with payment status `UNPAID`.
- Excludes: Missing/unknown payment status unless explicitly marked unpaid.
- Use when: You want a focused unpaid review list.

### `부분 입금`

- Includes: Rows with payment status `PARTIAL`, or rows where paid amount is lower than fee amount.
- Excludes: Fully paid rows without amount mismatch.
- Use when: You need to confirm balance or payment status.

### `수임료 미확정`

- Includes: Missing, unset, pending, or estimated fee status.
- Excludes: Confirmed fee rows.
- Use when: You need to finalize internal fee status.

### `입금 완료`

- Includes: Rows with payment status `PAID`.
- Excludes: Unpaid, partial, unset, or unknown payment status.
- Use when: You need to review completed payment state. If paid date or amount still needs review, a reason badge can still appear.

## 5. CSV Policy

Current CSV export policy:

- Amount columns are excluded.
- Phone and email are excluded.
- `internalMemo` and `communicationLogs` are excluded.
- Follow-up reason codes are excluded.
- UTF-8 BOM is kept.

Reasons:

- CSV files can be shared outside the admin UI, so the default export stays conservative.
- Amounts, contact details, and internal notes are not included by default.
- Accounting follow-up is an internal UI review aid, not exportable accounting evidence.

## 6. Safety / Compliance Notes

Do not use this feature as:

- Accounting finalization
- Tax filing material
- Automatic billing
- Automatic payment
- Automatic deposit confirmation
- Automatic customer notification
- Provider/send trigger

Recommended wording:

- `내부 관리용`
- `확인 필요`
- `검토 필요`
- `상태 확인`

Forbidden wording:

- `회계 확정`
- `세금 신고 완료`
- `자동 청구됨`
- `자동 결제됨`
- `입금 자동 확인됨`

## 7. Future Enhancements

Possible future work:

- `/admin` dashboard reason breakdown
- Sorting by reason
- Accounting memo edit history
- Payment follow-up task creation
- CSV export options, with separate approval
- Accounting or tax export, with separate policy and permission design
- Provider/payment integration as a long-term project

Each future item needs separate review for permissions, data exposure, mutation behavior, and customer-facing impact.

## 8. QA Checklist

GET-only QA:

- `/admin/ledger` returns 200.
- Accounting summary cards render.
- Quick filter presets render.
- Follow-up reason badges render.
- CSV export returns 200.
- CSV excludes forbidden fields.
- No mutation is executed.

Forbidden fields and markers:

- Phone
- Email
- `internalMemo`
- `communicationLogs`
- Secret or environment values
- Follow-up reason codes in CSV
- Amount headers in CSV

Production mutation:

- This runbook QA does not require production mutation.
- Do not use POST, PATCH, or DELETE while validating this runbook.
