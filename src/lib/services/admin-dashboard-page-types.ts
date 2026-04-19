export type DashboardInquiryBase = {
  id: string;
  title: string;
  status: string;
  urgencyLevel: string;
  dueDate: Date | null;
  nextContactAt: Date | null;
  responsePending: boolean;
  hasPreparedDocuments: boolean;
  updatedAt: Date;
  createdAt: Date;
  contactName: string;
  organizationName: string | null;
  inquiryType: string;
  preferredLanguage: string;
  internalMemo: string | null;
  lawbotSnapshotPayload: string | null;
};
