import assert from "node:assert/strict";

import {
  buildAccountingReasonBreakdown,
  buildCaseAccountingSummaryViewModel,
  filterLedgerRowsByAccountingPreset,
  getAccountingFollowUpReasons,
  getAccountingPresetLabel,
  getPrimaryAccountingFollowUpReason,
  isCaseAccountingFollowUpRow,
  listAccountingFilterPresets,
  normalizeAccountingFilterPreset,
  type CaseAccountingSummaryInputRow
} from "@/lib/services/case-accounting-summary-view-model";

function row(overrides: Partial<CaseAccountingSummaryInputRow> = {}): CaseAccountingSummaryInputRow {
  return {
    caseId: "case_1",
    caseNo: "CASE-1",
    title: "QA NON_CUSTOMER accounting summary case",
    accountingMemoExists: true,
    feeStatusCode: "CONFIRMED",
    paymentStatusCode: "PAID",
    feeAmountValue: 100000,
    paidAmountValue: 100000,
    paidAtValue: "2026-05-17",
    ...overrides
  };
}

const empty = buildCaseAccountingSummaryViewModel([]);
assert.equal(empty.totalCases, 0);
assert.equal(empty.followUpCount, 0);

const summary = buildCaseAccountingSummaryViewModel([
  row(),
  row({
    caseId: "case_no_memo",
    caseNo: "NO-MEMO",
    accountingMemoExists: false,
    feeStatusCode: null,
    paymentStatusCode: null
  }),
  row({
    caseId: "case_pending",
    caseNo: "PENDING",
    feeStatusCode: "PENDING",
    paymentStatusCode: "UNSET"
  }),
  row({
    caseId: "case_unpaid",
    caseNo: "UNPAID",
    paymentStatusCode: "UNPAID"
  }),
  row({
    caseId: "case_partial",
    caseNo: "PARTIAL",
    paymentStatusCode: "PARTIAL",
    paidAmountValue: 50000
  }),
  row({
    caseId: "case_missing_paid_at",
    caseNo: "MISSING-PAID-AT",
    paymentStatusCode: "PAID",
    paidAtValue: null
  }),
  row({
    caseId: "case_unknown",
    caseNo: "UNKNOWN",
    feeStatusCode: "NOT_VALID",
    paymentStatusCode: "NOT_VALID"
  })
]);
const rows = [
  row(),
  row({
    caseId: "case_no_memo",
    caseNo: "NO-MEMO",
    accountingMemoExists: false,
    feeStatusCode: null,
    paymentStatusCode: null
  }),
  row({
    caseId: "case_pending",
    caseNo: "PENDING",
    feeStatusCode: "PENDING",
    paymentStatusCode: "UNSET"
  }),
  row({
    caseId: "case_unpaid",
    caseNo: "UNPAID",
    paymentStatusCode: "UNPAID"
  }),
  row({
    caseId: "case_partial",
    caseNo: "PARTIAL",
    paymentStatusCode: "PARTIAL",
    paidAmountValue: 50000
  }),
  row({
    caseId: "case_missing_paid_at",
    caseNo: "MISSING-PAID-AT",
    paymentStatusCode: "PAID",
    paidAtValue: null
  }),
  row({
    caseId: "case_unknown",
    caseNo: "UNKNOWN",
    feeStatusCode: "NOT_VALID",
    paymentStatusCode: "NOT_VALID"
  })
];

const summaryFromRows = buildCaseAccountingSummaryViewModel(rows);

assert.equal(summary.totalCases, 7);
assert.equal(summary.feeConfirmedCount, 4);
assert.equal(summary.feePendingCount, 1);
assert.equal(summary.feeUnsetCount, 2);
assert.equal(summary.paymentUnpaidCount, 1);
assert.equal(summary.paymentPartialCount, 1);
assert.equal(summary.paymentPaidCount, 2);
assert.equal(summary.paymentUnsetCount, 3);
assert.equal(summary.followUpCount, 6);
assert.deepEqual(
  summary.followUpReasonBreakdown.map((item) => item.code),
  [
    "payment_status_unset",
    "payment_unpaid",
    "fee_status_unset",
    "missing_accounting_memo",
    "paid_amount_less_than_fee_amount"
  ]
);
assert.equal(summary.followUpReasonBreakdown.every((item) => item.count > 0), true);
assert.equal(summary.followUpReasonBreakdown.every((item) => item.href.startsWith("/admin/ledger?accountingPreset=")), true);
assert.ok(summary.followUpItems.some((item) => item.reason.includes("수임/입금 메모 없음")));
assert.ok(summary.followUpItems.some((item) => item.reason.includes("수임료 확정 전")));
assert.ok(summary.followUpItems.some((item) => item.reason.includes("미입금 확인 필요")));
assert.ok(summary.followUpItems.some((item) => item.reason.includes("부분 입금 확인 필요")));
assert.ok(summary.followUpItems.some((item) => item.reason.includes("입금 완료일 확인 필요")));
assert.ok(summary.followUpItems.some((item) => item.reason.includes("입금액이 수임료보다 작음")));
assert.ok(summary.followUpItems.some((item) => item.reason.includes("수임료 상태 확인 필요")));
assert.ok(summary.followUpItems.some((item) => item.reason.includes("입금 상태 확인 필요")));

