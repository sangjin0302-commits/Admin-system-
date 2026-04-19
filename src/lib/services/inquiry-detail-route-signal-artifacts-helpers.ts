import {
  buildAnalysisHubSignals,
  buildCrossAnalysisSummary,
  buildExternalInsightSlots,
  buildRecommendedCommunicationIds
} from "@/lib/services/inquiry-detail-view-helpers";
import type { LawbotOperationalSource } from "@/lib/services/inquiry-detail-core-types";
import type {
  MockMarketAnalyzeSignal,
  RouteRecommendation
} from "@/lib/services/inquiry-detail-view-types";
import { buildInquiryStatusGuardPreview } from "@/lib/services/inquiry-service";
import { getInquiryStatusLabel } from "@/types/inquiry";
import type {
  InquiryDetailRecord,
  InquiryStatusValue,
  LawbotAnalysisResult,
  QuoteWorkspaceResult,
  StoredSnapshot
} from "@/lib/services/inquiry-detail-page-data-shared-types";

export function buildRouteSignalArtifacts(input: {
  inquiry: InquiryDetailRecord;
  inquiryStatus: InquiryStatusValue;
  quoteWorkspace: QuoteWorkspaceResult;
  lawbotAnalysis: LawbotAnalysisResult;
  storedLawbotSnapshot: StoredSnapshot;
  routeRecommendation: RouteRecommendation;
  lawbotOperationalSource: LawbotOperationalSource;
  mockMarketAnalyzeSignal: MockMarketAnalyzeSignal;
}) {
  const statusGuardPreview = buildInquiryStatusGuardPreview(
    {
      currentStatus: input.inquiryStatus,
      email: input.inquiry.email,
      phone: input.inquiry.phone ?? null,
      description: input.inquiry.description,
      requestedOutcome: input.inquiry.requestedOutcome ?? null,
      hasPreparedDocuments: input.inquiry.hasPreparedDocuments,
      internalMemo: input.inquiry.internalMemo ?? null,
      lawbotSnapshotPayload: input.inquiry.lawbotSnapshotPayload ?? null,
      quoteCount: input.quoteWorkspace.latestQuote ? 1 : 0
    },
    input.routeRecommendation.orderedStatuses.slice(0, 4)
  ).map((item) => ({
    ...item,
    label: getInquiryStatusLabel(item.status)
  }));

  const recommendedCommunicationIds = buildRecommendedCommunicationIds({
    recommendedStatus: input.routeRecommendation.recommendedStatus,
    lawbotDocumentChecklist: input.lawbotOperationalSource.documentChecklist,
    lawbotSummary: input.lawbotOperationalSource.summary
  });

  const analysisHubSignals = buildAnalysisHubSignals({
    lawbotStatus: input.lawbotAnalysis.status,
    lawbotSnapshotStatus: input.storedLawbotSnapshot?.status ?? null,
    recommendationLabel: input.routeRecommendation.recommendationLabel,
    recommendationReason: input.routeRecommendation.recommendationReason,
    recommendedDraftCount: recommendedCommunicationIds.length,
    marketAnalyzeSignal: input.mockMarketAnalyzeSignal
  });

  const crossAnalysisSummary = buildCrossAnalysisSummary({
    recommendationLabel: input.routeRecommendation.recommendationLabel,
    recommendationReason: input.routeRecommendation.recommendationReason,
    lawbotStatus: input.lawbotAnalysis.status,
    lawbotSnapshotStatus: input.storedLawbotSnapshot?.status ?? null,
    marketAnalyzeReady: false,
    recommendedDraftCount: recommendedCommunicationIds.length,
    marketAnalyzeSignal: input.mockMarketAnalyzeSignal
  });

  return {
    statusGuardPreview,
    recommendedCommunicationIds,
    analysisHubSignals,
    crossAnalysisSummary,
    externalInsightSlots: buildExternalInsightSlots()
  };
}
