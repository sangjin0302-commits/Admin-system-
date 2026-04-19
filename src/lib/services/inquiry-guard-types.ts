import type { InquiryStatus } from "@/types/inquiry";

export type StatusTransitionGuardContext = {
  currentStatus: InquiryStatus;
  email: string | null;
  phone: string | null;
  description: string;
  requestedOutcome: string | null;
  hasPreparedDocuments: boolean;
  internalMemo: string | null;
  lawbotSnapshotPayload: string | null;
  quoteCount: number;
};

export type StatusChangeSource = "management_form" | "status_panel" | "automation" | "api" | "unknown";

export type InquiryStatusGuardPreview = {
  status: InquiryStatus;
  allowed: boolean;
  blockers: string[];
};

export class InquiryStatusGuardError extends Error {
  blockers: string[];

  constructor(message: string, blockers: string[]) {
    super(message);
    this.name = "InquiryStatusGuardError";
    this.blockers = blockers;
  }
}

export type InquiryCommunicationChannel = "EMAIL" | "PHONE" | "KAKAO" | "SMS" | "VISIT" | "INTERNAL";

export type InquiryCommunicationLogEntry = {
  id: string;
  createdAt: string;
  channel: InquiryCommunicationChannel;
  summary: string;
  details: string;
  responsePending: boolean;
  nextContactAt: string | null;
};
