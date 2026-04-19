export {
  buildCaseTimeline,
  buildOperationsFeed
} from "@/lib/services/inquiry-detail-ops-timeline-helpers";
export {
  buildLawbotSnapshotComparison,
  getLawbotOperationalSource
} from "@/lib/services/inquiry-detail-lawbot-helpers";
export { getWorkflowStep } from "@/lib/services/inquiry-detail-workflow-helpers";
export { buildStatusHistoryFromLogs } from "@/lib/services/inquiry-detail-status-history-helpers";
export type {
  CommunicationLogLike,
  StatusHistoryItem,
  WorkflowStep
} from "@/lib/services/inquiry-detail-core-types";
