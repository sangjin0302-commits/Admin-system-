import assert from "node:assert/strict";

import { buildCaseLedgerExportResponse } from "./route";
import type { CaseLedgerRow } from "@/lib/services/case-ledger-view-model";

function makeLedgerRow(overrides: Partial<CaseLedgerRow> = {}): CaseLedgerRow {
  return {
    caseId: "case_qa",
    caseNo: "20260512-CASECARD-001",
    receivedDate: "2026-05-12",
    openedDate: "2026-05-12",
    clientName: "QA NON_CUSTOMER",
    clientType: "QA",
    matterType: "case_card_qa",
    title: "QA NON_CUSTOMER Case Card Production Read-Only Test",
    summary: "QA-only export regression row",
    ledgerStatus: "OPEN",
    targetAgency: "QA Agency",
    submittedAt: "-",
    receiptNo: "-",
    hasSupplement: "-",
    resultReceivedAt: "-",
    closedAt: "-",
    assignedTo: "QA",
    note: "comma, quote \" and newline\nsafe",
    publicTrackingCode: "20260512-QA-0001",
    quoteStatus: "-",
    quoteAmountRange: "-",
    contractStatus: "-",
    feeStatus: "-",
    paymentStatus: "-",
    feeAmount: "-",
    paidAmount: "-",
    paidAt: "-",
    ledgerMemo: "-",
    accountingMemoExists: false,
    feeStatusCode: null,
    paymentStatusCode: null,
    feeAmountValue: null,
    paidAmountValue: null,
    paidAtValue: null,
    accountingFollowUpReasons: [],
    primaryAccountingFollowUpReason: null,
    needsAccountingFollowUp: false,
    ...overrides
  };
}

const rows = [
  makeLedgerRow({
    accountingMemoExists: false,
    feeStatusCode: "NOT_VALID",
    paymentStatusCode: "NOT_VALID",
    feeStatus: undefined as never,
    paymentStatus: null as never,
    paidAt: null as never
  }),
  makeLedgerRow({
    caseId: "case_paid_issue",
    caseNo: "=SUM(A1:A2)",
    title: "Paid but missing paidAt",
    accountingMemoExists: true,
    feeStatusCode: "CONFIRMED",
    paymentStatusCode: "PAID",
    feeAmountValue: 120000,
    paidAmountValue: 60000,
    paidAtValue: null,
    feeStatus: "confirmed",
    paymentStatus: "paid",
    paidAt: undefined as never
  })
];

async function main() {
  const response = buildCaseLedgerExportResponse(rows, "20260520");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/csv; charset=utf-8");
  assert.equal(
    response.headers.get("Content-Disposition"),
    'attachment; filename="case-ledger-20260520.csv"'
  );
  assert.equal(response.headers.get("Cache-Control"), "no-store");

  const body = Buffer.from(await response.arrayBuffer());
  assert.deepEqual([...body.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  const csv = body.toString("utf8");
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /20260512-CASECARD-001/);
  assert.match(csv, /QA NON_CUSTOMER Case Card Production Read-Only Test/);
  assert.match(csv, /"comma, quote "" and newline\nsafe"/);
  assert.match(csv, /"'=SUM\(A1:A2\)"/);

  const headerLine = csv.split(/\r?\n/)[0] ?? "";
  for (const forbiddenHeader of [
    "phone",
    "email",
    "internalMemo",
    "communicationLogs",
    "feeAmount",
    "paidAmount",
    "accountingFollowUpReason",
    "followUpReasonCode"
  ]) {
    assert.equal(headerLine.includes(forbiddenHeader), false, `forbidden CSV header: ${forbiddenHeader}`);
  }

  for (const forbiddenMarker of [
    "DATABASE_URL",
    "ADMIN_BASIC_AUTH_PASSWORD",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "communicationLogs",
    "internalMemo",
    "missing_accounting_memo",
    "payment_unpaid",
    "paid_amount_less_than_fee_amount"
  ]) {
    assert.equal(csv.includes(forbiddenMarker), false, `forbidden CSV marker: ${forbiddenMarker}`);
  }

  console.log("ledger export route tests passed");
}

void main();
