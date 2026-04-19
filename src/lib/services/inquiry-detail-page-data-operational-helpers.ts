import {
  buildCaseTimeline,
  buildLawbotSnapshotComparison,
  buildOperationsFeed,
  buildStatusHistoryFromLogs
} from "@/lib/services/inquiry-detail-core-helpers";
import { parseInquiryChecklistState } from "@/lib/services/inquiry-checklist-state";
import { parseInquiryCommunicationLogs } from "@/lib/services/inquiry-service";
import {
  parseStructuredOperationsMemo,
  stripStructuredOperationsMemo
} from "@/lib/services/operations-memo";
import { getInquiryStatusLabel } from "@/types/inquiry";
import type {
  InquiryDetailRecord,
  InquiryStatusValue,
  LawbotAnalysisResult,
  QuoteWorkspaceResult,
  StoredSnapshot
} from "@/lib/services/inquiry-detail-page-data-shared-types";

export function buildDetailOperationalBundle(input: {
  inquiry: InquiryDetailRecord;
  inquiryStatus: InquiryStatusValue;
  quoteWorkspace: QuoteWorkspaceResult;
  lawbotAnalysis: LawbotAnalysisResult;
  storedLawbotSnapshot: StoredSnapshot;
  workflowStep: string;
  routeRecommendationLabel: string;
  routeRecommendationReason: string;
}) {
  const checklistSnapshot = parseInquiryChecklistState(input.inquiry.internalMemo);
  const internalMemoWithoutChecklist = checklistSnapshot.memo;

  const operationsFeed = buildOperationsFeed({
    createdAt: input.inquiry.createdAt,
    updatedAt: input.inquiry.updatedAt,
    statusLabel: getInquiryStatusLabel(input.inquiryStatus),
    quoteStatus: input.quoteWorkspace.latestQuote?.status ?? null,
    caseStage: input.quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
    lawbotStatus: input.lawbotAnalysis.status,
    lawbotSnapshotStatus: input.storedLawbotSnapshot?.status ?? null,
    dueDate: input.inquiry.dueDate,
    internalMemo: internalMemoWithoutChecklist
  });

  const lawbotSnapshotComparison = buildLawbotSnapshotComparison({
    liveAnalysis: input.lawbotAnalysis,
    storedSnapshot: input.storedLawbotSnapshot
  });

  const caseTimeline = buildCaseTimeline({
    createdAt: input.inquiry.createdAt,
    updatedAt: input.inquiry.updatedAt,
    inquiryStatusLabel: getInquiryStatusLabel(input.inquiryStatus),
    workflowStep: input.workflowStep,
    lawbotStatus: input.lawbotAnalysis.status,
    lawbotSnapshotStatus: input.storedLawbotSnapshot?.status ?? null,
    routeRecommendationLabel: input.routeRecommendationLabel,
    routeRecommendationReason: input.routeRecommendationReason,
    quoteStatus: input.quoteWorkspace.latestQuote?.status ?? null,
    caseStage: input.quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
    dueDate: input.inquiry.dueDate,
    internalMemo: internalMemoWithoutChecklist
  });

  const structuredInternalMemo = parseStructuredOperationsMemo(internalMemoWithoutChecklist);
  const internalMemoDisplay = stripStructuredOperationsMemo(internalMemoWithoutChecklist);
  const communicationLogs = parseInquiryCommunicationLogs(input.inquiry.communicationLogs);
  const statusHistoryItems = buildStatusHistoryFromLogs(communicationLogs);

  return {
    checklistSnapshot,
    internalMemoWithoutChecklist,
    operationsFeed,
    lawbotSnapshotComparison,
    caseTimeline,
    structuredInternalMemo,
    internalMemoDisplay,
    communicationLogs,
    statusHistoryItems
  };
}
