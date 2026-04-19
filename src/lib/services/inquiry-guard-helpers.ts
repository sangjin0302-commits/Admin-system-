export {
  InquiryStatusGuardError,
  type InquiryCommunicationChannel,
  type InquiryCommunicationLogEntry,
  type InquiryStatusGuardPreview,
  type StatusChangeSource,
  type StatusTransitionGuardContext
} from "@/lib/services/inquiry-guard-types";
export { createLogId, buildStatusTransitionLogEntry } from "@/lib/services/inquiry-status-transition-log-helpers";
export {
  buildInquiryStatusGuardPreview,
  getStatusTransitionBlockers
} from "@/lib/services/inquiry-status-transition-guard-helpers";
export { parseInquiryCommunicationLogs } from "@/lib/services/inquiry-communication-log-helpers";
