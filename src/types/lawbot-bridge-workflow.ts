export const bridgeWorkflowStatusValues = [
  "NEW_INQUIRY",
  "TRIAGE_REVIEW",
  "AWAITING_MORE_FACTS",
  "PROFILED",
  "PROFILE_REVIEW_REQUIRED",
  "CASE_CARD_CREATED",
  "AWAITING_SOURCE_VERIFICATION",
  "DRAFT_CREATED",
  "MESSAGE_DRAFT_CREATED",
  "APPROVAL_PENDING",
  "APPROVED",
  "REVISION_REQUESTED",
  "BLOCKED",
  "CLOSED"
] as const;

export type BridgeWorkflowStatus = (typeof bridgeWorkflowStatusValues)[number];

export const workflowTaskStatusValues = [
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
  "CANCELED"
] as const;

export type WorkflowTaskStatus = (typeof workflowTaskStatusValues)[number];

export const workflowDraftStatusValues = [
  "DRAFT_CREATED",
  "APPROVAL_PENDING",
  "APPROVED",
  "REVISION_REQUESTED",
  "BLOCKED",
  "ARCHIVED"
] as const;

export type WorkflowDraftStatus = (typeof workflowDraftStatusValues)[number];
