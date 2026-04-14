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

export const clientRelationshipStatusValues = [
  "NEUTRAL",
  "FOLLOW_UP_NEEDED",
  "REVIEW_REQUESTED",
  "REFERRAL_POTENTIAL",
  "RETURNING_CLIENT"
] as const;

export type ClientRelationshipStatus = (typeof clientRelationshipStatusValues)[number];

export const followUpActionTypeValues = [
  "REVIEW_REQUEST",
  "REFERRAL_CHECK",
  "REENGAGEMENT"
] as const;

export type FollowUpActionType = (typeof followUpActionTypeValues)[number];

export const followUpActionStatusValues = ["PENDING", "COMPLETED", "CANCELLED"] as const;

export type FollowUpActionStatus = (typeof followUpActionStatusValues)[number];

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
export const clientRelationshipStatusLabels: Record<ClientRelationshipStatus, string> = {
  NEUTRAL: "기본",
  FOLLOW_UP_NEEDED: "후속 필요",
  REVIEW_REQUESTED: "후기 요청",
  REFERRAL_POTENTIAL: "추천 가능",
  RETURNING_CLIENT: "재의뢰 가능"
};

export const followUpActionTypeLabels: Record<FollowUpActionType, string> = {
  REVIEW_REQUEST: "후기 요청",
  REFERRAL_CHECK: "추천 확인",
  REENGAGEMENT: "재의뢰 안부"
};

export const followUpActionStatusLabels: Record<FollowUpActionStatus, string> = {
  PENDING: "대기",
  COMPLETED: "완료",
  CANCELLED: "취소"
};
