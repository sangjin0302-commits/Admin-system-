import type { LawbotReviewReadonlyUiModel } from "./lawbot-review-readonly-ui-model";

export type LawbotReviewApprovalChecks = {
  manualReviewChecked: boolean;
  sourcesChecked: boolean;
  riskFlagsChecked: boolean;
  draftsReviewed: boolean;
};

export type LawbotReviewApprovalPanelState =
  | "approval_pending"
  | "approved"
  | "blocked";

export function getLawbotReviewApprovalPanelState(model: LawbotReviewReadonlyUiModel): {
  state: LawbotReviewApprovalPanelState;
  canShowApprovalControls: boolean;
  statusMessage: string;
} {
  const workflowStatus = model.workflowStatus.trim().toUpperCase();

  if (workflowStatus === "APPROVAL_PENDING") {
    return {
      state: "approval_pending",
      canShowApprovalControls: true,
      statusMessage: "관리자 확인 후 내부 승인 처리가 가능합니다."
    };
  }

  if (workflowStatus === "APPROVED") {
    return {
      state: "approved",
      canShowApprovalControls: false,
      statusMessage: "내부 승인 완료 상태입니다."
    };
  }

  return {
    state: "blocked",
    canShowApprovalControls: false,
    statusMessage: "현재 워크플로 상태에서는 내부 승인 처리를 할 수 없습니다."
  };
}

export function areLawbotApprovalChecksComplete(checks: LawbotReviewApprovalChecks) {
  return (
    checks.manualReviewChecked === true &&
    checks.sourcesChecked === true &&
    checks.riskFlagsChecked === true &&
    checks.draftsReviewed === true
  );
}

export function buildLawbotApprovalRequestBody(
  checks: LawbotReviewApprovalChecks,
  operatorNote: string
) {
  return {
    manualReviewChecked: checks.manualReviewChecked,
    sourcesChecked: checks.sourcesChecked,
    riskFlagsChecked: checks.riskFlagsChecked,
    draftsReviewed: checks.draftsReviewed,
    operatorNote: operatorNote.trim(),
    expectedWorkflowStatus: "APPROVAL_PENDING" as const
  };
}
