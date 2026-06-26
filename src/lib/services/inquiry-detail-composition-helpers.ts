import type { InquiryCommunicationDraft } from "@/components/admin/inquiry-communication-center";
import { buildAutomationActions, buildOperationsDraft } from "@/lib/services/inquiry-detail-action-helpers";
import { stripStructuredOperationsMemo } from "@/lib/services/operations-memo";
import {
  buildDetailImmediateActions,
  buildDetailRiskHighlights,
  buildLawbotClientSummary,
  buildLawbotDocumentRequest
} from "@/lib/services/inquiry-detail-view-helpers";
import type { InquiryStatus } from "@/types/inquiry";

type CaseAnalysisLike = {
  strengthLabel: "강함" | "보통" | "주의" | "불리";
  resolutionProbabilityPercent: number;
  recommendedAction: string;
  missingFacts: string[];
  communicationGuidance: {
    clientSummary: string;
    documentRequest: string;
  };
};

type LawbotOperationalSourceLike = {
  sourceLabel: string;
  practicalUseStatus: string | null;
  summary: string | null;
  priorityActions: string[];
  missingFacts: string[];
  documentChecklist: string[];
  reviewReasons: string[];
  riskFlags: string[];
};

type RouteRecommendationLike = {
  recommendedStatus: InquiryStatus;
  recommendationLabel: string;
  recommendationReason: string;
};

type AutomationAction = {
  label: string;
  description: string;
  status: InquiryStatus;
  memo: string;
  recommended?: boolean;
  recommendationNote?: string;
};

