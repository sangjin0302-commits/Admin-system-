import type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-service";
import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";
import type {
  InquiryStatus,
  InquiryType,
  UrgencyLevel,
} from "@/types/inquiry";

export type SyncConsultationInput = {
  inquiryId: string;
  contactName: string;
  contactPhone?: string | null;
  inquiryTitle: string;
  inquiryType: InquiryType;
  inquiryStatus: InquiryStatus;
  urgencyLevel: UrgencyLevel;
  qualificationScore: number;
  generatedSummary: string;
  recommendedNextStep: string;
  classificationReason?: string | null;
  recommendedDocuments?: string[];
  serviceTags?: string[];
  createdAt?: string | null;
  dueDate?: string | null;
  referenceUrl?: string | null;
};

export type SyncCaseAnalysisInput = {
  inquiryId: string;
  contactName: string;
  contactPhone?: string | null;
  inquiryTitle: string;
  inquiryType: InquiryType;
  inquiryStatus?: InquiryStatus;
  urgencyLevel?: UrgencyLevel;
  qualificationScore?: number;
  generatedSummary?: string | null;
  recommendedNextStep?: string | null;
  classificationReason?: string | null;
  recommendedDocuments?: string[];
  serviceTags?: string[];
  createdAt?: string | null;
  targetAgency?: string | null;
  organizationName?: string | null;
  analysis: InquiryCaseAnalysis;
  contractTitle?: string | null;
  draftNotes?: string | null;
  caseNumber?: string | null;
  dueDate?: string | null;
  workflowStatus?: "시작 전" | "진행 중" | "완료";
  compensationStatus?: string | null;
  lawbotAnalysis?: LawbotCaseAnalysisResult;
};

export type NotionReferenceMaterial = {
  id: string;
  title: string;
  category: string | null;
  resourceType: string | null;
  summary: string | null;
  source: string | null;
  citationUrl: string | null;
  publishedYear: number | null;
  status: string | null;
  score: number;
};

export type NotionReferenceWebsite = {
  id: string;
  title: string;
  organization: string | null;
  fields: string[];
  description: string | null;
  url: string | null;
  score: number;
};

export type NotionReferenceRecommendations = {
  keywords: string[];
  materials: NotionReferenceMaterial[];
  websites: NotionReferenceWebsite[];
};
