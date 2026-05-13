import type { CaseMatterStatus, Prisma } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";

const emptyValue = "-";
const feePlaceholder = "추후 관리";

const caseLedgerInclude = {
  inquiry: {
    select: {
      id: true,
      createdAt: true,
      contactName: true,
      organizationName: true,
      inquiryType: true,
      requestedOutcome: true,
      targetAgency: true,
      publicTrackingCode: true
    }
  },
  parties: {
    select: {
      role: true,
      name: true,
      organization: true
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  },
  submissionPackages: {
    select: {
      targetAgency: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  },
  submissions: {
    select: {
      agencyName: true,
      submittedAt: true,
      receiptNo: true,
      resultStatus: true,
      resultReceivedAt: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  },
  supplementRequests: {
    select: {
      status: true,
      dueDate: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  },
  events: {
    select: {
      eventType: true,
      createdAt: true
    },
    orderBy: [{ createdAt: "desc" }],
    take: 20
  },
  quotes: {
    select: {
      status: true,
      totalMin: true,
      totalMax: true,
      updatedAt: true
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
  },
  contractDrafts: {
    select: {
      status: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  }
} satisfies Prisma.CaseMatterInclude;

export type CaseLedgerSource = Prisma.CaseMatterGetPayload<{
  include: typeof caseLedgerInclude;
}>;

export type CaseLedgerFilters = {
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: string | null;
  matterType?: string | null;
  assignedTo?: string | null;
};

export type CaseLedgerRow = {
  caseId: string;
  caseNo: string;
  receivedDate: string;
  openedDate: string;
  clientName: string;
  clientType: string;
  matterType: string;
  title: string;
  summary: string;
  ledgerStatus: string;
  targetAgency: string;
  submittedAt: string;
  receiptNo: string;
  hasSupplement: string;
  resultReceivedAt: string;
  closedAt: string;
  assignedTo: string;
  note: string;
  publicTrackingCode: string;
  quoteStatus: string;
  quoteAmountRange: string;
  contractStatus: string;
  feeStatus: string;
  paymentStatus: string;
};

export type CaseLedgerSummary = {
  total: number;
  active: number;
  supplement: number;
  closed: number;
  submitted: number;
};

export type CaseLedgerViewModel = {
  rows: CaseLedgerRow[];
  summary: CaseLedgerSummary;
};

const statusLabels: Record<CaseMatterStatus, string> = {
  INTAKE_REVIEW: "접수 검토",
  CONSULTING: "상담 중",
  QUOTED: "견적",
  CONTRACT_PENDING: "수임 대기",
  OPEN: "처리 중",
  DOCUMENT_COLLECTING: "자료 수집",
  DOCUMENT_REVIEWING: "자료 검토",
  READY_TO_SUBMIT: "제출 준비",
  SUBMITTED: "제출",
  SUPPLEMENT_REQUESTED: "보완 중",
  WAITING_AGENCY: "기관 심사 대기",
  RESULT_RECEIVED: "결과 수령",
  CLOSING: "종결 준비",
  CLOSED: "종결",
  CANCELLED: "취소",
  ON_HOLD: "보류"
};

const closedStatuses = new Set(["CLOSED", "CANCELLED"]);
const activeSupplementStatuses = new Set([
  "RECEIVED",
  "ANALYZING",
  "DOCS_REQUESTED",
  "CLIENT_WAITING",
  "RESPONSE_DRAFTING",
  "READY_TO_RESPOND",
  "OVERDUE"
]);

function text(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : emptyValue;
}

function isoDate(value: Date | string | null | undefined) {
  if (!value) return emptyValue;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return emptyValue;
  return date.toISOString().slice(0, 10);
}

function pickClient(caseMatter: CaseLedgerSource) {
  const client = caseMatter.parties.find((party) => party.role === "CLIENT") ?? caseMatter.parties[0];
  const fallbackName = caseMatter.inquiry?.contactName ?? null;
  const name = client?.name ?? fallbackName;
  const organization = client?.organization ?? caseMatter.inquiry?.organizationName ?? null;

  return {
    clientName: text(name),
    clientType: organization ? "기관/법인" : "개인"
  };
}

function pickSubmission(caseMatter: CaseLedgerSource) {
  return (
    caseMatter.submissions.find((submission) => submission.submittedAt) ??
    caseMatter.submissions[0] ??
    null
  );
}

function pickTargetAgency(caseMatter: CaseLedgerSource) {
  const submission = pickSubmission(caseMatter);
  return text(
    submission?.agencyName ??
      caseMatter.submissionPackages.find((item) => item.targetAgency)?.targetAgency ??
      caseMatter.inquiry?.targetAgency ??
      null
  );
}

function pickReceivedDate(caseMatter: CaseLedgerSource) {
  return isoDate(caseMatter.inquiry?.createdAt ?? caseMatter.openedAt ?? caseMatter.createdAt);
}

function pickClosedDate(caseMatter: CaseLedgerSource) {
  if (caseMatter.closedAt) return isoDate(caseMatter.closedAt);
  const closedEvent = caseMatter.events.find((event) => event.eventType.includes("CLOSED"));
  return isoDate(closedEvent?.createdAt ?? null);
}

function pickQuote(caseMatter: CaseLedgerSource) {
  return (
    caseMatter.quotes.find((quote) => quote.status === "ACCEPTED") ??
    caseMatter.quotes[0] ??
    null
  );
}

function formatAmountRange(min: number, max: number) {
  if (min <= 0 && max <= 0) return emptyValue;
  const formatter = new Intl.NumberFormat("ko-KR");
  if (min === max) return `${formatter.format(min)}원`;
  return `${formatter.format(min)}~${formatter.format(max)}원`;
}

function buildNote(caseMatter: CaseLedgerSource, submission: ReturnType<typeof pickSubmission>) {
  const notes: string[] = [];
  if (caseMatter.summary?.trim()) notes.push(caseMatter.summary.trim());
  if (caseMatter.supplementRequests.length > 0) {
    const activeCount = caseMatter.supplementRequests.filter((request) =>
      activeSupplementStatuses.has(request.status)
    ).length;
    notes.push(activeCount > 0 ? `보완 진행 ${activeCount}건` : "보완 이력 있음");
  }
  if (submission?.resultStatus?.trim()) notes.push(`결과: ${submission.resultStatus.trim()}`);
  return notes.length > 0 ? notes.join(" / ") : emptyValue;
}

export function mapCaseMatterStatusToLedgerStatus(status: CaseMatterStatus | string) {
  return statusLabels[status as CaseMatterStatus] ?? "기타";
}

export function buildCaseLedgerRow(caseMatter: CaseLedgerSource): CaseLedgerRow {
  const client = pickClient(caseMatter);
  const submission = pickSubmission(caseMatter);
  const quote = pickQuote(caseMatter);
  const latestContract = caseMatter.contractDrafts[0] ?? null;

  return {
    caseId: caseMatter.id,
    caseNo: text(caseMatter.caseNo),
    receivedDate: pickReceivedDate(caseMatter),
    openedDate: isoDate(caseMatter.openedAt ?? caseMatter.createdAt),
    clientName: client.clientName,
    clientType: client.clientType,
    matterType: text(caseMatter.matterType),
    title: text(caseMatter.title),
    summary: text(caseMatter.summary ?? caseMatter.inquiry?.requestedOutcome ?? null),
    ledgerStatus: mapCaseMatterStatusToLedgerStatus(caseMatter.status),
    targetAgency: pickTargetAgency(caseMatter),
    submittedAt: isoDate(submission?.submittedAt ?? null),
    receiptNo: text(submission?.receiptNo ?? null),
    hasSupplement: caseMatter.supplementRequests.length > 0 ? "있음" : "없음",
    resultReceivedAt: isoDate(submission?.resultReceivedAt ?? null),
    closedAt: pickClosedDate(caseMatter),
    assignedTo: text(caseMatter.assignedTo),
    note: buildNote(caseMatter, submission),
    publicTrackingCode: text(caseMatter.inquiry?.publicTrackingCode ?? null),
    quoteStatus: text(quote?.status ?? null),
    quoteAmountRange: quote ? formatAmountRange(quote.totalMin, quote.totalMax) : emptyValue,
    contractStatus: text(latestContract?.status ?? null),
    feeStatus: feePlaceholder,
    paymentStatus: feePlaceholder
  };
}

function parseDateBoundary(value: string | null | undefined, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function normalizeLedgerFilters(filters: CaseLedgerFilters = {}): CaseLedgerFilters {
  return {
    dateFrom: filters.dateFrom?.trim() || null,
    dateTo: filters.dateTo?.trim() || null,
    status: filters.status?.trim() || null,
    matterType: filters.matterType?.trim() || null,
    assignedTo: filters.assignedTo?.trim() || null
  };
}

export function applyCaseLedgerFilters(rows: CaseLedgerRow[], filters: CaseLedgerFilters = {}) {
  const normalized = normalizeLedgerFilters(filters);
  const dateFrom = parseDateBoundary(normalized.dateFrom);
  const dateTo = parseDateBoundary(normalized.dateTo, true);

  return rows.filter((row) => {
    const rowDate = row.receivedDate !== emptyValue ? new Date(`${row.receivedDate}T00:00:00.000Z`) : null;
    if (dateFrom && rowDate && rowDate < dateFrom) return false;
    if (dateTo && rowDate && rowDate > dateTo) return false;
    if (normalized.status && row.ledgerStatus !== mapCaseMatterStatusToLedgerStatus(normalized.status)) {
      return false;
    }
    if (normalized.matterType && row.matterType !== normalized.matterType) return false;
    if (normalized.assignedTo && row.assignedTo !== normalized.assignedTo) return false;
    return true;
  });
}

export function buildCaseLedgerViewModel(
  caseMatters: CaseLedgerSource[],
  filters: CaseLedgerFilters = {}
): CaseLedgerViewModel {
  const rows = applyCaseLedgerFilters(caseMatters.map(buildCaseLedgerRow), filters);
  return {
    rows,
    summary: {
      total: rows.length,
      active: rows.filter((row) => !["종결", "취소"].includes(row.ledgerStatus)).length,
      supplement: rows.filter((row) => row.hasSupplement === "있음").length,
      closed: rows.filter((row) => row.ledgerStatus === "종결").length,
      submitted: rows.filter((row) => row.submittedAt !== emptyValue || row.receiptNo !== emptyValue).length
    }
  };
}

export async function listCaseLedgerRows(filters: CaseLedgerFilters = {}) {
  const caseMatters = await prisma.caseMatter.findMany({
    include: caseLedgerInclude,
    orderBy: [{ updatedAt: "desc" }]
  });

  return buildCaseLedgerViewModel(caseMatters, filters);
}

export const caseLedgerCsvHeaders = [
  "사건번호",
  "접수일자",
  "개시일자",
  "의뢰인",
  "의뢰인 유형",
  "업무유형",
  "사건명",
  "처리상태",
  "제출기관",
  "제출일자",
  "접수번호",
  "보완",
  "결과수령일",
  "종결일자",
  "담당자",
  "비고",
  "원 문의 trackingCode",
  "견적 상태",
  "견적 금액 범위",
  "계약 초안 상태",
  "수임료",
  "입금상태"
];

function escapeCsvCell(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll("\"", "\"\"")}"`;
}

export function caseLedgerRowToCsvCells(row: CaseLedgerRow) {
  return [
    row.caseNo,
    row.receivedDate,
    row.openedDate,
    row.clientName,
    row.clientType,
    row.matterType,
    row.title,
    row.ledgerStatus,
    row.targetAgency,
    row.submittedAt,
    row.receiptNo,
    row.hasSupplement,
    row.resultReceivedAt,
    row.closedAt,
    row.assignedTo,
    row.note,
    row.publicTrackingCode,
    row.quoteStatus,
    row.quoteAmountRange,
    row.contractStatus,
    row.feeStatus,
    row.paymentStatus
  ];
}

export function buildCaseLedgerCsv(rows: CaseLedgerRow[]) {
  const lines = [
    caseLedgerCsvHeaders.map(escapeCsvCell).join(","),
    ...rows.map((row) => caseLedgerRowToCsvCells(row).map(escapeCsvCell).join(","))
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}
