export type CaseAccountingSummarySeverity = "info" | "warn" | "critical";

export type CaseAccountingSummaryInputRow = {
  caseId: string;
  caseNo: string;
  title: string;
  accountingMemoExists?: boolean;
  feeStatusCode?: string | null;
  paymentStatusCode?: string | null;
  feeAmountValue?: number | null;
  paidAmountValue?: number | null;
  paidAtValue?: string | null;
};

export type CaseAccountingFollowUpItem = {
  caseId: string;
  caseNo: string;
  title: string;
  reason: string;
  severity: CaseAccountingSummarySeverity;
  feeStatus: string;
  paymentStatus: string;
};

export type CaseAccountingSummaryViewModel = {
  totalCases: number;
  feeConfirmedCount: number;
  feePendingCount: number;
  feeUnsetCount: number;
  paymentUnpaidCount: number;
  paymentPartialCount: number;
  paymentPaidCount: number;
  paymentUnsetCount: number;
  followUpCount: number;
  followUpItems: CaseAccountingFollowUpItem[];
};

export const accountingFilterPresetValues = [
  "all",
  "needs_follow_up",
  "unpaid",
  "partial",
  "fee_unset_or_pending",
  "paid"
] as const;

export type AccountingFilterPreset = (typeof accountingFilterPresetValues)[number];

export type AccountingFilterPresetViewModel = {
  preset: AccountingFilterPreset;
  label: string;
};

const feeConfirmedStatuses = new Set(["CONFIRMED", "WAIVED"]);
const feePendingStatuses = new Set(["PENDING", "ESTIMATED"]);
const paymentUnpaidStatuses = new Set(["UNPAID"]);
const paymentPartialStatuses = new Set(["PARTIAL"]);
const paymentPaidStatuses = new Set(["PAID", "REFUNDED"]);

const accountingFilterPresetLabels: Record<AccountingFilterPreset, string> = {
  all: "전체",
  needs_follow_up: "확인 필요",
  unpaid: "미입금",
  partial: "부분 입금",
  fee_unset_or_pending: "수임료 미확정",
  paid: "입금 완료"
};

function normalizeStatus(value: string | null | undefined) {
  return value?.trim().toUpperCase() || "UNSET";
}

function isFeeUnset(status: string) {
  return status === "UNSET" || (!feeConfirmedStatuses.has(status) && !feePendingStatuses.has(status));
}

function isPaymentUnset(status: string) {
  return (
    status === "UNSET" ||
    (!paymentUnpaidStatuses.has(status) && !paymentPartialStatuses.has(status) && !paymentPaidStatuses.has(status))
  );
}

function buildFollowUp(row: CaseAccountingSummaryInputRow) {
  const feeStatus = normalizeStatus(row.feeStatusCode);
  const paymentStatus = normalizeStatus(row.paymentStatusCode);
  const reasons: string[] = [];
  let severity: CaseAccountingSummarySeverity = "info";

  if (!row.accountingMemoExists) {
    reasons.push("수임/입금 메모 없음");
    severity = "warn";
  }
  if (isFeeUnset(feeStatus)) {
    reasons.push("수임료 상태 확인 필요");
    severity = "warn";
  } else if (feePendingStatuses.has(feeStatus)) {
    reasons.push("수임료 확정 전");
    severity = "info";
  }
  if (isPaymentUnset(paymentStatus)) {
    reasons.push("입금 상태 확인 필요");
    severity = "warn";
  } else if (paymentUnpaidStatuses.has(paymentStatus)) {
    reasons.push("미입금 확인 필요");
    severity = "critical";
  } else if (paymentPartialStatuses.has(paymentStatus)) {
    reasons.push("부분 입금 확인 필요");
    severity = "warn";
  } else if (paymentStatus === "PAID" && !row.paidAtValue) {
    reasons.push("입금 완료일 확인 필요");
    severity = "warn";
  }
  if (
    row.feeAmountValue != null &&
    row.paidAmountValue != null &&
    row.paidAmountValue > 0 &&
    row.paidAmountValue < row.feeAmountValue
  ) {
    reasons.push("입금액이 수임료보다 작음");
    if (severity !== "critical") severity = "warn";
  }

  if (reasons.length === 0) return null;
  return {
    caseId: row.caseId,
    caseNo: row.caseNo,
    title: row.title,
    reason: Array.from(new Set(reasons)).join(" / "),
    severity,
    feeStatus,
    paymentStatus
  } satisfies CaseAccountingFollowUpItem;
}

