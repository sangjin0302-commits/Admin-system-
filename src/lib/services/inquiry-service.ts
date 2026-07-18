import {
  InquiryStatusGuardError,
  buildInquiryStatusGuardPreview,
  parseInquiryCommunicationLogs,
  type InquiryCommunicationChannel,
  type InquiryCommunicationLogEntry,
  type InquiryStatusGuardPreview,
  type StatusChangeSource,
  type StatusTransitionGuardContext
} from "@/lib/services/inquiry-guard-helpers";
import { InquiryConcurrentUpdateError } from "@/lib/services/inquiry-admin-update-helpers";
import { createInquiry } from "@/lib/services/inquiry-service-create-helpers";
import {
  appendInquiryCommunicationLog,
  updateInquiryAdminFields
} from "@/lib/services/inquiry-service-admin-mutation-helpers";
import {
  countInquiries,
  getInquiryById,
  getInquiryMessagePreviewSet,
  listInquiries,
  persistLawbotSnapshot
} from "@/lib/services/inquiry-service-read-helpers";

export {
  InquiryStatusGuardError,
  buildInquiryStatusGuardPreview,
  parseInquiryCommunicationLogs
};
export { InquiryConcurrentUpdateError };
export type {
  InquiryCommunicationChannel,
  InquiryCommunicationLogEntry,
  InquiryStatusGuardPreview,
  StatusChangeSource,
  StatusTransitionGuardContext
};

export {
  appendInquiryCommunicationLog,
  countInquiries,
  createInquiry,
  getInquiryById,
  getInquiryMessagePreviewSet,
  listInquiries,
  persistLawbotSnapshot,
  updateInquiryAdminFields
};

export type InquiryRecord = Awaited<ReturnType<typeof getInquiryById>>;
