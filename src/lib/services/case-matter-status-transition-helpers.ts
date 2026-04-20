import type { CaseMatterStatus } from "@generated/prisma-client/client";

const transitionMap: Record<CaseMatterStatus, readonly CaseMatterStatus[]> = {
  INTAKE_REVIEW: ["INTAKE_REVIEW", "CONSULTING", "QUOTED", "CONTRACT_PENDING", "ON_HOLD", "CANCELLED"],
  CONSULTING: ["CONSULTING", "QUOTED", "CONTRACT_PENDING", "ON_HOLD", "CANCELLED"],
  QUOTED: ["QUOTED", "CONTRACT_PENDING", "OPEN", "ON_HOLD", "CANCELLED"],
  CONTRACT_PENDING: ["CONTRACT_PENDING", "OPEN", "ON_HOLD", "CANCELLED"],
  OPEN: ["OPEN", "DOCUMENT_COLLECTING", "DOCUMENT_REVIEWING", "READY_TO_SUBMIT", "ON_HOLD", "CANCELLED"],
  DOCUMENT_COLLECTING: ["DOCUMENT_COLLECTING", "DOCUMENT_REVIEWING", "READY_TO_SUBMIT", "ON_HOLD", "CANCELLED"],
  DOCUMENT_REVIEWING: ["DOCUMENT_REVIEWING", "DOCUMENT_COLLECTING", "READY_TO_SUBMIT", "ON_HOLD", "CANCELLED"],
  READY_TO_SUBMIT: ["READY_TO_SUBMIT", "SUBMITTED", "ON_HOLD", "CANCELLED"],
  SUBMITTED: ["SUBMITTED", "WAITING_AGENCY", "SUPPLEMENT_REQUESTED", "RESULT_RECEIVED", "ON_HOLD", "CANCELLED"],
  WAITING_AGENCY: ["WAITING_AGENCY", "SUPPLEMENT_REQUESTED", "RESULT_RECEIVED", "ON_HOLD", "CANCELLED"],
  SUPPLEMENT_REQUESTED: ["SUPPLEMENT_REQUESTED", "DOCUMENT_COLLECTING", "SUBMITTED", "WAITING_AGENCY", "ON_HOLD", "CANCELLED"],
  RESULT_RECEIVED: ["RESULT_RECEIVED", "CLOSING", "CLOSED", "ON_HOLD"],
  CLOSING: ["CLOSING", "CLOSED", "ON_HOLD"],
  ON_HOLD: ["ON_HOLD", "OPEN", "DOCUMENT_COLLECTING", "DOCUMENT_REVIEWING", "READY_TO_SUBMIT", "WAITING_AGENCY", "CLOSING", "CANCELLED"],
  CLOSED: ["CLOSED"],
  CANCELLED: ["CANCELLED"]
};

export function getAllowedCaseMatterTransitions(status: CaseMatterStatus): readonly CaseMatterStatus[] {
  return transitionMap[status] ?? [status];
}

export function canTransitionCaseMatterStatus(
  currentStatus: CaseMatterStatus,
  nextStatus: CaseMatterStatus
) {
  return getAllowedCaseMatterTransitions(currentStatus).includes(nextStatus);
}

export function assertCaseMatterTransition(
  currentStatus: CaseMatterStatus,
  nextStatus: CaseMatterStatus
) {
  if (!canTransitionCaseMatterStatus(currentStatus, nextStatus)) {
    throw new Error(`Case status transition blocked: ${currentStatus} -> ${nextStatus}`);
  }
}

