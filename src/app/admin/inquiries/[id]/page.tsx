import { notFound } from "next/navigation";

import { InquiryCaseAnalysisPanel } from "@/components/admin/inquiry-case-analysis-panel";
import { InquiryCaseTimeline, type InquiryCaseTimelineItem } from "@/components/admin/inquiry-case-timeline";
import { InquiryCommunicationCenter } from "@/components/admin/inquiry-communication-center";
import { InquiryDecisionBoard } from "@/components/admin/inquiry-decision-board";
import { InquiryExecutionPlaybook } from "@/components/admin/inquiry-execution-playbook";
import { LawbotCaseAnalysisPanel } from "@/components/admin/lawbot-case-analysis-panel";
import { LawbotSnapshotCompare } from "@/components/admin/lawbot-snapshot-compare";
import { InquiryManagementForm } from "@/components/admin/inquiry-management-form";
import { InquiryMessagePreview } from "@/components/admin/inquiry-message-preview";
import { InquiryOperationsFeedPanel } from "@/components/admin/inquiry-operations-feed-panel-clean";
import { InquiryOperationalSummary } from "@/components/admin/inquiry-operational-summary";
import { ReferenceRecommendationsPanel } from "@/components/admin/reference-recommendations-panel";
import { QuoteWorkspacePanel } from "@/components/admin/quote-workspace";
import { WorkflowProgressPanel } from "@/components/admin/workflow-progress-panel-clean";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getNotionReferenceRecommendations } from "@/lib/integrations/notion";
import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import {
  buildStoredLawbotSnapshot,
  buildLawbotConnectionSnapshot,
  getLawbotCaseAnalysis,
  type StoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-service";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import {
  buildInquiryStatusGuardPreview,
  getInquiryById,
  getInquiryMessagePreviewSet,
} from "@/lib/services/inquiry-service";
import { getInquiryReceiptCode } from "@/lib/services/inquiry-receipt-code";
import { getQuoteWorkspaceForInquiry } from "@/lib/services/quote-service";
import {
  parseStructuredOperationsMemo,
  serializeStructuredOperationsMemo,
  stripStructuredOperationsMemo
} from "@/lib/services/operations-memo";
import {
  clientTypeLabels,
  type InquiryStatus,
  type InquiryType,
  inquiryStatusLabels,
  inquiryTypeLabels,
  languageCodeLabels,
  urgencyLabels
} from "@/types/inquiry";

export const dynamic = "force-dynamic";

function getQuickStatuses(strengthLabel: "강함" | "보통" | "주의" | "불리"): InquiryStatus[] {
  if (strengthLabel === "강함") {
    return ["QUOTE_DRAFTED", "QUOTE_PENDING", "IN_REVIEW"];
  }

  if (strengthLabel === "보통") {
    return ["CONSULTATION_REQUIRED", "IN_REVIEW", "QUOTE_DRAFTED"];
  }

  if (strengthLabel === "주의") {
    return ["IN_REVIEW", "WAITING_CONSULTATION", "ON_HOLD"];
  }

  return ["IN_REVIEW", "ON_HOLD"];
}

function getWorkflowStep(input: {
  inquiryStatus: InquiryStatus;
  quoteStatus?: string | null;
  caseStage?: string | null;
}) {
  if (input.inquiryStatus === "CLOSED" || input.caseStage === "CLOSED" || input.caseStage === "COMPLETED") {
    return "CLOSED";
  }

  if (
    input.caseStage &&
    input.caseStage !== "CONTRACT_PREPARATION" &&
    input.caseStage !== "ON_HOLD"
  ) {
    return "CASEWORK";
  }

  if (input.inquiryStatus === "WON" || input.quoteStatus === "ACCEPTED" || input.caseStage === "CONTRACT_PREPARATION") {
    return "CONTRACT";
  }

  if (
    input.inquiryStatus === "QUOTE_DRAFTED" ||
    input.inquiryStatus === "QUOTE_PENDING" ||
    input.inquiryStatus === "QUOTE_SENT" ||
    input.quoteStatus
  ) {
    return "QUOTING";
  }

  if (
    input.inquiryStatus === "PRE_DIAGNOSED" ||
    input.inquiryStatus === "CONSULTATION_REQUIRED" ||
    input.inquiryStatus === "IN_REVIEW" ||
    input.inquiryStatus === "WAITING_CONSULTATION"
  ) {
    return "ANALYZED";
  }

  return "RECEIVED";
}

