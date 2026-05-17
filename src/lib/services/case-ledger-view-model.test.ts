import assert from "node:assert/strict";

import {
  buildCaseLedgerCsv,
  buildCaseLedgerRow,
  buildCaseLedgerViewModel,
  caseLedgerRowToCsvCells,
  mapCaseMatterStatusToLedgerStatus,
  type CaseLedgerSource
} from "./case-ledger-view-model";

function d(value: string) {
  return new Date(value);
}

function makeCaseMatter(overrides: Partial<CaseLedgerSource> = {}): CaseLedgerSource {
  return {
    id: "case_1",
    caseNo: "20260512-CASECARD-001",
    title: "QA NON_CUSTOMER Case Card Production Read-Only Test",
    matterType: "case_card_qa",
    status: "SUPPLEMENT_REQUESTED",
    riskLevel: "NORMAL",
    priority: "NORMAL",
    inquiryId: "inq_1",
    legacyCaseRecordId: null,
    openedAt: d("2026-05-12T00:00:00.000Z"),
    closedAt: null,
    dueDate: null,
    nextActionAt: null,
    assignedTo: "QA",
    summary: "Generated case summary",
    createdAt: d("2026-05-12T01:00:00.000Z"),
    updatedAt: d("2026-05-13T01:00:00.000Z"),
    inquiry: {
      id: "inq_1",
      createdAt: d("2026-05-05T02:00:00.000Z"),
      contactName: "Fallback Client",
      organizationName: "Fallback Org",
      inquiryType: "FACT_CONTRACT",
      requestedOutcome: "Requested outcome",
      targetAgency: "Inquiry Agency",
      publicTrackingCode: "20260505-FC-0003-NM"
    },
    parties: [
      {
        role: "CLIENT",
        name: "Client Name",
        organization: "Client Org"
      }
    ],
    submissionPackages: [
      {
        targetAgency: "Package Agency",
        updatedAt: d("2026-05-10T00:00:00.000Z")
      }
    ],
    submissions: [
      {
        agencyName: "Submission Agency",
        submittedAt: d("2026-05-11T00:00:00.000Z"),
        receiptNo: "R-001",
        resultStatus: "접수",
        resultReceivedAt: d("2026-05-12T00:00:00.000Z"),
        updatedAt: d("2026-05-12T00:00:00.000Z")
      }
    ],
    supplementRequests: [
      {
        status: "DOCS_REQUESTED",
        dueDate: d("2026-05-14T00:00:00.000Z"),
        updatedAt: d("2026-05-13T00:00:00.000Z")
      }
    ],
    events: [
      {
        eventType: "CASE_CLOSED",
        createdAt: d("2026-05-20T00:00:00.000Z")
      }
    ],
    quotes: [
      {
        status: "ACCEPTED",
        totalMin: 100000,
        totalMax: 150000,
        updatedAt: d("2026-05-06T00:00:00.000Z")
      }
    ],
    contractDrafts: [
      {
        status: "FINALIZED",
        updatedAt: d("2026-05-07T00:00:00.000Z")
      }
    ],
    accountingMemo: {
      feeAmount: 120000,
      feeStatus: "CONFIRMED",
      paymentStatus: "PARTIAL",
      paidAmount: 60000,
      paidAt: d("2026-05-13T00:00:00.000Z"),
      ledgerMemo: "Accounting memo"
    },
    ...overrides
  } as CaseLedgerSource;
}

const fullRow = buildCaseLedgerRow(makeCaseMatter());
assert.equal(fullRow.caseId, "case_1");
assert.equal(fullRow.caseNo, "20260512-CASECARD-001");
assert.equal(fullRow.receivedDate, "2026-05-05");
assert.equal(fullRow.openedDate, "2026-05-12");
assert.equal(fullRow.clientName, "Client Name");
assert.equal(fullRow.clientType, "기관/법인");
assert.equal(fullRow.matterType, "case_card_qa");
assert.equal(fullRow.ledgerStatus, "보완 중");
assert.equal(fullRow.targetAgency, "Submission Agency");
assert.equal(fullRow.submittedAt, "2026-05-11");
assert.equal(fullRow.receiptNo, "R-001");
assert.equal(fullRow.hasSupplement, "있음");
assert.equal(fullRow.resultReceivedAt, "2026-05-12");
assert.equal(fullRow.closedAt, "2026-05-20");
assert.equal(fullRow.assignedTo, "QA");
assert.equal(fullRow.publicTrackingCode, "20260505-FC-0003-NM");
assert.equal(fullRow.quoteStatus, "ACCEPTED");
assert.equal(fullRow.quoteAmountRange, "100,000~150,000원");
assert.equal(fullRow.contractStatus, "FINALIZED");
assert.equal(fullRow.feeStatus, "확정");
assert.equal(fullRow.paymentStatus, "일부 입금");
assert.equal(fullRow.feeAmount, "120,000원");
assert.equal(fullRow.paidAmount, "60,000원");
assert.equal(fullRow.paidAt, "2026-05-13");
assert.equal(fullRow.ledgerMemo, "Accounting memo");
assert.equal(fullRow.needsAccountingFollowUp, true);
assert.equal(fullRow.primaryAccountingFollowUpReason?.code, "payment_partial");
assert.equal(
  fullRow.accountingFollowUpReasons.some((reason) => reason.code === "paid_amount_less_than_fee_amount"),
  true
);

