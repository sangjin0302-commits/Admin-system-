import { serializeStructuredOperationsMemo } from "@/lib/services/operations-memo";
import type { InquiryStatus } from "@/types/inquiry";

export function buildOperationsDraft(input: {
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
    ...(input.lawbotPriorityActions.length
      ? ["", "[Lawbot 우선 액션]", ...input.lawbotPriorityActions.slice(0, 3).map((item) => `- ${item}`)]
      : []),
    ...(input.lawbotDocumentChecklist.length
      ? ["", "[먼저 받을 자료]", ...input.lawbotDocumentChecklist.slice(0, 4).map((item) => `- ${item}`)]
      : []),
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

export function buildAutomationActions(input: {
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
  const topFacts = [
    ...new Set([...input.missingFacts, ...input.lawbotDocumentChecklist, ...input.lawbotPriorityActions])
  ].slice(0, 4);
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
        ...(input.lawbotReviewReasons.length
          ? ["", "[추가 검토 필요]", ...input.lawbotReviewReasons.slice(0, 3).map((item) => `- ${item}`)]
          : []),
        "",
        "[먼저 확인할 자료]",
        factLines || "1. 기본 사실관계와 서류 보유 여부",
        "",
        buildStructuredActionMemoBlock(
          "자료 요청 준비",
          "IN_REVIEW",
          `${input.contactName}님 건을 자료 요청 중심으로 전환하고 누락 자료와 핵심 사실부터 확인합니다.`
        )
      ]
        .filter(Boolean)
        .join("\n"),
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
      ]
        .filter(Boolean)
        .join("\n"),
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
        ...(input.lawbotPriorityActions.length
          ? ["", "[Lawbot 우선 액션]", ...input.lawbotPriorityActions.slice(0, 3).map((item) => `- ${item}`)]
          : []),
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
        ...(input.lawbotRiskFlags.length
          ? ["", "[리스크 플래그]", ...input.lawbotRiskFlags.slice(0, 3).map((item) => `- ${item}`)]
          : []),
        "",
        "[보류 사유 메모]",
        factLines || "1. 핵심 사실관계 추가 확인 필요",
        "",
        buildStructuredActionMemoBlock(
          "보류 검토",
          "ON_HOLD",
          `${input.contactName}님 건은 보수적 검토가 우선이며 리스크와 추가 확인 항목을 정리한 뒤 다시 판단합니다.`
        )
      ]
        .filter(Boolean)
        .join("\n"),
      recommended: input.routeRecommendation.recommendedStatus === "ON_HOLD",
      recommendationNote: "위험 신호와 추가 검토 포인트가 커서 보수적으로 다루는 편이 좋습니다."
    }
  ];
}