export function normalizeAccountingFilterPreset(value: string | null | undefined): AccountingFilterPreset {
  return accountingFilterPresetValues.includes(value as AccountingFilterPreset)
    ? (value as AccountingFilterPreset)
    : "all";
}

export function getAccountingPresetLabel(preset: AccountingFilterPreset) {
  return accountingFilterPresetLabels[preset];
}

export function listAccountingFilterPresets(): AccountingFilterPresetViewModel[] {
  return accountingFilterPresetValues.map((preset) => ({
    preset,
    label: getAccountingPresetLabel(preset)
  }));
}

export function isCaseAccountingFollowUpRow(row: CaseAccountingSummaryInputRow) {
  return Boolean(buildFollowUp(row));
}

function isPartialPaymentRow(row: CaseAccountingSummaryInputRow) {
  return (
    paymentPartialStatuses.has(normalizeStatus(row.paymentStatusCode)) ||
    (row.feeAmountValue != null &&
      row.paidAmountValue != null &&
      row.paidAmountValue > 0 &&
      row.paidAmountValue < row.feeAmountValue)
  );
}

function isFeeUnsetOrPendingRow(row: CaseAccountingSummaryInputRow) {
  const feeStatus = normalizeStatus(row.feeStatusCode);
  return !row.accountingMemoExists || isFeeUnset(feeStatus) || feePendingStatuses.has(feeStatus);
}

export function filterLedgerRowsByAccountingPreset<Row extends CaseAccountingSummaryInputRow>(
  rows: readonly Row[],
  presetValue: string | null | undefined
): Row[] {
  const preset = normalizeAccountingFilterPreset(presetValue);
  if (preset === "all") return [...rows];
  if (preset === "needs_follow_up") return rows.filter(isCaseAccountingFollowUpRow);
  if (preset === "unpaid") return rows.filter((row) => paymentUnpaidStatuses.has(normalizeStatus(row.paymentStatusCode)));
  if (preset === "partial") return rows.filter(isPartialPaymentRow);
  if (preset === "fee_unset_or_pending") return rows.filter(isFeeUnsetOrPendingRow);
  return rows.filter((row) => normalizeStatus(row.paymentStatusCode) === "PAID");
}

export function buildCaseAccountingSummaryViewModel(
  rows: readonly CaseAccountingSummaryInputRow[]
): CaseAccountingSummaryViewModel {
  const followUpItems = rows.map(buildFollowUp).filter((item): item is CaseAccountingFollowUpItem => Boolean(item));

  return {
    totalCases: rows.length,
    feeConfirmedCount: rows.filter((row) => feeConfirmedStatuses.has(normalizeStatus(row.feeStatusCode))).length,
    feePendingCount: rows.filter((row) => feePendingStatuses.has(normalizeStatus(row.feeStatusCode))).length,
    feeUnsetCount: rows.filter((row) => !row.accountingMemoExists || isFeeUnset(normalizeStatus(row.feeStatusCode))).length,
    paymentUnpaidCount: rows.filter((row) => paymentUnpaidStatuses.has(normalizeStatus(row.paymentStatusCode))).length,
    paymentPartialCount: rows.filter((row) => paymentPartialStatuses.has(normalizeStatus(row.paymentStatusCode))).length,
    paymentPaidCount: rows.filter((row) => paymentPaidStatuses.has(normalizeStatus(row.paymentStatusCode))).length,
    paymentUnsetCount: rows.filter(
      (row) => !row.accountingMemoExists || isPaymentUnset(normalizeStatus(row.paymentStatusCode))
    ).length,
    followUpCount: followUpItems.length,
    followUpItems
  };
}
