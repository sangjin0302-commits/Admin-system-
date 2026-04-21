export const caseMatterStatusValues = [
  "INTAKE_REVIEW",
  "CONSULTING",
  "QUOTED",
  "CONTRACT_PENDING",
  "OPEN",
  "DOCUMENT_COLLECTING",
  "DOCUMENT_REVIEWING",
  "READY_TO_SUBMIT",
  "SUBMITTED",
  "SUPPLEMENT_REQUESTED",
  "WAITING_AGENCY",
  "RESULT_RECEIVED",
  "CLOSING",
  "CLOSED",
  "CANCELLED",
  "ON_HOLD"
] as const;

export type CaseMatterStatusValue = (typeof caseMatterStatusValues)[number];

export const requiredDocumentStatusValues = [
  "NEEDED",
  "REQUESTED",
  "RECEIVED",
  "IN_REVIEW",
  "APPROVED",
  "NEEDS_FIX",
  "REJECTED",
  "NOT_APPLICABLE"
] as const;

export type RequiredDocumentStatusValue = (typeof requiredDocumentStatusValues)[number];

const caseMatterStatusLabelMap: Record<CaseMatterStatusValue, string> = {
  INTAKE_REVIEW: "접수 검토",
  CONSULTING: "상담 진행",
  QUOTED: "견적 제안",
  CONTRACT_PENDING: "계약 대기",
  OPEN: "사건 진행",
  DOCUMENT_COLLECTING: "서류 수집",
  DOCUMENT_REVIEWING: "서류 검토",
  READY_TO_SUBMIT: "제출 준비 완료",
  SUBMITTED: "제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청",
  WAITING_AGENCY: "기관 심사 대기",
  RESULT_RECEIVED: "결과 수신",
  CLOSING: "종결 처리",
  CLOSED: "종결",
  CANCELLED: "취소",
  ON_HOLD: "보류"
};

const requiredDocumentStatusLabelMap: Record<RequiredDocumentStatusValue, string> = {
  NEEDED: "필요",
  REQUESTED: "요청됨",
  RECEIVED: "수신됨",
  IN_REVIEW: "검토 중",
  APPROVED: "승인됨",
  NEEDS_FIX: "보완 필요",
  REJECTED: "반려",
  NOT_APPLICABLE: "해당 없음"
};

function isCaseMatterStatus(value: unknown): value is CaseMatterStatusValue {
  return typeof value === "string" && caseMatterStatusValues.includes(value as CaseMatterStatusValue);
}

function isRequiredDocumentStatus(value: unknown): value is RequiredDocumentStatusValue {
  return (
    typeof value === "string" && requiredDocumentStatusValues.includes(value as RequiredDocumentStatusValue)
  );
}

export function normalizeCaseMatterStatus(value: unknown): CaseMatterStatusValue {
  return isCaseMatterStatus(value) ? value : "INTAKE_REVIEW";
}

export function normalizeRequiredDocumentStatus(value: unknown): RequiredDocumentStatusValue {
  return isRequiredDocumentStatus(value) ? value : "NEEDED";
}

export function getCaseMatterStatusLabel(value: unknown) {
  return caseMatterStatusLabelMap[normalizeCaseMatterStatus(value)];
}

export function getRequiredDocumentStatusLabel(value: unknown) {
  return requiredDocumentStatusLabelMap[normalizeRequiredDocumentStatus(value)];
}
