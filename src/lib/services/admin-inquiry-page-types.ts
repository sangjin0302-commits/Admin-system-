import type { InquiryStatusGroup } from "@/types/inquiry";

export type { InquiryStatusGroup };

export type InquiryListItemBase = {
  id: string;
  title: string;
  status: string;
  urgencyLevel: string;
  dueDate: Date | null;
  nextContactAt: Date | null;
  responsePending: boolean;
  hasPreparedDocuments: boolean;
  updatedAt: Date;
  contactName: string;
  internalMemo: string | null;
  lawbotSnapshotPayload: string | null;
};

export type InquiryPrioritizedItem = InquiryListItemBase & {
  checklistProgressPercent: number;
  checklistPendingCount: number;
  checklistTotalCount: number;
};

export type InquiryQueueItem = {
  id: string;
  title: string;
  href: string;
  description: string;
};

export type InquiryQueueGroup = {
  key: string;
  title: string;
  hint: string;
  tone: "urgent" | "docs" | "consult" | "quote";
  count: number;
  items: InquiryQueueItem[];
};

export type InquiryFlowAlert = {
  key: string;
  title: string;
  count: number;
  description: string;
  tone: "danger" | "warning" | "info" | "neutral";
  href?: string;
};

export type InquiryImmediateExecutionItem = {
  id: string;
  title: string;
  href: string;
  score: number;
  statusLabel: string;
  meta: string;
  readiness: string;
};

export type InquiryQuickActionLink = {
  id: string;
  label: string;
  href: string;
  count: number;
  description: string;
};
