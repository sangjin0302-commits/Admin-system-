import { syncConsultationToNotion } from "@/lib/integrations/notion";
import { parseJsonArray } from "@/lib/utils";
import type {
  InquiryStatus,
  InquiryType,
  UrgencyLevel
} from "@/types/inquiry";

function parseStringArray(value: string | null | undefined) {
  return parseJsonArray(value).map((entry) => String(entry));
}

type InquiryConsultationSyncRecord = {
  id: string;
  contactName: string;
  phone: string | null;
  title: string;
  inquiryType: string;
  status: string;
  urgencyLevel: string;
  qualificationScore: number;
  generatedSummary: string;
  recommendedNextStep: string;
  classificationReason: string | null;
  precheckRecommendedDocs: string | null;
  serviceTags: string | null;
  createdAt: Date;
  dueDate: Date | null;
};

export async function syncInquiryConsultationSnapshot(
  inquiry: InquiryConsultationSyncRecord,
  input?: {
    classificationReasonOverride?: string | null;
  }
) {
  await syncConsultationToNotion({
    inquiryId: inquiry.id,
    contactName: inquiry.contactName,
    contactPhone: inquiry.phone,
    inquiryTitle: inquiry.title,
    inquiryType: inquiry.inquiryType as InquiryType,
    inquiryStatus: inquiry.status as InquiryStatus,
    urgencyLevel: inquiry.urgencyLevel as UrgencyLevel,
    qualificationScore: inquiry.qualificationScore,
    generatedSummary: inquiry.generatedSummary,
    recommendedNextStep: inquiry.recommendedNextStep,
    classificationReason: input?.classificationReasonOverride ?? inquiry.classificationReason,
    recommendedDocuments: parseStringArray(inquiry.precheckRecommendedDocs),
    serviceTags: parseStringArray(inquiry.serviceTags),
    createdAt: inquiry.createdAt.toISOString(),
    dueDate: inquiry.dueDate?.toISOString() ?? null
  });
}
