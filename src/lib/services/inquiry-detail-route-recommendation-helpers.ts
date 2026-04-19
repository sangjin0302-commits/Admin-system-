import {
  getLawbotOperationalSource,
  getWorkflowStep
} from "@/lib/services/inquiry-detail-core-helpers";
import {
  buildMockMarketAnalyzeSignal,
  buildRouteSignalSummary,
  getQuickStatuses,
  recommendOperationalRoute
} from "@/lib/services/inquiry-detail-view-helpers";
import { getInquiryStatusLabel, getUrgencyLabel } from "@/types/inquiry";
import type {
  CaseAnalysisResult,
  InquiryDetailRecord,
  InquiryStatusValue,
  InquiryUrgencyValue,
  LawbotAnalysisResult,
  QuoteWorkspaceResult,
  StoredSnapshot
} from "@/lib/services/inquiry-detail-page-data-shared-types";

export function buildRouteRecommendationArtifacts(input: {
  inquiry: InquiryDetailRecord;
  tags: string[];
  caseAnalysis: CaseAnalysisResult;
  quoteWorkspace: QuoteWorkspaceResult;
  lawbotAnalysis: LawbotAnalysisResult;
  storedLawbotSnapshot: StoredSnapshot;
  inquiryStatus: InquiryStatusValue;
  inquiryUrgency: InquiryUrgencyValue;
}) {
  const quickStatuses = getQuickStatuses(input.caseAnalysis.strengthLabel);
  const workflowStep = getWorkflowStep({
    inquiryStatus: input.inquiryStatus,
    quoteStatus: input.quoteWorkspace.latestQuote?.status ?? null,
    caseStage: input.quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null
  });

  const lawbotOperationalSource = getLawbotOperationalSource({
    lawbotStatus: input.lawbotAnalysis.status,
    liveAnalysis: input.lawbotAnalysis,
    storedSnapshot: input.storedLawbotSnapshot
  });

  const mockMarketAnalyzeSignal = buildMockMarketAnalyzeSignal({
    inquiryTitle: input.inquiry.title,
    tags: input.tags,
    urgencyLabel: getUrgencyLabel(input.inquiryUrgency),
    recommendedStatusLabel: getInquiryStatusLabel(input.inquiryStatus),
    lawbotStatus: input.lawbotAnalysis.status,
    documentChecklistCount: lawbotOperationalSource.documentChecklist.length,
    reviewReasonCount: lawbotOperationalSource.reviewReasons.length
  });

  const routeRecommendation = recommendOperationalRoute({
    strengthLabel: input.caseAnalysis.strengthLabel,
    quickStatuses,
    lawbotPracticalUseStatus: lawbotOperationalSource.practicalUseStatus,
    lawbotReviewReasons: lawbotOperationalSource.reviewReasons,
    lawbotDocumentChecklist: lawbotOperationalSource.documentChecklist,
    lawbotPriorityActions: lawbotOperationalSource.priorityActions,
    lawbotRiskFlags: lawbotOperationalSource.riskFlags,
    lawbotMissingFacts: lawbotOperationalSource.missingFacts,
    marketAnalyzeSignal: mockMarketAnalyzeSignal
  });

  const routeSignalSummary = buildRouteSignalSummary({
    lawbotSourceLabel: lawbotOperationalSource.sourceLabel,
    lawbotPracticalUseStatus: lawbotOperationalSource.practicalUseStatus,
    marketAnalyzeSignal: mockMarketAnalyzeSignal
  });

  const quickStatusOptions = routeRecommendation.orderedStatuses.map((status) => ({
    code: status,
    label: getInquiryStatusLabel(status),
    recommended: status === routeRecommendation.recommendedStatus
  }));

  return {
    quickStatuses,
    workflowStep,
    lawbotOperationalSource,
    mockMarketAnalyzeSignal,
    routeRecommendation,
    routeSignalSummary,
    quickStatusOptions
  };
}