export function buildInquiryDetailComposedData(input: {
  contactName: string;
  statusLabel: string;
  generatedReceiptMessage: string;
  generatedGuidance: string;
  classificationConfidence: number;
  dueDate?: Date | null;
  responsePending: boolean;
  caseAnalysis: CaseAnalysisLike;
  lawbotStatus: string;
  lawbotOperationalSource: LawbotOperationalSourceLike;
  routeRecommendation: RouteRecommendationLike;
  routeSignalSummary: string;
}) {
  const suggestedCommunicationChecklist = Array.from(
    new Set([
      ...input.caseAnalysis.missingFacts,
      ...input.lawbotOperationalSource.documentChecklist,
      ...input.lawbotOperationalSource.reviewReasons
    ])
  ).slice(0, 8);

  const operationsDraft = buildOperationsDraft({
    contactName: input.contactName,
    statusLabel: input.statusLabel,
    strengthLabel: input.caseAnalysis.strengthLabel,
    probability: input.caseAnalysis.resolutionProbabilityPercent,
    recommendedAction: input.caseAnalysis.recommendedAction,
    routeRecommendationLabel: input.routeRecommendation.recommendationLabel,
    routeRecommendationReason: input.routeRecommendation.recommendationReason,
    lawbotStatus: input.lawbotStatus,
    missingFacts: input.caseAnalysis.missingFacts,
    lawbotSummary: input.lawbotOperationalSource.summary,
    lawbotSourceLabel: input.lawbotOperationalSource.sourceLabel,
    lawbotPriorityActions: input.lawbotOperationalSource.priorityActions,
    lawbotDocumentChecklist: input.lawbotOperationalSource.documentChecklist,
    lawbotReviewReasons: input.lawbotOperationalSource.reviewReasons,
    lawbotRiskFlags: input.lawbotOperationalSource.riskFlags,
    lawbotPracticalUseStatus: input.lawbotOperationalSource.practicalUseStatus,
    routeSignalSummary: input.routeSignalSummary
  });
  const operationsDraftDisplay = stripStructuredOperationsMemo(operationsDraft);

  const communicationDrafts: InquiryCommunicationDraft[] = [
    {
      id: "receipt",
      label: "접수 완료 안내",
      description: "고객이 접수 직후 받는 기본 안내문입니다.",
      content: input.generatedReceiptMessage,
      badge: "기본",
      recommendedWhen: "문의가 접수된 직후",
      channelHint: "이메일 또는 문자"
    },
    {
      id: "guidance",
      label: "준비 서류 안내",
      description: "초기 접수 후 가장 먼저 보낼 수 있는 준비 서류 안내입니다.",
      content: input.generatedGuidance,
      badge: "서류",
      recommendedWhen: "초기 검토 후 자료 요청이 필요할 때",
      channelHint: "이메일 또는 카카오톡"
    },
    {
      id: "client-summary",
      label: "사건 검토 안내",
      description: "AI 사건 분석과 Lawbot 결과를 함께 반영해 고객에게 현재 상황을 설명하는 문안입니다.",
      content: buildLawbotClientSummary({
        contactName: input.contactName,
        defaultSummary: input.caseAnalysis.communicationGuidance.clientSummary,
        lawbotSourceLabel: input.lawbotOperationalSource.sourceLabel,
        lawbotSummary: input.lawbotOperationalSource.summary,
        lawbotPracticalUseStatus: input.lawbotOperationalSource.practicalUseStatus,
        lawbotReviewReasons: input.lawbotOperationalSource.reviewReasons,
        routeSignalSummary: input.routeSignalSummary
      }),
      badge: input.lawbotOperationalSource.summary ? "AI+Lawbot" : "AI",
      recommendedWhen: "상담 전 또는 1차 검토 결과를 설명할 때",
      channelHint: "이메일 또는 상담 후 안내문"
    },
    {
      id: "document-request",
      label: "자료 요청 문안",
      description: "누락 사실과 Lawbot 준비 자료 체크리스트를 함께 반영한 요청문입니다.",
      content: buildLawbotDocumentRequest({
        contactName: input.contactName,
        defaultRequest: input.caseAnalysis.communicationGuidance.documentRequest,
        lawbotDocumentChecklist: input.lawbotOperationalSource.documentChecklist,
        lawbotMissingFacts: input.lawbotOperationalSource.missingFacts,
        routeSignalSummary: input.routeSignalSummary
      }),
      badge: input.lawbotOperationalSource.documentChecklist.length ? "요청+Lawbot" : "요청",
      recommendedWhen: "핵심 사실관계가 부족하거나 서류 보완이 필요할 때",
      channelHint: "이메일, 문자, 카카오톡"
    },
    {
      id: "operations-note",
      label: "운영 메모 초안",
      description: "내부 공유 또는 상담 전 요약 메모로 쓰는 문안입니다.",
      content: operationsDraft,
      badge: input.lawbotOperationalSource.summary ? "내부+Lawbot" : "내부",
      recommendedWhen: "담당자 인수인계 또는 상담 준비 시",
      channelHint: "내부 메모"
    }
  ];

  const automationActions = buildAutomationActions({
    contactName: input.contactName,
    strengthLabel: input.caseAnalysis.strengthLabel,
    recommendedAction: input.caseAnalysis.recommendedAction,
    missingFacts: input.caseAnalysis.missingFacts,
    lawbotPriorityActions: input.lawbotOperationalSource.priorityActions,
    lawbotDocumentChecklist: input.lawbotOperationalSource.documentChecklist,
    lawbotReviewReasons: input.lawbotOperationalSource.reviewReasons,
    lawbotRiskFlags: input.lawbotOperationalSource.riskFlags,
    lawbotPracticalUseStatus: input.lawbotOperationalSource.practicalUseStatus,
    routeSignalSummary: input.routeSignalSummary,
    routeRecommendation: input.routeRecommendation
  }).sort((left: AutomationAction, right: AutomationAction) => {
    const priorityOrder: Record<InquiryStatus, number> = {
      [input.routeRecommendation.recommendedStatus]: 0,
      NEW: 5,
      PRE_DIAGNOSED: 5,
      CONSULTATION_REQUIRED: 1,
      QUOTE_DRAFTED: 1,
      QUOTE_PENDING: 4,
      ON_HOLD: 1,
      IN_REVIEW: 1,
      WAITING_CONSULTATION: 4,
      QUOTE_SENT: 4,
      WON: 5,
      CLOSED: 5
    };

    return (priorityOrder[left.status] ?? 3) - (priorityOrder[right.status] ?? 3);
  });

  const classificationConfidencePercent = Number.isFinite(input.classificationConfidence)
    ? Math.round(Math.max(0, Math.min(1, input.classificationConfidence)) * 100)
    : 0;

  const detailRiskHighlights = buildDetailRiskHighlights({
    dueDate: input.dueDate,
    responsePending: input.responsePending,
    missingFacts: input.caseAnalysis.missingFacts,
    documentChecklist: input.lawbotOperationalSource.documentChecklist,
    reviewReasons: input.lawbotOperationalSource.reviewReasons,
    riskFlags: input.lawbotOperationalSource.riskFlags
  });

  const detailImmediateActions = buildDetailImmediateActions({
    dueDate: input.dueDate,
    responsePending: input.responsePending,
    missingFacts: input.caseAnalysis.missingFacts,
    documentChecklist: input.lawbotOperationalSource.documentChecklist,
    reviewReasons: input.lawbotOperationalSource.reviewReasons,
    routeRecommendationLabel: input.routeRecommendation.recommendationLabel
  });

  const checklistActionItems = detailImmediateActions.map((item, index) => ({
    id: `detail-action-${index + 1}`,
    label: `우선 조치 ${index + 1}`,
    description: item
  }));

  return {
    suggestedCommunicationChecklist,
    operationsDraft,
    operationsDraftDisplay,
    communicationDrafts,
    automationActions,
    classificationConfidencePercent,
    detailRiskHighlights,
    detailImmediateActions,
    checklistActionItems
  };
}