const inquiryFallbackRow = buildCaseLedgerRow(
  makeCaseMatter({
    parties: [],
    submissions: [],
    submissionPackages: []
  })
);
assert.equal(inquiryFallbackRow.clientName, "Fallback Client");
assert.equal(inquiryFallbackRow.targetAgency, "Inquiry Agency");
assert.equal(inquiryFallbackRow.submittedAt, "-");
assert.equal(inquiryFallbackRow.receiptNo, "-");

const packageFallbackRow = buildCaseLedgerRow(
  makeCaseMatter({
    submissions: []
  })
);
assert.equal(packageFallbackRow.targetAgency, "Package Agency");

const emptyFallbackRow = buildCaseLedgerRow(
  makeCaseMatter({
    inquiry: null,
    parties: [],
    submissions: [],
    submissionPackages: [],
    supplementRequests: [],
    quotes: [],
    contractDrafts: [],
    accountingMemo: null,
    openedAt: null,
    assignedTo: null,
    summary: null,
    status: "OPEN"
  })
);
assert.equal(emptyFallbackRow.receivedDate, "2026-05-12");
assert.equal(emptyFallbackRow.openedDate, "2026-05-12");
assert.equal(emptyFallbackRow.clientName, "-");
assert.equal(emptyFallbackRow.targetAgency, "-");
assert.equal(emptyFallbackRow.hasSupplement, "없음");
assert.equal(emptyFallbackRow.quoteAmountRange, "-");
assert.equal(emptyFallbackRow.needsAccountingFollowUp, true);
assert.equal(emptyFallbackRow.primaryAccountingFollowUpReason?.code, "missing_accounting_memo");
assert.equal(emptyFallbackRow.ledgerStatus, "처리 중");

assert.equal(mapCaseMatterStatusToLedgerStatus("CLOSED"), "종결");
assert.equal(mapCaseMatterStatusToLedgerStatus("UNKNOWN"), "기타");

const filtered = buildCaseLedgerViewModel(
  [
    makeCaseMatter(),
    makeCaseMatter({
      id: "case_2",
      caseNo: "C-2",
      matterType: "visa",
      status: "CLOSED",
      closedAt: d("2026-05-21T00:00:00.000Z"),
      assignedTo: "Other",
      inquiry: {
        id: "inq_2",
        createdAt: d("2026-04-01T00:00:00.000Z"),
        contactName: "Old Client",
        organizationName: null,
        inquiryType: "FOREIGNER_VISA",
        requestedOutcome: null,
        targetAgency: null,
        publicTrackingCode: "OLD"
      }
    })
  ],
  {
    dateFrom: "2026-05-01",
    dateTo: "2026-05-31",
    status: "SUPPLEMENT_REQUESTED",
    matterType: "case_card_qa",
    assignedTo: "QA"
  }
);
assert.equal(filtered.rows.length, 1);
assert.equal(filtered.summary.total, 1);
assert.equal(filtered.summary.supplement, 1);

const csv = buildCaseLedgerCsv([
  {
    ...fullRow,
    title: "comma, quote \" test"
  }
]);
assert.equal(csv.charCodeAt(0), 0xfeff);
assert.match(csv, /"comma, quote "" test"/);
assert.match(buildCaseLedgerCsv([{ ...fullRow, title: "=SUM(A1:A2)" }]), /"'=SUM\(A1:A2\)"/);
assert.equal(caseLedgerRowToCsvCells(fullRow).includes("Client Name"), true);
assert.equal(caseLedgerRowToCsvCells(fullRow).includes("20260505-FC-0003-NM"), true);
assert.equal(caseLedgerRowToCsvCells(fullRow).some((cell) => cell.includes("@")), false);
assert.equal(caseLedgerRowToCsvCells(fullRow).some((cell) => cell.includes("010-")), false);
assert.equal(caseLedgerRowToCsvCells(fullRow).includes("120,000원"), false);
assert.equal(caseLedgerRowToCsvCells(fullRow).includes("60,000원"), false);
assert.equal(JSON.stringify(fullRow).includes("internalMemo"), false);
assert.equal(JSON.stringify(fullRow).includes("communicationLogs"), false);

console.log("case ledger view model tests passed");
