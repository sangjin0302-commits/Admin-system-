export const submissionPackageStatusValues = [
  "DRAFT",
  "SUBMITTED",
  "SUPPLEMENT_REQUESTED",
  "RESUBMITTED",
  "CLOSED"
] as const;

export type SubmissionPackageStatus = (typeof submissionPackageStatusValues)[number];

export const supplementRequestStatusValues = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export type SupplementRequestStatus = (typeof supplementRequestStatusValues)[number];

export const submissionPackageStatusLabels: Record<SubmissionPackageStatus, string> = {
  DRAFT: "초안",
  SUBMITTED: "제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청",
  RESUBMITTED: "재제출",
  CLOSED: "종료"
};

export const supplementRequestStatusLabels: Record<SupplementRequestStatus, string> = {
  OPEN: "접수",
  IN_PROGRESS: "처리중",
  RESOLVED: "해결"
};