assert.deepEqual(
  listAccountingFilterPresets().map((item) => item.preset),
  ["all", "needs_follow_up", "unpaid", "partial", "fee_unset_or_pending", "paid"]
);
assert.equal(getAccountingPresetLabel("needs_follow_up"), "확인 필요");
assert.equal(normalizeAccountingFilterPreset("not-valid"), "all");
assert.equal(filterLedgerRowsByAccountingPreset(rows, "all").length, rows.length);
assert.equal(filterLedgerRowsByAccountingPreset(rows, "needs_follow_up").length, summaryFromRows.followUpCount);
assert.equal(filterLedgerRowsByAccountingPreset(rows, "needs_follow_up").every(isCaseAccountingFollowUpRow), true);
assert.deepEqual(
  filterLedgerRowsByAccountingPreset(rows, "unpaid").map((item) => item.caseNo),
  ["UNPAID"]
);
assert.deepEqual(
  filterLedgerRowsByAccountingPreset(rows, "partial").map((item) => item.caseNo),
  ["PARTIAL"]
);
assert.deepEqual(
  filterLedgerRowsByAccountingPreset(rows, "fee_unset_or_pending").map((item) => item.caseNo),
  ["NO-MEMO", "PENDING", "UNKNOWN"]
);
assert.deepEqual(
  filterLedgerRowsByAccountingPreset(rows, "paid").map((item) => item.caseNo),
  ["CASE-1", "MISSING-PAID-AT"]
);
assert.deepEqual(getAccountingFollowUpReasons(rows[0]).map((item) => item.code), []);
assert.deepEqual(getAccountingFollowUpReasons(rows[1]).map((item) => item.code), [
  "missing_accounting_memo",
  "fee_status_unset",
  "payment_status_unset"
]);
assert.deepEqual(getAccountingFollowUpReasons(rows[2]).map((item) => item.code), [
  "fee_status_pending",
  "payment_status_unset"
]);
assert.deepEqual(getAccountingFollowUpReasons(rows[3]).map((item) => item.code), ["payment_unpaid"]);
assert.deepEqual(getAccountingFollowUpReasons(rows[4]).map((item) => item.code), [
  "payment_partial",
  "paid_amount_less_than_fee_amount"
]);
assert.deepEqual(getAccountingFollowUpReasons(rows[5]).map((item) => item.code), ["paid_missing_paid_at"]);
assert.deepEqual(getAccountingFollowUpReasons(rows[6]).map((item) => item.code), [
  "unknown_fee_status",
  "unknown_payment_status"
]);
assert.equal(getPrimaryAccountingFollowUpReason(rows[3])?.code, "payment_unpaid");
assert.equal(
  filterLedgerRowsByAccountingPreset(rows, "needs_follow_up").every(
    (item) => getAccountingFollowUpReasons(item).length > 0
  ),
  true
);
assert.deepEqual(
  buildAccountingReasonBreakdown(rows, 2).map((item) => item.code),
  ["payment_status_unset", "payment_unpaid"]
);
assert.deepEqual(buildAccountingReasonBreakdown(rows, 0), []);

const serialized = JSON.stringify(summary);
assert.equal(serialized.includes("세금 신고 완료"), false);
assert.equal(serialized.includes("회계 확정"), false);
assert.equal(serialized.includes("자동 청구"), false);
assert.equal(serialized.includes("자동 결제"), false);
assert.equal(serialized.includes("자동 입금 확인"), false);
assert.equal(serialized.includes("세무 확정 판단"), false);

console.log("case accounting summary view model tests passed");
