import type { RequiredDocumentStatus } from "@generated/prisma-client/client";

const transitionMap: Record<RequiredDocumentStatus, readonly RequiredDocumentStatus[]> = {
  NEEDED: ["NEEDED", "REQUESTED", "NOT_APPLICABLE"],
  REQUESTED: ["REQUESTED", "RECEIVED", "NOT_APPLICABLE"],
  RECEIVED: ["RECEIVED", "IN_REVIEW", "NEEDS_FIX", "APPROVED"],
  IN_REVIEW: ["IN_REVIEW", "APPROVED", "NEEDS_FIX", "RECEIVED"],
  NEEDS_FIX: ["NEEDS_FIX", "REQUESTED", "RECEIVED", "NOT_APPLICABLE"],
  APPROVED: ["APPROVED", "NEEDS_FIX"],
  REJECTED: ["REJECTED"],
  NOT_APPLICABLE: ["NOT_APPLICABLE", "NEEDED"]
};

export function getAllowedRequiredDocumentTransitions(
  status: RequiredDocumentStatus
): readonly RequiredDocumentStatus[] {
  return transitionMap[status] ?? [status];
}

export function canTransitionRequiredDocumentStatus(
  currentStatus: RequiredDocumentStatus,
  nextStatus: RequiredDocumentStatus
) {
  return getAllowedRequiredDocumentTransitions(currentStatus).includes(nextStatus);
}

export function assertRequiredDocumentTransition(
  currentStatus: RequiredDocumentStatus,
  nextStatus: RequiredDocumentStatus
) {
  if (!canTransitionRequiredDocumentStatus(currentStatus, nextStatus)) {
    throw new Error(`RequiredDocument status transition blocked: ${currentStatus} -> ${nextStatus}`);
  }
}

