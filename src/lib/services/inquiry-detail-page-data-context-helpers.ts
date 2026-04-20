import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { buildInquiryDetailComposedData } from "@/lib/services/inquiry-detail-composition-helpers";
import {
  safeGetInquiryReceiptCode,
  safeGetLawbotAnalysis,
  safeGetQuoteWorkspace,
  safeGetReferenceRecommendations
} from "@/lib/services/inquiry-detail-loaders";
import {
  buildDetailOperationalBundle,
  buildDetailRouteAndSignalBundle,
  buildInquiryNormalizedMeta,
  extractInquiryTagLists
} from "@/lib/services/inquiry-detail-page-data-helpers";
import type { InquiryDetailRecord } from "@/lib/services/inquiry-detail-page-data-shared-types";
import {
  buildLawbotConnectionSnapshot,
  buildStoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-service";
import { getLatestCaseMatterForInquiry } from "@/lib/services/case-matter-service";
import { getInquiryMessagePreviewSet } from "@/lib/services/inquiry-service";
import { getInquiryStatusLabel, normalizeInquiryType } from "@/types/inquiry";

export async function loadInquiryDetailPageContext(inquiry: InquiryDetailRecord) {
  const inquiryReceiptCode = await safeGetInquiryReceiptCode({
    id: inquiry.id,
    createdAt: inquiry.createdAt,
    inquiryType: normalizeInquiryType(inquiry.inquiryType)
  });

  const { tags, precheckDocs } = extractInquiryTagLists(inquiry);
  const previews = getInquiryMessagePreviewSet(inquiry);
  const caseAnalysis = analyzeInquiryCase(inquiry);

  const [quoteWorkspace, lawbotAnalysis, referenceRecommendations, latestCaseMatter] = await Promise.all([
    safeGetQuoteWorkspace(inquiry),
    safeGetLawbotAnalysis(inquiry),
    safeGetReferenceRecommendations({
      inquiryType: inquiry.inquiryType,
      serviceTags: tags,
      inquiryTitle: inquiry.title
    }),
    getLatestCaseMatterForInquiry(inquiry.id)
  ]);

  const lawbotConnectionSnapshot = buildLawbotConnectionSnapshot(inquiry);
  const storedLawbotSnapshot = buildStoredLawbotSnapshot(inquiry);
  const normalizedMeta = buildInquiryNormalizedMeta(inquiry);

  const routeAndSignalBundle = buildDetailRouteAndSignalBundle({
    inquiry,
    tags,
    caseAnalysis,
    quoteWorkspace,
    lawbotAnalysis,
    storedLawbotSnapshot,
    inquiryStatus: normalizedMeta.inquiryStatus,
    inquiryUrgency: normalizedMeta.inquiryUrgency
  });

  const operationalBundle = buildDetailOperationalBundle({
    inquiry,
    inquiryStatus: normalizedMeta.inquiryStatus,
    quoteWorkspace,
    lawbotAnalysis,
    storedLawbotSnapshot,
    workflowStep: routeAndSignalBundle.workflowStep,
    routeRecommendationLabel: routeAndSignalBundle.routeRecommendation.recommendationLabel,
    routeRecommendationReason: routeAndSignalBundle.routeRecommendation.recommendationReason
  });

  const composedDetailData = buildInquiryDetailComposedData({
    contactName: inquiry.contactName,
    statusLabel: getInquiryStatusLabel(normalizedMeta.inquiryStatus),
    generatedReceiptMessage: inquiry.generatedReceiptMessage,
    generatedGuidance: inquiry.generatedGuidance,
    classificationConfidence: inquiry.classificationConfidence,
    dueDate: inquiry.dueDate,
    responsePending: inquiry.responsePending,
    caseAnalysis,
    lawbotStatus: lawbotAnalysis.status,
    lawbotOperationalSource: routeAndSignalBundle.lawbotOperationalSource,
    routeRecommendation: routeAndSignalBundle.routeRecommendation,
    routeSignalSummary: routeAndSignalBundle.routeSignalSummary
  });

  return {
    inquiryReceiptCode,
    tags,
    precheckDocs,
    previews,
    caseAnalysis,
    quoteWorkspace,
    lawbotAnalysis,
    referenceRecommendations,
    latestCaseMatter,
    lawbotConnectionSnapshot,
    storedLawbotSnapshot,
    normalizedMeta,
    routeAndSignalBundle,
    operationalBundle,
    composedDetailData
  };
}

export type InquiryDetailPageContext = Awaited<ReturnType<typeof loadInquiryDetailPageContext>>;