function buildOperationsFeed(input: {
  createdAt: Date;
  updatedAt: Date;
  statusLabel: string;
  quoteStatus?: string | null;
  caseStage?: string | null;
  lawbotStatus: string;
  lawbotSnapshotStatus?: string | null;
  dueDate?: Date | null;
  internalMemo?: string | null;
}) {
  const structuredMemo = parseStructuredOperationsMemo(input.internalMemo);
  const memoBodyLines = structuredMemo?.body.split("\n") ?? input.internalMemo?.split("\n") ?? [];
  const recommendedRouteLine =
    structuredMemo?.metadata.recommendationLabel
      ? `추천 경로: ${structuredMemo.metadata.recommendationLabel}`
      : input.internalMemo
          ?.split("\n")
          .find((line) => line.startsWith("추천 경로:"));
  const recommendedReasonLine =
    structuredMemo?.metadata.recommendationReason
      ? `추천 근거: ${structuredMemo.metadata.recommendationReason}`
      : input.internalMemo
          ?.split("\n")
          .find((line) => line.startsWith("추천 근거:"));

  const feed = [
    {
      label: "접수 생성",
      description: "초기 문의가 등록되고 요약 및 사전진단 정보가 생성되었습니다.",
      timestamp: formatDateTime(input.createdAt)
    },
    {
      label: "현재 상태 반영",
      description: `현재 운영 상태는 ${input.statusLabel} 단계입니다.`,
      timestamp: formatDateTime(input.updatedAt)
    }
  ];

  if (input.lawbotStatus === "available") {
    feed.push({
      label: "Lawbot 참고 분석 완료",
      description: "관련 법령, 판례, 해석례 추천과 후속 검색어가 연결되었습니다.",
      timestamp: formatDateTime(input.updatedAt)
    });
  } else if (input.lawbotSnapshotStatus) {
    feed.push({
      label: "Lawbot 저장 스냅샷 유지",
      description: `실시간 연결과 별개로 마지막 저장 결과(${input.lawbotSnapshotStatus})를 기준으로 검토를 이어갈 수 있습니다.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.quoteStatus) {
    feed.push({
      label: "견적 흐름 연결",
      description: `견적 상태는 ${input.quoteStatus} 단계까지 연결되어 있습니다.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.caseStage) {
    feed.push({
      label: "사건 진행 상태",
      description: `사건 기록은 ${input.caseStage} 단계까지 반영되어 있습니다.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.dueDate) {
    feed.push({
      label: "일정 정보 반영",
      description: `희망 일정 또는 마감 일정이 ${formatDateTime(input.dueDate)} 기준으로 입력되어 있습니다.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.internalMemo?.includes("[자동 액션]")) {
    const memoSummary =
      structuredMemo?.metadata.summary ??
      memoBodyLines
        .find(
          (line) =>
            line.trim() &&
            !line.includes("[자동 액션]") &&
            !line.startsWith("추천 경로:") &&
            !line.startsWith("추천 근거:")
        ) ??
      "최근 추천 액션 메모가 반영되었습니다.";

    feed.push({
      label: "추천 액션 메모 반영",
      description: memoSummary,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (recommendedRouteLine || recommendedReasonLine) {
    feed.push({
      label: "추천 경로 기록",
      description: [recommendedRouteLine, recommendedReasonLine].filter(Boolean).join(" / "),
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  return feed;
}

function buildCaseTimeline(input: {
  createdAt: Date;
  updatedAt: Date;
  inquiryStatusLabel: string;
  workflowStep: string;
  lawbotStatus: string;
  lawbotSnapshotStatus?: string | null;
  routeRecommendationLabel: string;
  routeRecommendationReason: string;
  quoteStatus?: string | null;
  caseStage?: string | null;
  dueDate?: Date | null;
  internalMemo?: string | null;
}): InquiryCaseTimelineItem[] {
  const workflowStepLabels: Record<string, string> = {
    RECEIVED: "접수",
    ANALYZED: "분석",
    QUOTING: "견적",
    CONTRACT: "계약/수임",
    CASEWORK: "사건 진행",
    CLOSED: "종결"
  };
  const items: InquiryCaseTimelineItem[] = [
    {
      title: "문의 접수",
      description: "고객 문의가 등록되고 초기 요약 및 사전진단 정보가 생성되었습니다.",
      timestamp: formatDateTime(input.createdAt),
      tone: "primary",
      emphasis: `현재 운영 상태 · ${input.inquiryStatusLabel}`
    }
  ];

  items.push({
    title: "운영 기준 확정",
      description: `현재 고객 사건은 ${input.routeRecommendationLabel} 흐름을 기준으로 움직입니다. ${input.routeRecommendationReason}`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "primary",
      emphasis: `워크플로우 단계 · ${workflowStepLabels[input.workflowStep] ?? input.workflowStep}`
    });

  if (input.lawbotStatus === "available") {
    items.push({
      title: "Lawbot 분석 반영",
      description: "실시간 Lawbot 결과가 고객 사건 검토, 추천 경로, 문안 흐름에 반영되고 있습니다.",
      timestamp: formatDateTime(input.updatedAt),
      tone: "success"
    });
  } else if (input.lawbotSnapshotStatus) {
    items.push({
      title: "Lawbot 스냅샷 유지",
      description: `실시간 연결과 별개로 마지막 저장 결과(${input.lawbotSnapshotStatus})를 기준으로 검토를 이어갈 수 있습니다.`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "warning"
    });
  }

  if (input.internalMemo?.includes("[자동 액션]")) {
    items.push({
      title: "자동 액션 반영",
      description: "추천 경로 기반 내부 메모가 저장되어 후속 상태 전환과 고객 안내 흐름에 연결됩니다.",
      timestamp: formatDateTime(input.updatedAt),
      tone: "success"
    });
  }

  if (input.quoteStatus) {
    items.push({
      title: "견적 워크스페이스 연결",
      description: `현재 견적 상태는 ${input.quoteStatus} 단계까지 이어져 있습니다.`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "default"
    });
  }

  if (input.caseStage) {
    items.push({
      title: "사건 진행 단계 반영",
      description: `사건 기록은 ${input.caseStage} 단계까지 연결되어 있습니다.`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "default"
    });
  }

  if (input.dueDate) {
    items.push({
      title: "희망 일정 확인",
      description: `고객이 입력한 일정 또는 마감일은 ${formatDateTime(input.dueDate)} 기준입니다.`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "warning"
    });
  }

  return items;
}

function formatCompareList(items: string[] | undefined) {
  if (!items || items.length === 0) {
    return "없음";
  }

  return items.slice(0, 3).join(", ");
}

function buildLawbotSnapshotComparison(input: {
  liveAnalysis: Awaited<ReturnType<typeof getLawbotCaseAnalysis>>;
  storedSnapshot: StoredLawbotSnapshot | null;
}) {
  if (!input.storedSnapshot?.payload) {
    return {
      headline: "Lawbot 스냅샷 비교 준비",
      description: "저장된 이전 스냅샷이 아직 없어 다음 재분석부터 비교 기준이 쌓입니다.",
      fields: [
        {
          label: "저장 스냅샷",
          previous: "없음",
          current: input.liveAnalysis.status === "available" ? "현재 실시간 결과 확보" : "실시간 결과 대기",
          changed: input.liveAnalysis.status === "available"
        }
      ]
    };
  }

  if (input.liveAnalysis.status !== "available") {
    return {
      headline: "Lawbot 스냅샷 비교",
      description: "현재는 실시간 Lawbot 결과가 없어 마지막 저장 스냅샷을 기준으로 검토를 유지합니다.",
      fields: [
        {
          label: "비교 상태",
          previous: input.storedSnapshot.summary ?? "저장된 요약 없음",
          current: "실시간 결과 대기",
          changed: false
        }
      ]
    };
  }

  const current = input.liveAnalysis.data;
  const previous = input.storedSnapshot.payload;
  const fields = [
    {
      label: "실전 사용 상태",
      previous: previous.practical_use_status ?? "없음",
      current: current.practical_use_status ?? "없음",
      changed: (previous.practical_use_status ?? "") !== (current.practical_use_status ?? "")
    },
    {
      label: "조사 목표",
      previous: previous.research_goal ?? "없음",
      current: current.research_goal ?? "없음",
      changed: (previous.research_goal ?? "") !== (current.research_goal ?? "")
    },
    {
      label: "추가 검토 필요 사유",
      previous: formatCompareList(previous.review_required_reasons),
      current: formatCompareList(current.review_required_reasons),
      changed:
        JSON.stringify(previous.review_required_reasons ?? []) !==
        JSON.stringify(current.review_required_reasons ?? [])
    },
    {
      label: "빠진 핵심 사실",
      previous: formatCompareList(previous.critical_missing_facts),
      current: formatCompareList(current.critical_missing_facts),
      changed:
        JSON.stringify(previous.critical_missing_facts ?? []) !==
        JSON.stringify(current.critical_missing_facts ?? [])
    },
    {
      label: "준비 자료 체크리스트",
      previous: formatCompareList(previous.document_checklist),
      current: formatCompareList(current.document_checklist),
      changed:
        JSON.stringify(previous.document_checklist ?? []) !==
        JSON.stringify(current.document_checklist ?? [])
    },
    {
      label: "우선 액션",
      previous: formatCompareList(previous.priority_actions),
      current: formatCompareList(current.priority_actions),
      changed:
        JSON.stringify(previous.priority_actions ?? []) !==
        JSON.stringify(current.priority_actions ?? [])
    }
  ];

  return {
    headline: "Lawbot 스냅샷 비교",
    description: "마지막 저장 스냅샷과 현재 실시간 분석을 비교해 어떤 항목이 달라졌는지 보여줍니다.",
    fields
  };
}

function getLawbotOperationalSource(input: {
  lawbotStatus: string;
  liveAnalysis: Awaited<ReturnType<typeof getLawbotCaseAnalysis>>;
  storedSnapshot: StoredLawbotSnapshot | null;
}) {
  if (input.lawbotStatus === "available" && input.liveAnalysis.status === "available") {
    const data = input.liveAnalysis.data;
    return {
      sourceLabel: "실시간 Lawbot 결과",
      practicalUseStatus: data.practical_use_status ?? null,
      summary:
        data.client_ready_summary?.[0] ??
        data.practitioner_brief?.[0] ??
        data.input_summary,
      priorityActions: data.priority_actions ?? [],
      missingFacts: data.critical_missing_facts ?? [],
      documentChecklist: data.document_checklist ?? [],
      reviewReasons: data.review_required_reasons ?? [],
      riskFlags: data.risk_flags ?? []
    };
  }

  if (input.storedSnapshot?.payload) {
    return {
      sourceLabel: "저장된 Lawbot 스냅샷",
      practicalUseStatus: input.storedSnapshot.payload.practical_use_status ?? null,
      summary:
        input.storedSnapshot.summary ??
        input.storedSnapshot.payload.input_summary ??
        "저장된 Lawbot 요약 없음",
      priorityActions: input.storedSnapshot.payload.priority_actions ?? [],
      missingFacts: input.storedSnapshot.payload.critical_missing_facts ?? [],
      documentChecklist: input.storedSnapshot.payload.document_checklist ?? [],
      reviewReasons: input.storedSnapshot.payload.review_required_reasons ?? [],
      riskFlags: input.storedSnapshot.payload.risk_flags ?? []
    };
  }

  return {
    sourceLabel: "Lawbot 미연결",
    practicalUseStatus: null,
    summary: null,
    priorityActions: [],
    missingFacts: [],
    documentChecklist: [],
    reviewReasons: [],
    riskFlags: []
  };
}

function buildOperationsDraft(input: {
  contactName: string;
  statusLabel: string;
  strengthLabel: string;
  probability: number;
  recommendedAction: string;
  routeRecommendationLabel: string;
  routeRecommendationReason: string;
  lawbotStatus: string;
  missingFacts: string[];
  lawbotSummary?: string | null;
  lawbotSourceLabel: string;
  lawbotPriorityActions: string[];
  lawbotDocumentChecklist: string[];
  lawbotReviewReasons: string[];
  lawbotRiskFlags: string[];
  lawbotPracticalUseStatus?: string | null;
  routeSignalSummary: string;
}) {
  const mergedMissingFacts = [...new Set([...input.missingFacts, ...input.lawbotReviewReasons])].slice(0, 4);

  const body = [
    `[운영 메모] ${input.contactName}님 건은 현재 ${input.statusLabel} 단계입니다.`,
    `AI 사건 강도는 ${input.strengthLabel}, 해결 가능성 평가는 ${input.probability}/100 기준입니다.`,
    input.recommendedAction,
    input.lawbotStatus === "available"
      ? "Lawbot 참고 분석까지 확보되어 있어 법령·판례 방향을 함께 검토할 수 있습니다."
      : "Lawbot 참고 분석은 아직 연결 전이거나 재확인이 필요합니다.",
    input.lawbotSummary ? `${input.lawbotSourceLabel} 요약: ${input.lawbotSummary}` : null,
    input.lawbotPracticalUseStatus ? `실전 사용 상태: ${input.lawbotPracticalUseStatus}` : null,
    `혼합 신호 요약: ${input.routeSignalSummary}`,
    ...(input.lawbotPriorityActions.length ? ["", "[Lawbot 우선 액션]", ...input.lawbotPriorityActions.slice(0, 3).map((item) => `- ${item}`)] : []),
    ...(input.lawbotDocumentChecklist.length ? ["", "[먼저 받을 자료]", ...input.lawbotDocumentChecklist.slice(0, 4).map((item) => `- ${item}`)] : []),
    "",
    "[우선 확인 사항]",
    ...(mergedMissingFacts.length
      ? mergedMissingFacts.map((item, index) => `${index + 1}. ${item}`)
      : ["1. 기본 사실관계와 서류 보유 여부"]),
    "",
    "확인 후 상담 연결, 자료 요청, 견적 진행 중 어느 경로로 보낼지 바로 결정합니다."
  ].join("\n");

  const structuredBlock = serializeStructuredOperationsMemo({
    memoType: "운영 메모",
    recommendationLabel: input.routeRecommendationLabel,
    recommendationReason: input.routeRecommendationReason,
    signalSummary: input.routeSignalSummary,
    practicalUseStatus: input.lawbotPracticalUseStatus ?? undefined,
    summary: `${input.contactName}님 건은 현재 ${input.statusLabel} 단계이며 ${input.recommendedAction}`,
    priorityMaterials: input.lawbotDocumentChecklist.slice(0, 4),
    riskFlags: [...new Set([...input.lawbotReviewReasons, ...input.lawbotRiskFlags])].slice(0, 4),
    nextChecks: input.lawbotPriorityActions.slice(0, 3)
  });

  return [body, "", structuredBlock].join("\n");
}

function buildAutomationActions(input: {
  contactName: string;
  strengthLabel: "강함" | "보통" | "주의" | "불리";
  recommendedAction: string;
  missingFacts: string[];
  lawbotPriorityActions: string[];
  lawbotDocumentChecklist: string[];
  lawbotReviewReasons: string[];
  lawbotRiskFlags: string[];
  lawbotPracticalUseStatus?: string | null;
  routeSignalSummary: string;
  routeRecommendation: {
    recommendedStatus: InquiryStatus;
    recommendationLabel: string;
    recommendationReason: string;
  };
}) {
  const topFacts = [...new Set([...input.missingFacts, ...input.lawbotDocumentChecklist, ...input.lawbotPriorityActions])].slice(0, 4);
  const factLines = topFacts.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const riskSummary = [...new Set([...input.lawbotReviewReasons, ...input.lawbotRiskFlags])].slice(0, 4);

  function buildStructuredActionMemoBlock(label: string, status: InquiryStatus, summary: string) {
    return serializeStructuredOperationsMemo({
      memoType: `자동 액션 - ${label}`,
      recommendedStatus: status,
      recommendationLabel: input.routeRecommendation.recommendationLabel,
      recommendationReason: input.routeRecommendation.recommendationReason,
      signalSummary: input.routeSignalSummary,
      practicalUseStatus: input.lawbotPracticalUseStatus ?? undefined,
      summary,
      priorityMaterials: input.lawbotDocumentChecklist.slice(0, 4),
      riskFlags: riskSummary,
      nextChecks: topFacts.slice(0, 4)
    });
  }

  return [
    {
      label: "자료 요청 준비",
      status: "IN_REVIEW" as InquiryStatus,
      description: "누락 정보와 기본 서류부터 정리하도록 내부 메모를 남기고 검토 상태로 전환합니다.",
      memo: [
        `[자동 액션] ${input.contactName}님 건을 자료 요청 중심으로 전환`,
        `추천 경로: ${input.routeRecommendation.recommendationLabel}`,
        `추천 근거: ${input.routeRecommendation.recommendationReason}`,
        `혼합 신호 요약: ${input.routeSignalSummary}`,
        input.recommendedAction,
        input.lawbotPracticalUseStatus ? `실전 사용 상태: ${input.lawbotPracticalUseStatus}` : null,
        ...(input.lawbotReviewReasons.length ? ["", "[추가 검토 필요]", ...input.lawbotReviewReasons.slice(0, 3).map((item) => `- ${item}`)] : []),
        "",
        "[먼저 확인할 자료]",
        factLines || "1. 기본 사실관계와 서류 보유 여부",
        "",
        buildStructuredActionMemoBlock(
          "자료 요청 준비",
          "IN_REVIEW",
          `${input.contactName}님 건을 자료 요청 중심으로 전환하고 누락 자료와 핵심 사실부터 확인합니다.`
        )
      ].filter(Boolean).join("\n"),
      recommended: input.routeRecommendation.recommendedStatus === "IN_REVIEW",
      recommendationNote: "자료와 사실관계부터 정리하는 흐름이 가장 안전합니다."
    },
    {
      label: "상담 진행",
      status: "CONSULTATION_REQUIRED" as InquiryStatus,
      description: "상담 연결이 필요한 건으로 보고 상담 중심 메모를 남깁니다.",
      memo: [
        `[자동 액션] ${input.contactName}님 건을 상담 진행 흐름으로 전환`,
        `추천 경로: ${input.routeRecommendation.recommendationLabel}`,
        `추천 근거: ${input.routeRecommendation.recommendationReason}`,
        `혼합 신호 요약: ${input.routeSignalSummary}`,
        `현재 사건 강도는 ${input.strengthLabel}이며 상담 시 아래 항목을 우선 확인합니다.`,
        input.lawbotPracticalUseStatus ? `실전 사용 상태: ${input.lawbotPracticalUseStatus}` : null,
        factLines || "1. 현재 상태와 목표 결과",
        "",
        buildStructuredActionMemoBlock(
          "상담 진행",
          "CONSULTATION_REQUIRED",
          `${input.contactName}님 건을 상담 중심으로 전환하고 목표 결과와 현재 상태를 우선 확인합니다.`
        )
      ].filter(Boolean).join("\n"),
      recommended: input.routeRecommendation.recommendedStatus === "CONSULTATION_REQUIRED",
      recommendationNote: "바로 보류보다 상담으로 방향을 정리하는 편이 적절합니다."
    },
    {
      label: "견적 진행",
      status: "QUOTE_DRAFTED" as InquiryStatus,
      description: "견적 검토 단계로 넘기고, 견적 전에 확인할 포인트를 메모로 남깁니다.",
      memo: [
        `[자동 액션] ${input.contactName}님 건을 견적 진행 흐름으로 전환`,
        `추천 경로: ${input.routeRecommendation.recommendationLabel}`,
        `추천 근거: ${input.routeRecommendation.recommendationReason}`,
        `혼합 신호 요약: ${input.routeSignalSummary}`,
        input.recommendedAction,
        input.lawbotPracticalUseStatus ? `실전 사용 상태: ${input.lawbotPracticalUseStatus}` : null,
        ...(input.lawbotPriorityActions.length ? ["", "[Lawbot 우선 액션]", ...input.lawbotPriorityActions.slice(0, 3).map((item) => `- ${item}`)] : []),
        "",
        "[견적 전 확인]",
        factLines || "1. 범위와 일정 확정",
        "",
        buildStructuredActionMemoBlock(
          "견적 진행",
          "QUOTE_DRAFTED",
          `${input.contactName}님 건을 견적 진행 흐름으로 전환하고 범위, 일정, 준비 자료를 다시 확인합니다.`
        )
      ].join("\n"),
      recommended: input.routeRecommendation.recommendedStatus === "QUOTE_DRAFTED",
      recommendationNote: "준비 상태가 비교적 좋아 견적 단계로 넘기기 적합합니다."
    },
    {
      label: "보류 검토",
      status: "ON_HOLD" as InquiryStatus,
      description: "불리 요소나 자료 부족이 큰 경우 보류 메모를 남기고 상태를 전환합니다.",
      memo: [
        `[자동 액션] ${input.contactName}님 건을 보류 검토 상태로 전환`,
        `추천 경로: ${input.routeRecommendation.recommendationLabel}`,
        `추천 근거: ${input.routeRecommendation.recommendationReason}`,
        `혼합 신호 요약: ${input.routeSignalSummary}`,
        "현재 자료만으로는 바로 진행하기보다 추가 사실 확인과 보수적 검토가 먼저 필요합니다.",
        input.lawbotPracticalUseStatus ? `실전 사용 상태: ${input.lawbotPracticalUseStatus}` : null,
        ...(input.lawbotRiskFlags.length ? ["", "[리스크 플래그]", ...input.lawbotRiskFlags.slice(0, 3).map((item) => `- ${item}`)] : []),
        "",
        "[보류 사유 메모]",
        factLines || "1. 핵심 사실관계 추가 확인 필요",
        "",
        buildStructuredActionMemoBlock(
          "보류 검토",
          "ON_HOLD",
          `${input.contactName}님 건은 보수적 검토가 우선이며 리스크와 추가 확인 항목을 정리한 뒤 다시 판단합니다.`
        )
      ].filter(Boolean).join("\n"),
      recommended: input.routeRecommendation.recommendedStatus === "ON_HOLD",
      recommendationNote: "위험 신호와 추가 검토 포인트가 커서 보수적으로 다루는 편이 좋습니다."
    }
  ];
}

function buildLawbotClientSummary(input: {
  contactName: string;
  defaultSummary: string;
  lawbotSourceLabel: string;
  lawbotSummary?: string | null;
  lawbotPracticalUseStatus?: string | null;
  lawbotReviewReasons: string[];
  routeSignalSummary?: string | null;
}) {
  if (!input.lawbotSummary && !input.lawbotPracticalUseStatus && input.lawbotReviewReasons.length === 0 && !input.routeSignalSummary) {
    return input.defaultSummary;
  }

  return [
    `${input.contactName}님 문의는 현재 아래 기준으로 검토하고 있습니다.`,
    input.lawbotSummary ? `- ${input.lawbotSourceLabel} 요약: ${input.lawbotSummary}` : null,
    input.lawbotPracticalUseStatus ? `- 실전 사용 상태: ${input.lawbotPracticalUseStatus}` : null,
    input.routeSignalSummary ? `- 혼합 신호 요약: ${input.routeSignalSummary}` : null,
    ...(input.lawbotReviewReasons.slice(0, 3).map((item) => `- 추가 검토 필요: ${item}`) ?? []),
    "",
    input.defaultSummary
  ]
    .filter(Boolean)
    .join("\n");
}

function buildLawbotDocumentRequest(input: {
  contactName: string;
  defaultRequest: string;
  lawbotDocumentChecklist: string[];
  lawbotMissingFacts: string[];
  routeSignalSummary?: string | null;
}) {
  if (input.lawbotDocumentChecklist.length === 0 && input.lawbotMissingFacts.length === 0 && !input.routeSignalSummary) {
    return input.defaultRequest;
  }

  return [
    `${input.contactName}님, 정확한 검토를 위해 아래 자료와 사실관계 확인이 우선 필요합니다.`,
    input.routeSignalSummary ? `참고 기준: ${input.routeSignalSummary}` : null,
    ...(input.lawbotDocumentChecklist.slice(0, 5).map((item, index) => `${index + 1}. ${item}`) ?? []),
    ...(input.lawbotMissingFacts.slice(0, 3).map((item, index) => `${index + 1 + Math.min(input.lawbotDocumentChecklist.length, 5)}. ${item}`) ?? []),
    "",
    input.defaultRequest
  ].filter(Boolean).join("\n");
}

type MockMarketAnalyzeSignal = {
  status: string;
  summary: string;
  demandScore: number;
  responseTempoKey: "docs-first" | "consult-first" | "fast-response";
  routeBias: "review" | "consult" | "quote";
  metrics: { label: string; value: string }[];
  highlights: string[];
};

function buildRouteSignalSummary(input: {
  lawbotSourceLabel: string;
  lawbotPracticalUseStatus?: string | null;
  marketAnalyzeSignal: MockMarketAnalyzeSignal;
}) {
  const responseTempo =
    input.marketAnalyzeSignal.metrics.find((metric) => metric.label === "응답 템포")?.value ?? "외부 신호 대기";

  return [
    `법률 신호 ${input.lawbotSourceLabel}${input.lawbotPracticalUseStatus ? ` / ${input.lawbotPracticalUseStatus}` : ""}`,
    `외부 수요 ${Math.min(input.marketAnalyzeSignal.demandScore, 92)} / 100`,
    `응답 템포 ${responseTempo}`
  ].join(" · ");
}

function recommendOperationalRoute(input: {
  strengthLabel: "강함" | "보통" | "주의" | "불리";
  quickStatuses: InquiryStatus[];
  lawbotPracticalUseStatus?: string | null;
  lawbotReviewReasons: string[];
  lawbotDocumentChecklist: string[];
  lawbotPriorityActions: string[];
  lawbotRiskFlags: string[];
  lawbotMissingFacts: string[];
  marketAnalyzeSignal?: Pick<MockMarketAnalyzeSignal, "demandScore" | "responseTempoKey" | "routeBias">;
}) {
  const practicalUseStatus = input.lawbotPracticalUseStatus ?? "";
  const cautionScore =
    input.lawbotReviewReasons.length +
    input.lawbotRiskFlags.length +
    input.lawbotMissingFacts.length;
  const needsDocuments = input.lawbotDocumentChecklist.length > 0 || input.lawbotMissingFacts.length > 0;
  const marketDemandScore = input.marketAnalyzeSignal?.demandScore ?? 0;
  const favorsConsult = input.marketAnalyzeSignal?.responseTempoKey === "consult-first";
  const favorsQuote =
    input.marketAnalyzeSignal?.routeBias === "quote" &&
    input.marketAnalyzeSignal?.responseTempoKey === "fast-response";
  const isHighRisk =
    /(불가|위험|보류|주의|추가 검토|확인 필요)/.test(practicalUseStatus) ||
    cautionScore >= 4 ||
    input.strengthLabel === "불리";
  const isReadyForQuote =
    /(가능|활용|진행|사용 가능|바로)/.test(practicalUseStatus) &&
    input.lawbotDocumentChecklist.length <= 1 &&
    input.lawbotReviewReasons.length === 0 &&
    input.strengthLabel !== "주의" &&
    input.strengthLabel !== "불리" &&
    marketDemandScore >= 68;

  let recommendedStatus: InquiryStatus;
  let recommendationLabel: string;
  let recommendationReason: string;

  if (isHighRisk) {
    recommendedStatus = "ON_HOLD";
    recommendationLabel = "보류 검토 우선";
    recommendationReason = "Lawbot 위험 신호나 추가 검토 포인트가 커서 외부 응답 기대치보다 보수적 검토가 먼저입니다.";
  } else if (needsDocuments) {
    recommendedStatus = "IN_REVIEW";
    recommendationLabel = "자료 요청·검토 우선";
    recommendationReason =
      input.marketAnalyzeSignal?.responseTempoKey === "docs-first"
        ? "Lawbot 기준 핵심 자료가 더 필요하고 외부 신호도 서류 선확보 흐름에 가까워 자료 요청과 검토가 먼저입니다."
        : "핵심 사실이나 준비 자료가 더 필요해 자료 요청과 검토 흐름을 먼저 거치는 편이 안전합니다.";
  } else if (isReadyForQuote) {
    recommendedStatus = "QUOTE_DRAFTED";
    recommendationLabel = "견적 진행 가능";
    recommendationReason = "Lawbot 준비도가 비교적 좋고 mock market-analyze 수요 온도도 높아 견적 검토로 넘기기 좋은 구간입니다.";
  } else if (favorsConsult || (marketDemandScore >= 74 && !favorsQuote)) {
    recommendedStatus = "CONSULTATION_REQUIRED";
    recommendationLabel = "상담 진행 권장";
    recommendationReason = "Lawbot상 즉시 보류 사유는 크지 않고 외부 반응 신호가 상담 선정리 흐름에 가까워 상담 연결이 가장 자연스럽습니다.";
  } else {
    recommendedStatus = "CONSULTATION_REQUIRED";
    recommendationLabel = "상담 진행 권장";
    recommendationReason = "즉시 보류할 정도는 아니지만, 방향 정리를 위한 상담 단계가 가장 자연스럽습니다.";
  }

  const orderedStatuses = [
    recommendedStatus,
    ...input.quickStatuses.filter((status) => status !== recommendedStatus)
  ];

  return {
    recommendedStatus,
    recommendationLabel,
    recommendationReason,
    orderedStatuses
  };
}

function buildRecommendedCommunicationIds(input: {
  recommendedStatus: InquiryStatus;
  lawbotDocumentChecklist: string[];
  lawbotSummary?: string | null;
}) {
  if (input.recommendedStatus === "IN_REVIEW") {
    return ["document-request", "guidance", "operations-note"];
  }

  if (input.recommendedStatus === "ON_HOLD") {
    return ["operations-note", "document-request", "client-summary"];
  }

  if (input.recommendedStatus === "QUOTE_DRAFTED") {
    return ["client-summary", "operations-note", "guidance"];
  }

  if (input.recommendedStatus === "CONSULTATION_REQUIRED") {
    return ["client-summary", "document-request", "operations-note"];
  }

  return input.lawbotDocumentChecklist.length > 0 || input.lawbotSummary
    ? ["document-request", "client-summary", "operations-note"]
    : ["receipt", "guidance", "operations-note"];
}

function buildAnalysisHubSignals(input: {
  lawbotStatus: "available" | "disabled" | "error";
  lawbotSnapshotStatus?: string | null;
  recommendationLabel: string;
  recommendationReason: string;
  recommendedDraftCount: number;
  marketAnalyzeSignal: MockMarketAnalyzeSignal;
}) {
  return [
    {
      title: "System Core",
      status: "운영 판단 기준",
      description: "고객 사건, 견적, 운영 메모, 후속 액션을 묶는 기본 허브입니다.",
      accents: [
        `추천 경로: ${input.recommendationLabel}`,
        `추천 문안 ${input.recommendedDraftCount}건`,
        input.recommendationReason
      ]
    },
    {
      title: "Lawbot Lane",
      status:
        input.lawbotStatus === "available"
          ? "실시간 분석 연결"
          : input.lawbotSnapshotStatus
            ? `저장 스냅샷: ${input.lawbotSnapshotStatus}`
            : "연결 준비 중",
      description: "법령, 판례, 체크리스트, 실전 사용 상태를 고객 사건 흐름에 붙이는 레이어입니다.",
      accents: [
        input.lawbotStatus === "available" ? "실시간 분석 우선" : "스냅샷 fallback 유지",
        "고객 사건 상세에서 바로 재분석",
        "운영 메모·자료요청 문안과 연동"
      ]
    },
    {
      title: "Market Analyze",
      status: `${input.marketAnalyzeSignal.status} · ${Math.min(input.marketAnalyzeSignal.demandScore, 92)}/100`,
      description: "시장/콘텐츠/수요 인사이트가 붙으면 고객 사건 외부 맥락까지 함께 보는 확장 슬롯입니다.",
      accents: [
        `응답 템포: ${input.marketAnalyzeSignal.metrics.find((metric) => metric.label === "응답 템포")?.value ?? "-"}`,
        input.marketAnalyzeSignal.highlights[0] ?? "market-analyze 결과 수용 슬롯 확보",
        "System + Lawbot와 동일한 허브 톤 유지"
      ]
    }
  ];
}

function buildCrossAnalysisSummary(input: {
  recommendationLabel: string;
  recommendationReason: string;
  lawbotStatus: "available" | "disabled" | "error";
  lawbotSnapshotStatus?: string | null;
  marketAnalyzeReady: boolean;
  recommendedDraftCount: number;
  marketAnalyzeSignal: MockMarketAnalyzeSignal;
}) {
  return {
    headline: "고객 사건 중심 교차 분석 요약",
    summary: [
      `현재 운영 허브는 ${input.recommendationLabel} 흐름을 기준으로 움직입니다.`,
      input.lawbotStatus === "available"
        ? "Lawbot 실시간 결과가 우선 반영되고 있습니다."
        : input.lawbotSnapshotStatus
          ? `Lawbot는 저장 스냅샷(${input.lawbotSnapshotStatus}) 기준으로 fallback 됩니다.`
          : "Lawbot는 연결 준비 상태를 유지하고 있습니다.",
      input.marketAnalyzeReady
        ? "market-analyze 외부 인사이트를 함께 반영할 준비가 되어 있습니다."
        : `market-analyze는 아직 비연결이지만 ${input.marketAnalyzeSignal.metrics.find((metric) => metric.label === "응답 템포")?.value ?? "외부 인사이트"} 기준 mock 신호를 함께 읽고 있습니다.`
    ].join(" "),
    points: [
      input.recommendationReason,
      `외부 인사이트 가정: 예상 수요 온도 ${Math.min(input.marketAnalyzeSignal.demandScore, 92)} / 100`,
      `추천 후속 문안 ${input.recommendedDraftCount}건이 바로 이어집니다.`,
      "System / Lawbot / Market Analyze를 하나의 허브 맥락에서 읽도록 설계했습니다."
    ]
  };
}

function buildExternalInsightSlots() {
  return [
    {
      title: "Market Pulse Slot",
      status: "연결 예정",
      description: "market-analyze의 시장 수요, 경쟁 맥락, 외부 반응 신호가 들어올 자리입니다.",
      placeholders: ["시장 수요 강도", "콘텐츠/검색 흐름", "외부 반응 변화"]
    },
    {
      title: "Cross Signal Slot",
      status: "허브 준비 완료",
      description: "Lawbot 법률 신호와 market-analyze 외부 신호를 같이 읽는 교차 해석 영역입니다.",
      placeholders: ["법률 리스크 vs 시장 기회", "자료요청 우선순위", "고객 커뮤니케이션 톤"]
    }
  ];
}

function buildMockMarketAnalyzeSignal(input: {
  inquiryTitle: string;
  tags: string[];
  urgencyLabel: string;
  recommendedStatusLabel: string;
  lawbotStatus: "available" | "disabled" | "error";
  documentChecklistCount: number;
  reviewReasonCount: number;
}): MockMarketAnalyzeSignal {
  const keywordSeed = input.inquiryTitle
    .split(/[\s,·/()]+/)
    .filter((item) => item.length >= 2)
    .slice(0, 3);
  const demandScore = Math.max(
    42,
    64 + input.tags.length * 4 + (input.lawbotStatus === "available" ? 6 : 0) - input.reviewReasonCount * 3
  );
  const responseTempo =
    input.documentChecklistCount >= 3
      ? "서류 선확보형"
      : input.reviewReasonCount >= 2
        ? "상담 선정리형"
        : "즉시 응답형";
  const responseTempoKey =
    input.documentChecklistCount >= 3
      ? "docs-first"
      : input.reviewReasonCount >= 2
        ? "consult-first"
        : "fast-response";
  const routeBias =
    input.documentChecklistCount >= 3
      ? "review"
      : demandScore >= 74 && input.reviewReasonCount === 0
        ? "quote"
        : "consult";

  return {
    status: "Mock Signal",
    summary:
      "market-analyze 연동 전 단계에서 고객 사건 메타데이터를 기반으로 만든 임시 외부 인사이트 요약입니다.",
    demandScore,
    responseTempoKey,
    routeBias,
    metrics: [
      { label: "예상 수요 온도", value: `${Math.min(demandScore, 92)} / 100` },
      { label: "응답 템포", value: responseTempo },
      { label: "우선 흐름", value: input.recommendedStatusLabel }
    ],
    highlights: [
      `${input.urgencyLabel} 문의로 분류되어 초기 응답 기대치가 비교적 높습니다.`,
      keywordSeed.length > 0
        ? `제목 핵심어 ${keywordSeed.join(", ")} 기준의 외부 관심 슬롯을 나중에 연결할 수 있습니다.`
        : "제목 기반 키워드 슬롯을 나중에 연결할 수 있습니다.",
      input.tags.length > 0
        ? `서비스 태그 ${input.tags.slice(0, 3).join(", ")}를 기준으로 market-analyze 필터를 바로 연결하기 좋습니다.`
        : "서비스 태그가 적어도 기본 시장 인사이트 슬롯은 연결 가능합니다."
    ]
  };
}

export default async function AdminInquiryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiry = await getInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  const inquiryReceiptCode = await getInquiryReceiptCode({
    id: inquiry.id,
    createdAt: inquiry.createdAt,
    inquiryType: inquiry.inquiryType as InquiryType
  });

  const quoteWorkspace = await getQuoteWorkspaceForInquiry(id);
  const tags = parseJsonArray(inquiry.serviceTags);
  const precheckDocs = parseJsonArray(inquiry.precheckRecommendedDocs).map((entry) => String(entry));
  const previews = getInquiryMessagePreviewSet(inquiry);
  const caseAnalysis = analyzeInquiryCase(inquiry);
  const lawbotAnalysis = await getLawbotCaseAnalysis(inquiry);
  const lawbotConnectionSnapshot = buildLawbotConnectionSnapshot(inquiry);
  const storedLawbotSnapshot = buildStoredLawbotSnapshot(inquiry);
  const referenceRecommendations = await getNotionReferenceRecommendations({
    inquiryType: inquiry.inquiryType,
    serviceTags: tags,
    inquiryTitle: inquiry.title,
  });
  const inquiryStatus = inquiry.status as InquiryStatus;
  const inquiryUrgency = inquiry.urgencyLevel as keyof typeof urgencyLabels;
  const inquiryType = inquiry.inquiryType as keyof typeof inquiryTypeLabels;
  const inquiryLanguage = inquiry.preferredLanguage as keyof typeof languageCodeLabels;
  const inquiryClientType = inquiry.clientType as keyof typeof clientTypeLabels;
  const requestedInquiryType = (inquiry.requestedInquiryType ?? "UNKNOWN") as keyof typeof inquiryTypeLabels;
  const declaredUrgency = (inquiry.declaredUrgency ?? "MEDIUM") as keyof typeof urgencyLabels;
  const quickStatuses = getQuickStatuses(caseAnalysis.strengthLabel);
  const workflowStep = getWorkflowStep({
    inquiryStatus,
    quoteStatus: quoteWorkspace.latestQuote?.status ?? null,
    caseStage: quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
  });
  const lawbotOperationalSource = getLawbotOperationalSource({
    lawbotStatus: lawbotAnalysis.status,
    liveAnalysis: lawbotAnalysis,
    storedSnapshot: storedLawbotSnapshot
  });
  const mockMarketAnalyzeSignal = buildMockMarketAnalyzeSignal({
    inquiryTitle: inquiry.title,
    tags,
    urgencyLabel: urgencyLabels[inquiryUrgency].ko,
    recommendedStatusLabel: inquiryStatusLabels[inquiryStatus].ko,
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
    label: inquiryStatusLabels[status].ko,
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
    label: inquiryStatusLabels[item.status].ko
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
  const operationsFeed = buildOperationsFeed({
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    statusLabel: inquiryStatusLabels[inquiryStatus].ko,
    quoteStatus: quoteWorkspace.latestQuote?.status ?? null,
    caseStage: quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
    lawbotStatus: lawbotAnalysis.status,
    lawbotSnapshotStatus: storedLawbotSnapshot?.status ?? null,
    dueDate: inquiry.dueDate,
    internalMemo: inquiry.internalMemo
  });
  const lawbotSnapshotComparison = buildLawbotSnapshotComparison({
    liveAnalysis: lawbotAnalysis,
    storedSnapshot: storedLawbotSnapshot
  });
  const caseTimeline = buildCaseTimeline({
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    inquiryStatusLabel: inquiryStatusLabels[inquiryStatus].ko,
    workflowStep,
    lawbotStatus: lawbotAnalysis.status,
    lawbotSnapshotStatus: storedLawbotSnapshot?.status ?? null,
    routeRecommendationLabel: routeRecommendation.recommendationLabel,
    routeRecommendationReason: routeRecommendation.recommendationReason,
    quoteStatus: quoteWorkspace.latestQuote?.status ?? null,
    caseStage: quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
    dueDate: inquiry.dueDate,
    internalMemo: inquiry.internalMemo
  });
  const structuredInternalMemo = parseStructuredOperationsMemo(inquiry.internalMemo);
  const internalMemoDisplay = stripStructuredOperationsMemo(inquiry.internalMemo);
  const operationsDraft = buildOperationsDraft({
    contactName: inquiry.contactName,
    statusLabel: inquiryStatusLabels[inquiryStatus].ko,
    strengthLabel: caseAnalysis.strengthLabel,
    probability: caseAnalysis.resolutionProbabilityPercent,
    recommendedAction: caseAnalysis.recommendedAction,
    routeRecommendationLabel: routeRecommendation.recommendationLabel,
    routeRecommendationReason: routeRecommendation.recommendationReason,
    lawbotStatus: lawbotAnalysis.status,
    missingFacts: caseAnalysis.missingFacts,
    lawbotSummary: lawbotOperationalSource.summary,
    lawbotSourceLabel: lawbotOperationalSource.sourceLabel,
    lawbotPriorityActions: lawbotOperationalSource.priorityActions,
    lawbotDocumentChecklist: lawbotOperationalSource.documentChecklist,
    lawbotReviewReasons: lawbotOperationalSource.reviewReasons,
    lawbotRiskFlags: lawbotOperationalSource.riskFlags,
    lawbotPracticalUseStatus: lawbotOperationalSource.practicalUseStatus,
    routeSignalSummary
  });
  const operationsDraftDisplay = stripStructuredOperationsMemo(operationsDraft);
  const communicationDrafts = [
    {
      id: "receipt",
      label: "접수 완료 안내",
      description: "고객이 접수 직후 받는 기본 안내문입니다.",
      content: inquiry.generatedReceiptMessage,
      badge: "기본",
      recommendedWhen: "문의가 접수된 직후",
      channelHint: "이메일 또는 문자"
    },
    {
      id: "guidance",
      label: "준비 서류 안내",
      description: "초기 접수 후 가장 먼저 보낼 수 있는 준비 서류 안내입니다.",
      content: inquiry.generatedGuidance,
      badge: "서류",
      recommendedWhen: "초기 검토 후 자료 요청이 필요할 때",
      channelHint: "이메일 또는 카카오톡"
    },
    {
      id: "client-summary",
      label: "사건 검토 안내",
      description: "AI 사건 분석과 Lawbot 결과를 함께 반영해 고객에게 현재 상황을 설명하는 문안입니다.",
      content: buildLawbotClientSummary({
        contactName: inquiry.contactName,
        defaultSummary: caseAnalysis.communicationGuidance.clientSummary,
        lawbotSourceLabel: lawbotOperationalSource.sourceLabel,
        lawbotSummary: lawbotOperationalSource.summary,
        lawbotPracticalUseStatus: lawbotOperationalSource.practicalUseStatus,
        lawbotReviewReasons: lawbotOperationalSource.reviewReasons,
        routeSignalSummary
      }),
      badge: lawbotOperationalSource.summary ? "AI+Lawbot" : "AI",
      recommendedWhen: "상담 전 또는 1차 검토 결과를 설명할 때",
      channelHint: "이메일 또는 상담 후 안내문"
    },
    {
      id: "document-request",
      label: "자료 요청 문안",
      description: "누락 사실과 Lawbot 준비 자료 체크리스트를 함께 반영한 요청문입니다.",
      content: buildLawbotDocumentRequest({
        contactName: inquiry.contactName,
        defaultRequest: caseAnalysis.communicationGuidance.documentRequest,
        lawbotDocumentChecklist: lawbotOperationalSource.documentChecklist,
        lawbotMissingFacts: lawbotOperationalSource.missingFacts,
        routeSignalSummary
      }),
      badge: lawbotOperationalSource.documentChecklist.length ? "요청+Lawbot" : "요청",
      recommendedWhen: "핵심 사실관계가 부족하거나 서류 보완이 필요할 때",
      channelHint: "이메일, 문자, 카카오톡"
    },
    {
      id: "operations-note",
      label: "운영 메모 초안",
      description: "내부 공유 또는 상담 전 요약 메모로 쓰는 문안입니다.",
      content: operationsDraft,
      badge: lawbotOperationalSource.summary ? "내부+Lawbot" : "내부",
      recommendedWhen: "담당자 인수인계 또는 상담 준비 시",
      channelHint: "내부 메모"
    }
  ];
  const automationActions = buildAutomationActions({
    contactName: inquiry.contactName,
    strengthLabel: caseAnalysis.strengthLabel,
    recommendedAction: caseAnalysis.recommendedAction,
    missingFacts: caseAnalysis.missingFacts,
    lawbotPriorityActions: lawbotOperationalSource.priorityActions,
    lawbotDocumentChecklist: lawbotOperationalSource.documentChecklist,
    lawbotReviewReasons: lawbotOperationalSource.reviewReasons,
    lawbotRiskFlags: lawbotOperationalSource.riskFlags,
    lawbotPracticalUseStatus: lawbotOperationalSource.practicalUseStatus,
    routeSignalSummary,
    routeRecommendation
  }).sort((left, right) => {
    const priorityOrder: Record<InquiryStatus, number> = {
      [routeRecommendation.recommendedStatus]: 0,
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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="status" status={inquiry.status}>
                {inquiryStatusLabels[inquiryStatus].ko}
              </Badge>
              <Badge tone="urgency" urgency={inquiry.urgencyLevel}>
                {urgencyLabels[inquiryUrgency].ko}
              </Badge>
              <Badge>
                {inquiryTypeLabels[inquiryType].ko}
              </Badge>
              <Badge tone="language" language={inquiry.preferredLanguage}>
                {languageCodeLabels[inquiryLanguage].ko}
              </Badge>
            </div>
            <h2 className="mt-4 ui-page-title">{inquiry.title}</h2>
            <p className="mt-3 max-w-3xl text-sm text-text">{inquiry.generatedSummary}</p>
            <div className="mt-4 grid gap-2 text-sm text-text-muted sm:grid-cols-2 xl:grid-cols-3">
              <p className="truncate whitespace-nowrap">접수번호: {inquiryReceiptCode}</p>
              <p className="truncate whitespace-nowrap">접수일: {formatDateTime(inquiry.createdAt)}</p>
              <p className="truncate whitespace-nowrap">업데이트: {formatDateTime(inquiry.updatedAt)}</p>
              <p className="truncate whitespace-nowrap">이름: {inquiry.contactName}</p>
              <p className="truncate whitespace-nowrap">이메일: {inquiry.email}</p>
              <p className="truncate whitespace-nowrap">연락처: {inquiry.phone || "-"}</p>
              <p className="truncate whitespace-nowrap">의뢰 형태: {clientTypeLabels[inquiryClientType].ko}</p>
              <p className="truncate whitespace-nowrap">기업 의뢰 여부: {inquiry.isCorporateRequest ? "예" : "아니오"}</p>
            </div>
          </div>
          <div className="w-full max-w-md">
            <div className="space-y-4">
              <InquiryOperationalSummary
                inquiryId={inquiry.id}
                strengthLabel={caseAnalysis.strengthLabel}
                strengthScore={caseAnalysis.strengthScore}
                qualificationScore={inquiry.qualificationScore}
                recommendedAction={caseAnalysis.recommendedAction}
                quickStatuses={quickStatusOptions}
                missingFacts={caseAnalysis.missingFacts}
                lawbotStatus={lawbotAnalysis.status}
                automationActions={automationActions}
                routeRecommendationLabel={routeRecommendation.recommendationLabel}
                routeRecommendationReason={routeRecommendation.recommendationReason}
                marketSignalSummary={`${Math.min(mockMarketAnalyzeSignal.demandScore, 92)} / 100 · ${mockMarketAnalyzeSignal.metrics.find((metric) => metric.label === "응답 템포")?.value ?? "-"}`}
                recommendedDraftIds={recommendedCommunicationIds}
              />
              <Card muted className="p-5">
                <InquiryManagementForm
                  inquiryId={inquiry.id}
                  status={inquiry.status}
                  internalMemo={inquiry.internalMemo}
                  quickStatuses={quickStatuses}
                  statusGuardPreview={statusGuardPreview}
                />
              </Card>
            </div>
          </div>
        </div>
      </Card>

      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="ui-kicker">Analysis Hub</p>
            <h3 className="mt-3 ui-section-title">System, Lawbot, Market Analyze를 위한 멀티엔진 사건 허브</h3>
            <p className="mt-3 text-sm text-text">
              현재 화면은 고객 사건을 중심으로 `system` 운영 판단, `Lawbot` 법률 분석, 이후 연결될 `market-analyze`
              인사이트까지 같은 허브 안에서 읽히도록 설계되어 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="ui-analysis-chip">고객 사건 중심</span>
            <span className="ui-analysis-chip">Lawbot 연동 준비</span>
            <span className="ui-analysis-chip">Market Analyze 슬롯 확보</span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {analysisHubSignals.map((signal) => (
            <div key={signal.title} className="ui-analysis-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-strong">{signal.title}</p>
                <span className="rounded-full border border-line-strong bg-white/85 px-3 py-1 text-[11px] font-semibold text-text-muted">
                  {signal.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{signal.description}</p>
              <div className="mt-4 space-y-2">
                {signal.accents.map((item) => (
                  <div key={`${signal.title}-${item}`} className="rounded-2xl border border-line/80 bg-white/80 px-3 py-2 text-sm text-text">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="ui-analysis-summary p-5">
            <p className="ui-kicker">Cross Analysis</p>
            <p className="mt-3 text-lg font-semibold text-text-strong">{crossAnalysisSummary.headline}</p>
            <p className="mt-3 text-sm text-text">{crossAnalysisSummary.summary}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {crossAnalysisSummary.points.map((item) => (
                <div key={item} className="rounded-2xl border border-line/80 bg-white/80 px-3 py-3 text-sm text-text">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="ui-analysis-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-strong">Mock Market Analyze</p>
                <span className="rounded-full border border-line-strong bg-white/85 px-3 py-1 text-[11px] font-semibold text-text-muted">
                  {mockMarketAnalyzeSignal.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{mockMarketAnalyzeSignal.summary}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {mockMarketAnalyzeSignal.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-line/80 bg-white/80 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{metric.label}</p>
                    <p className="mt-2 text-sm font-semibold text-text-strong">{metric.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {mockMarketAnalyzeSignal.highlights.map((item) => (
                  <div key={item} className="rounded-2xl border border-line/80 bg-white/80 px-3 py-2 text-sm text-text">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {externalInsightSlots.map((slot) => (
              <div key={slot.title} className="ui-insight-slot p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text-strong">{slot.title}</p>
                  <span className="rounded-full border border-line-strong bg-white/80 px-3 py-1 text-[11px] font-semibold text-text-muted">
                    {slot.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-text-muted">{slot.description}</p>
                <div className="mt-4 space-y-2">
                  {slot.placeholders.map((item) => (
                    <div key={`${slot.title}-${item}`} className="rounded-2xl border border-dashed border-line-strong bg-white/75 px-3 py-2 text-sm text-text-muted">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <WorkflowProgressPanel
        currentKey={workflowStep}
        lawbotStatus={lawbotAnalysis.status}
        quoteStatus={quoteWorkspace.latestQuote?.status ?? null}
        caseStage={quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="ui-section-title">문의 원문</h3>
            <div className="mt-5 grid gap-4 text-sm text-text sm:grid-cols-2">
              <InfoItem label="국적" value={inquiry.nationality} />
              <InfoItem label="현재 상태" value={inquiry.currentStatus} />
              <InfoItem label="문서 발행국" value={inquiry.documentCountry} />
              <InfoItem label="제출처" value={inquiry.targetAgency} />
              <InfoItem label="요청 문의유형" value={inquiryTypeLabels[requestedInquiryType].ko} />
              <InfoItem label="체감 긴급도" value={urgencyLabels[declaredUrgency].ko} />
              <InfoItem label="희망 일정" value={formatDateTime(inquiry.dueDate)} />
              <InfoItem label="보유 서류 여부" value={inquiry.hasPreparedDocuments ? "보유" : "미보유"} />
              <InfoItem label="번역 필요 여부" value={inquiry.needsTranslation ? "예" : "아니오"} />
              <InfoItem label="전화상담 희망" value={inquiry.wantsCallback ? "예" : "아니오"} />
            </div>
            <Card muted className="mt-6 p-5">
              <p className="ui-kicker">상세 설명</p>
              <p className="mt-3 whitespace-pre-line text-sm text-text">{inquiry.description}</p>
            </Card>
            <Card muted className="mt-4 p-5">
              <p className="ui-kicker">원하는 결과</p>
              <p className="mt-3 whitespace-pre-line text-sm text-text">
                {inquiry.requestedOutcome || "미입력"}
              </p>
            </Card>
          </Card>

          <Card className="p-6">
            <h3 className="ui-section-title">내부 메모</h3>
            {structuredInternalMemo ? (
              <Card muted className="mt-4 p-5">
                <p className="ui-kicker">운영 메모 구조 요약</p>
                <div className="mt-4 grid gap-4 text-sm text-text sm:grid-cols-2">
                  <InfoItem label="메모 유형" value={structuredInternalMemo.metadata.memoType || "-"} />
                  <InfoItem label="추천 경로" value={structuredInternalMemo.metadata.recommendationLabel || "-"} />
                  <InfoItem label="추천 근거" value={structuredInternalMemo.metadata.recommendationReason || "-"} />
                  <InfoItem label="실전 사용 상태" value={structuredInternalMemo.metadata.practicalUseStatus || "-"} />
                  <InfoItem label="혼합 신호" value={structuredInternalMemo.metadata.signalSummary || "-"} />
                  <InfoItem label="핵심 요약" value={structuredInternalMemo.metadata.summary || "-"} />
                </div>
                {structuredInternalMemo.metadata.priorityMaterials?.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">우선 자료</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {structuredInternalMemo.metadata.priorityMaterials.map((item) => (
                        <Badge
                          key={`memo-material-${item}`}
                          className="border-line-strong bg-white text-text-strong"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {structuredInternalMemo.metadata.riskFlags?.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">리스크</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {structuredInternalMemo.metadata.riskFlags.map((item) => (
                        <Badge
                          key={`memo-risk-${item}`}
                          className="border-amber-200 bg-amber-50 text-amber-800"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            ) : null}
            <Card muted className="mt-4 p-5">
              <p className="whitespace-pre-line text-sm text-text">
                {internalMemoDisplay || "아직 저장된 내부 메모가 없습니다."}
              </p>
            </Card>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="ui-section-title">사전진단 결과</h3>
            <div className="mt-5 grid gap-3">
              <InfoItem label="문의 유형" value={inquiryTypeLabels[inquiryType].ko} />
              <InfoItem label="긴급도" value={urgencyLabels[inquiryUrgency].ko} />
              <InfoItem label="상담 필요 여부" value={inquiry.consultationRequired ? "필요" : "기본 안내 후 진행"} />
              <InfoItem label="분류 신뢰도" value={`${Math.round(inquiry.classificationConfidence * 100)}%`} />
              <InfoItem label="수임 적합도" value={`${inquiry.qualificationScore} / 100`} />
            </div>
            <Card muted className="mt-5 p-5">
              <p className="ui-kicker">진단 근거</p>
              <p className="mt-3 text-sm text-text">{inquiry.classificationReason}</p>
            </Card>
            <Card muted className="mt-5 p-5">
              <p className="ui-kicker">리스크·난이도 힌트</p>
              <p className="mt-3 text-sm text-text">{inquiry.riskComplexityHint || "일반 수준"}</p>
            </Card>
            <Card muted className="mt-5 p-5">
              <p className="ui-kicker">권장 다음 조치</p>
              <p className="mt-3 text-sm text-text">{inquiry.recommendedNextStep}</p>
            </Card>
            <Card muted className="mt-5 p-5">
              <p className="ui-kicker">준비 권장 서류</p>
              <ul className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text">
                {precheckDocs.length > 0 ? (
                  precheckDocs.map((doc) => <li key={doc}>{doc}</li>)
                ) : (
                  <li>서류 목록 자동 생성 없음</li>
                )}
              </ul>
            </Card>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </Card>

          <InquiryCaseAnalysisPanel analysis={caseAnalysis} />
          <InquiryDecisionBoard
            analysis={caseAnalysis}
            lawbotAnalysis={lawbotAnalysis}
            references={referenceRecommendations}
            qualificationScore={inquiry.qualificationScore}
          />
          <InquiryExecutionPlaybook
            analysis={caseAnalysis}
            lawbotAnalysis={lawbotAnalysis}
            references={referenceRecommendations}
          />
          <InquiryCaseTimeline items={caseTimeline} />
          <InquiryCommunicationCenter
            drafts={communicationDrafts}
            recommendedDraftIds={recommendedCommunicationIds}
            recommendationLabel={routeRecommendation.recommendationLabel}
          />
          <LawbotSnapshotCompare
            headline={lawbotSnapshotComparison.headline}
            description={lawbotSnapshotComparison.description}
            fields={lawbotSnapshotComparison.fields}
          />
          <InquiryOperationsFeedPanel
            items={operationsFeed}
            communicationDraft={operationsDraft}
            communicationDraftDisplay={operationsDraftDisplay}
          />
          <LawbotCaseAnalysisPanel
            inquiryId={inquiry.id}
            initialResult={lawbotAnalysis}
            connectionSnapshot={lawbotConnectionSnapshot}
            storedSnapshot={storedLawbotSnapshot}
          />
          <ReferenceRecommendationsPanel recommendations={referenceRecommendations} />

          <Card className="p-6">
            <h3 className="ui-section-title">자동 안내 메시지 미리보기</h3>
            <p className="mt-2 text-sm text-text-muted">
              추후 이메일, 문자, 알림톡으로 연결할 때 사용할 템플릿 구조입니다.
            </p>
            <div className="mt-5">
              <InquiryMessagePreview previews={previews} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="ui-section-title">현재 생성된 자동 텍스트</h3>
            <TextPanel title="준비 권장 서류" content={inquiry.generatedGuidance} />
            <TextPanel title="접수 완료 메시지" content={inquiry.generatedReceiptMessage} />
          </Card>
        </div>
      </div>

      <QuoteWorkspacePanel inquiryId={inquiry.id} workspace={quoteWorkspace} />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm text-text">{value || "-"}</p>
    </Card>
  );
}

function TextPanel({ title, content }: { title: string; content: string }) {
  return (
    <Card muted className="mt-4 p-5">
      <p className="ui-kicker">{title}</p>
      <p className="mt-3 whitespace-pre-line text-sm text-text">{content}</p>
    </Card>
  );
}
