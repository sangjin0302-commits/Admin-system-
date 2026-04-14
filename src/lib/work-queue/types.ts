export const workQueueTypeValues = [
  "DEADLINE_DUE_SOON",
  "DEADLINE_OVERDUE",
  "SUPPLEMENT_PENDING",
  "MISSING_DOCUMENTS",
  "QUOTE_FOLLOW_UP",
  "CONTRACT_PENDING",
  "REVIEW_REQUEST",
  "REFERRAL_CHECK",
  "REENGAGEMENT"
] as const;

export type WorkQueueType = (typeof workQueueTypeValues)[number];

export const workQueueSeverityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type WorkQueueSeverity = (typeof workQueueSeverityValues)[number];

export type WorkQueueEntityType = "INQUIRY" | "QUOTE" | "CASE" | "SUPPLEMENT" | "SUBMISSION";

export type WorkQueueItem = {
  id: string;
  type: WorkQueueType;
  title: string;
  severity: WorkQueueSeverity;
  relatedEntityType: WorkQueueEntityType;
  relatedEntityId: string;
  relatedInquiryId: string | null;
  dueDate: string | null;
  recommendedAction: string;
  messageDraft: string | null;
  href: string;
};

export type WorkQueueSnapshot = {
  generatedAt: string;
  counts: {
    today: number;
    soon: number;
    overdue: number;
    followUp: number;
    total: number;
  };
  sections: {
    today: WorkQueueItem[];
    soon: WorkQueueItem[];
    overdue: WorkQueueItem[];
    followUp: WorkQueueItem[];
  };
};

export const workQueueTypeLabels = {
  DEADLINE_DUE_SOON: "기한 임박",
  DEADLINE_OVERDUE: "기한 경과",
  SUPPLEMENT_PENDING: "보완 진행",
  MISSING_DOCUMENTS: "필수서류 누락",
  QUOTE_FOLLOW_UP: "견적 후속조치",
  CONTRACT_PENDING: "계약/사건 후속조치"
};

export const workQueueTypeLabelOverrides: Partial<Record<WorkQueueType, string>> = {
  REVIEW_REQUEST: "후기 요청",
  REFERRAL_CHECK: "추천 확인",
  REENGAGEMENT: "재의뢰 안부"
};

export const workQueueSeverityLabels: Record<WorkQueueSeverity, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  CRITICAL: "긴급"
};
