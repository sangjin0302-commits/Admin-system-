export const caseStageValues = [
  "CONTRACT_PREPARATION",
  "DOCUMENT_COLLECTION",
  "UNDER_REVIEW",
  "SUBMITTED",
  "SUPPLEMENT_REQUESTED",
  "COMPLETED",
  "ON_HOLD",
  "CLOSED"
] as const;

export type CaseStage = (typeof caseStageValues)[number];

export const caseStageLabels: Record<CaseStage, string> = {
  CONTRACT_PREPARATION: "계약 준비",
  DOCUMENT_COLLECTION: "서류 수집",
  UNDER_REVIEW: "검토중",
  SUBMITTED: "제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청",
  COMPLETED: "완료",
  ON_HOLD: "보류",
  CLOSED: "종결"
};
