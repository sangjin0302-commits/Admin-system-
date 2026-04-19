import { buildRouteRecommendationArtifacts } from "@/lib/services/inquiry-detail-route-recommendation-helpers";
import { buildRouteSignalArtifacts } from "@/lib/services/inquiry-detail-route-signal-artifacts-helpers";
import type {
  CaseAnalysisResult,
  InquiryDetailRecord,
  InquiryStatusValue,
  InquiryUrgencyValue,
  LawbotAnalysisResult,
  QuoteWorkspaceResult,
  StoredSnapshot
} from "@/lib/services/inquiry-detail-page-data-shared-types";

export function buildDetailRouteAndSignalBundle(input: {
  inquiry: InquiryDetailRecord;
  tags: string[];
  caseAnalysis: CaseAnalysisResult;
  quoteWorkspace: QuoteWorkspaceResult;
  lawbotAnalysis: LawbotAnalysisResult;
  storedLawbotSnapshot: StoredSnapshot;
  inquiryStatus: InquiryStatusValue;
  inquiryUrgency: InquiryUrgencyValue;
}) {
  const recommendationArtifacts = buildRouteRecommendationArtifacts(input);
  const signalArtifacts = buildRouteSignalArtifacts({
    inquiry: input.inquiry,
    inquiryStatus: input.inquiryStatus,
    quoteWorkspace: input.quoteWorkspace,
    lawbotAnalysis: input.lawbotAnalysis,
    storedLawbotSnapshot: input.storedLawbotSnapshot,
    routeRecommendation: recommendationArtifacts.routeRecommendation,
    lawbotOperationalSource: recommendationArtifacts.lawbotOperationalSource,
    mockMarketAnalyzeSignal: recommendationArtifacts.mockMarketAnalyzeSignal
  });

  return {
    ...recommendationArtifacts,
    ...signalArtifacts
  };
}
