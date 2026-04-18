import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { buildInquiryDetailComposedData } from "@/lib/services/inquiry-detail-composition-helpers";
import {
  buildCaseTimeline,
  buildLawbotSnapshotComparison,
  buildOperationsFeed,
  buildStatusHistoryFromLogs,
  getLawbotOperationalSource,
  getWorkflowStep
} from "@/lib/services/inquiry-detail-core-helpers";
import {
  safeGetInquiryReceiptCode,
  safeGetLawbotAnalysis,
  safeGetQuoteWorkspace,
  safeGetReferenceRecommendations
} from "@/lib/services/inquiry-detail-loaders";
import { parseInquiryChecklistState } from "@/lib/services/inquiry-checklist-state";
import {
  buildLawbotConnectionSnapshot,
  buildStoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-service";
import {
  buildInquiryStatusGuardPreview,
  getInquiryMessagePreviewSet,
  parseInquiryCommunicationLogs,
  type InquiryRecord
} from "@/lib/services/inquiry-service";
import {
  parseStructuredOperationsMemo,
  stripStructuredOperationsMemo
} from "@/lib/services/operations-memo";
import {
  buildAnalysisHubSignals,
  buildCrossAnalysisSummary,
  buildExternalInsightSlots,
  buildMockMarketAnalyzeSignal,
  buildRecommendedCommunicationIds,
  buildRouteSignalSummary,
  getQuickStatuses,
  recommendOperationalRoute
} from "@/lib/services/inquiry-detail-view-helpers";
import { parseJsonArray } from "@/lib/utils";
import {
  getInquiryStatusLabel,
  getUrgencyLabel,
  normalizeClientType,
  normalizeInquiryStatus,
  normalizeInquiryType,
  normalizeLanguageCode,
  normalizeUrgencyLevel
} from "@/types/inquiry";

type InquiryDetailRecord = NonNullable<InquiryRecord>;

export async function buildInquiryDetailPageData(inquiry: InquiryDetailRecord) {
  const inquiryReceiptCode = await safeGetInquiryReceiptCode({
    id: inquiry.id,
    createdAt: inquiry.createdAt,
    inquiryType: normalizeInquiryType(inquiry.inquiryType)
  });

  const tags = parseJsonArray(inquiry.serviceTags)
    .map((entry) => String(entry).trim())
    .filter(Boolean);
  const precheckDocs = parseJsonArray(inquiry.precheckRecommendedDocs)
    .map((entry) => String(entry).trim())
    .filter(Boolean);

  const previews = getInquiryMessagePreviewSet(inquiry);
  const caseAnalysis = analyzeInquiryCase(inquiry);

  const [quoteWorkspace, lawbotAnalysis, referenceRecommendations] = await Promise.all([
    safeGetQuoteWorkspace(inquiry),
    safeGetLawbotAnalysis(inquiry),
    safeGetReferenceRecommendations({
      inquiryType: inquiry.inquiryType,
      serviceTags: tags,
      inquiryTitle: inquiry.title
    })
  ]);

  const lawbotConnectionSnapshot = buildLawbotConnectionSnapshot(inquiry);
  const storedLawbotSnapshot = buildStoredLawbotSnapshot(inquiry);
  const inquiryStatus = normalizeInquiryStatus(inquiry.status);
  const inquiryUrgency = normalizeUrgencyLevel(inquiry.urgencyLevel);
  const inquiryType = normalizeInquiryType(inquiry.inquiryType);
  const inquiryLanguage = normalizeLanguageCode(inquiry.preferredLanguage);
  const inquiryClientType = normalizeClientType(inquiry.clientType);
  const requestedInquiryType = normalizeInquiryType(inquiry.requestedInquiryType ?? "UNKNOWN");
  const declaredUrgency = normalizeUrgencyLevel(inquiry.declaredUrgency ?? "MEDIUM");
  const quickStatuses = getQuickStatuses(caseAnalysis.strengthLabel);

  const workflowStep = getWorkflowStep({
    inquiryStatus,
    quoteStatus: quoteWorkspace.latestQuote?.status ?? null,
    caseStage: quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null
  });

  const lawbotOperationalSource = getLawbotOperationalSource({
    lawbotStatus: lawbotAnalysis.status,
    liveAnalysis: lawbotAnalysis,
    storedSnapshot: storedLawbotSnapshot
  });

  const mockMarketAnalyzeSignal = buildMockMarketAnalyzeSignal({
    inquiryTitle: inquiry.title,
    tags,
    urgencyLabel: getUrgencyLabel(inquiryUrgency),
    recommendedStatusLabel: getInquiryStatusLabel(inquiryStatus),
    lawbotStatus: lawbotAnalysis.status,
    documentChecklistCount: lawbotOperationalSource.documentChecklist.length,
    reviewReasonCount: lawbotOperationalSource.reviewReasons.length
  });

  const routeRecommendation = recommendOperationalRoute({
    strengthLabel: caseAnalysis.strengthLabel,
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

  const statusGuardPreview = buildInquiryStatusGuardPreview(
    {
      currentStatus: inquiryStatus,
      email: inquiry.email,
      phone: inquiry.phone ?? null,
      description: inquiry.description,
      requestedOutcome: inquiry.requestedOutcome ?? null,
      hasPreparedDocuments: inquiry.hasPreparedDocuments,
      internalMemo: inquiry.internalMemo ?? null,
      lawbotSnapshotPayload: inquiry.lawbotSnapshotPayload ?? null,
      quoteCount: quoteWorkspace.latestQuote ? 1 : 0
    },
    routeRecommendation.orderedStatuses.slice(0, 4)
  ).map((item) => ({
    ...item,
    label: getInquiryStatusLabel(item.status)
  }));

  const recommendedCommunicationIds = buildRecommendedCommunicationIds({
    recommendedStatus: routeRecommendation.recommendedStatus,
    lawbotDocumentChecklist: lawbotOperationalSource.documentChecklist,
    lawbotSummary: lawbotOperationalSource.summary
  });

  const analysisHubSignals = buildAnalysisHubSignals({
    lawbotStatus: lawbotAnalysis.status,
    lawbotSnapshotStatus: storedLawbotSnapshot?.status ?? null,
    recommendationLabel: routeRecommendation.recommendationLabel,
    recommendationReason: routeRecommendation.recommendationReason,
    recommendedDraftCount: recommendedCommunicationIds.length,
    marketAnalyzeSignal: mockMarketAnalyzeSignal
  });

  const crossAnalysisSummary = buildCrossAnalysisSummary({
    recommendationLabel: routeRecommendation.recommendationLabel,
    recommendationReason: routeRecommendation.recommendationReason,
    lawbotStatus: lawbotAnalysis.status,
    lawbotSnapshotStatus: storedLawbotSnapshot?.status ?? null,
    marketAnalyzeReady: false,
    recommendedDraftCount: recommendedCommunicationIds.length,
    marketAnalyzeSignal: mockMarketAnalyzeSignal
  });

  const externalInsightSlots = buildExternalInsightSlots();
  const checklistSnapshot = parseInquiryChecklistState(inquiry.internalMemo);
  const internalMemoWithoutChecklist = checklistSnapshot.memo;

  const operationsFeed = buildOperationsFeed({
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    statusLabel: getInquiryStatusLabel(inquiryStatus),
    quoteStatus: quoteWorkspace.latestQuote?.status ?? null,
    caseStage: quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
    lawbotStatus: lawbotAnalysis.status,
    lawbotSnapshotStatus: storedLawbotSnapshot?.status ?? null,
    dueDate: inquiry.dueDate,
    internalMemo: internalMemoWithoutChecklist
  });

  const lawbotSnapshotComparison = buildLawbotSnapshotComparison({
    liveAnalysis: lawbotAnalysis,
    storedSnapshot: storedLawbotSnapshot
  });

  const caseTimeline = buildCaseTimeline({
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    inquiryStatusLabel: getInquiryStatusLabel(inquiryStatus),
    workflowStep,
    lawbotStatus: lawbotAnalysis.status,
    lawbotSnapshotStatus: storedLawbotSnapshot?.status ?? null,
    routeRecommendationLabel: routeRecommendation.recommendationLabel,
    routeRecommendationReason: routeRecommendation.recommendationReason,
    quoteStatus: quoteWorkspace.latestQuote?.status ?? null,
    caseStage: quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
    dueDate: inquiry.dueDate,
    internalMemo: internalMemoWithoutChecklist
  });

  const structuredInternalMemo = parseStructuredOperationsMemo(internalMemoWithoutChecklist);
  const internalMemoDisplay = stripStructuredOperationsMemo(internalMemoWithoutChecklist);
  const communicationLogs = parseInquiryCommunicationLogs(inquiry.communicationLogs);
  const statusHistoryItems = buildStatusHistoryFromLogs(communicationLogs);

  const composedDetailData = buildInquiryDetailComposedData({
    contactName: inquiry.contactName,
    statusLabel: getInquiryStatusLabel(inquiryStatus),
    generatedReceiptMessage: inquiry.generatedReceiptMessage,
    generatedGuidance: inquiry.generatedGuidance,
    classificationConfidence: inquiry.classificationConfidence,
    dueDate: inquiry.dueDate,
    responsePending: inquiry.responsePending,
    caseAnalysis,
    lawbotStatus: lawbotAnalysis.status,
    lawbotOperationalSource,
    routeRecommendation,
    routeSignalSummary
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
    lawbotConnectionSnapshot,
    storedLawbotSnapshot,
    inquiryStatus,
    inquiryUrgency,
    inquiryType,
    inquiryLanguage,
    inquiryClientType,
    requestedInquiryType,
    declaredUrgency,
    quickStatuses,
    workflowStep,
    routeRecommendation,
    routeSignalSummary,
    quickStatusOptions,
    statusGuardPreview,
    recommendedCommunicationIds,
    analysisHubSignals,
    crossAnalysisSummary,
    mockMarketAnalyzeSignal,
    externalInsightSlots,
    checklistSnapshot,
    internalMemoWithoutChecklist,
    operationsFeed,
    lawbotSnapshotComparison,
    caseTimeline,
    structuredInternalMemo,
    internalMemoDisplay,
    communicationLogs,
    statusHistoryItems,
    ...composedDetailData
  };
}
