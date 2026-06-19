import type {
  ApprovalWorkflowGateBlockerCode,
  ApprovalWorkflowGateViewModel
} from "./types";

export function buildApprovalWorkflowGate(input: {
  reviewRequired: boolean;
  mustVerify: string[];
  mustVerifySources: string[];
  riskFlags: string[];
}): ApprovalWorkflowGateViewModel {
  const blockerCodes: ApprovalWorkflowGateBlockerCode[] = [];
  if (input.reviewRequired) {
    blockerCodes.push("review_required");
  }
  if (input.mustVerify.length > 0) {
    blockerCodes.push("must_verify_pending");
  }
  if (input.mustVerifySources.length > 0) {
    blockerCodes.push("must_verify_sources_pending");
  }

  const canProceedWithoutApproval = blockerCodes.length === 0;
  const requiresManualReview = !canProceedWithoutApproval || input.riskFlags.length > 0;

  let summary = "No blocker from bridge review signals.";
  if (!canProceedWithoutApproval) {
    summary = "Approval gate blocked by bridge review signals.";
  } else if (input.riskFlags.length > 0) {
    summary = "No hard blocker, but risk flags require reviewer attention.";
  }

  return {
    canProceedWithoutApproval,
    requiresManualReview,
    blockerCodes,
    cautionRiskFlags: input.riskFlags,
    summary
  };
}
