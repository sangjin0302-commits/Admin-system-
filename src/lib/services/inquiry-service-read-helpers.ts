import { prisma } from "@/lib/prisma/client";
import {
  buildInquiryListWhere,
  sortInquiriesByUrgency,
  type InquiryListFilters
} from "@/lib/services/inquiry-list-helpers";
import {
  buildInquiryMessagePreviewSetForInquiry,
  type InquiryMessagePreviewInput
} from "@/lib/services/inquiry-message-preview-helpers";

type PersistLawbotSnapshotInput = {
  inquiryId: string;
  status: string;
  summary: string;
  payload: {
    input_summary?: string;
    practical_use_status?: string;
    confidence_score?: number;
    confidence_label?: string;
    match_reason?: string;
    research_goal?: string;
    review_required_reasons?: string[];
    critical_missing_facts?: string[];
    priority_actions?: string[];
    risk_flags?: string[];
    practical_checklist?: string[];
    document_checklist?: string[];
  };
};

export async function listInquiries(filters: InquiryListFilters = {}) {
  const inquiries = await prisma.inquiry.findMany({
    where: buildInquiryListWhere(filters),
    orderBy: [{ createdAt: "desc" }]
  });

  if (filters.sort === "urgency") {
    return sortInquiriesByUrgency(inquiries);
  }

  return inquiries;
}

export async function countInquiries(filters: InquiryListFilters = {}) {
  return prisma.inquiry.count({
    where: buildInquiryListWhere(filters)
  });
}

export async function getInquiryById(id: string) {
  return prisma.inquiry.findUnique({
    where: { id }
  });
}

export async function persistLawbotSnapshot(input: PersistLawbotSnapshotInput) {
  return prisma.inquiry.update({
    where: { id: input.inquiryId },
    data: {
      lawbotLastAnalyzedAt: new Date(),
      lawbotSnapshotVersion: 1,
      lawbotSnapshotStatus: input.status,
      lawbotSnapshotSummary: input.summary,
      lawbotSnapshotPayload: JSON.stringify(input.payload)
    }
  });
}

export function getInquiryMessagePreviewSet(inquiry: InquiryMessagePreviewInput) {
  return buildInquiryMessagePreviewSetForInquiry(inquiry);
}

export type {
  InquiryListFilters,
  InquiryMessagePreviewInput
};
