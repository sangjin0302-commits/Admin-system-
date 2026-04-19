import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { safeGetLawbotAnalysis, safeGetQuoteWorkspace } from "@/lib/services/inquiry-detail-loaders";
import { buildStoredLawbotSnapshot } from "@/lib/services/lawbot-case-analysis-service";
import type { InquiryRecord } from "@/lib/services/inquiry-service";
import { normalizeInquiryStatus, normalizeUrgencyLevel } from "@/types/inquiry";

export type InquiryDetailRecord = NonNullable<InquiryRecord>;
export type QuoteWorkspaceResult = Awaited<ReturnType<typeof safeGetQuoteWorkspace>>;
export type LawbotAnalysisResult = Awaited<ReturnType<typeof safeGetLawbotAnalysis>>;
export type CaseAnalysisResult = ReturnType<typeof analyzeInquiryCase>;
export type StoredSnapshot = ReturnType<typeof buildStoredLawbotSnapshot>;
export type InquiryStatusValue = ReturnType<typeof normalizeInquiryStatus>;
export type InquiryUrgencyValue = ReturnType<typeof normalizeUrgencyLevel>;
