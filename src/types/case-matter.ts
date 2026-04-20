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
  INTAKE_REVIEW: "Intake Review",
  CONSULTING: "Consulting",
  QUOTED: "Quoted",
  CONTRACT_PENDING: "Contract Pending",
  OPEN: "Open",
  DOCUMENT_COLLECTING: "Document Collecting",
  DOCUMENT_REVIEWING: "Document Reviewing",
  READY_TO_SUBMIT: "Ready To Submit",
  SUBMITTED: "Submitted",
  SUPPLEMENT_REQUESTED: "Supplement Requested",
  WAITING_AGENCY: "Waiting Agency",
  RESULT_RECEIVED: "Result Received",
  CLOSING: "Closing",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  ON_HOLD: "On Hold"
};

const requiredDocumentStatusLabelMap: Record<RequiredDocumentStatusValue, string> = {
  NEEDED: "Needed",
  REQUESTED: "Requested",
  RECEIVED: "Received",
  IN_REVIEW: "Reviewing",
  APPROVED: "Approved",
  NEEDS_FIX: "Needs Fix",
  REJECTED: "Rejected",
  NOT_APPLICABLE: "Not Applicable"
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
