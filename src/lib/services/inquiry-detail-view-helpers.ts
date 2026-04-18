import type { InquiryStatus } from "@/types/inquiry";

type StrengthLabel = "강함" | "보통" | "주의" | "불리";

export type DetailRiskHighlight = {
  title: string;
  description: string;
  tone: "danger" | "warning" | "info";
};

export type MockMarketAnalyzeSignal = {
  status: string;
  summary: string;
  demandScore: number;
  responseTempoKey: "docs-first" | "consult-first" | "fast-response";
  routeBias: "review" | "consult" | "quote";
  metrics: { label: string; value: string }[];
  highlights: string[];
};

function isWithinDays(date: Date | null | undefined, days: number) {
  if (!date) return false;
  const now = new Date();
  const distance = date.getTime() - now.getTime();
  return distance >= 0 && distance <= days * 24 * 60 * 60 * 1000;
}

export function getQuickStatuses(strengthLabel: StrengthLabel): InquiryStatus[] {
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

export function buildDetailRiskHighlights(input: {
  dueDate?: Date | null;
  responsePending: boolean;
  missingFacts: string[];
  documentChecklist: string[];
  reviewReasons: string[];
  riskFlags: string[];
}): DetailRiskHighlight[] {
  const highlights: DetailRiskHighlight[] = [];
  const now = Date.now();
  const dueDateTime = input.dueDate?.getTime() ?? null;

  if (dueDateTime !== null && dueDateTime < now) {
    highlights.push({
      title: "일정 초과",
      description: "희망 일정이 지났습니다. 고객 안내와 내부 우선순위 재정렬이 필요합니다.",
      tone: "danger"
    });
  } else if (isWithinDays(input.dueDate, 1)) {
    highlights.push({
      title: "당일 일정",
      description: "24시간 이내 일정입니다. 사실관계 확인과 다음 액션 확정이 우선입니다.",
      tone: "danger"
    });
  }

  if (input.responsePending) {
    highlights.push({
      title: "응답 대기",
      description: "고객 회신 또는 자료 회신이 대기 중입니다. 연락 후속을 먼저 점검하세요.",
      tone: "warning"
    });
  }

  if (input.missingFacts.length > 0) {
    highlights.push({
      title: "핵심 사실 누락",
      description: `누락된 핵심 사실 ${input.missingFacts.length}건이 있어 판단 오차 위험이 있습니다.`,
      tone: "danger"
    });
  }

  if (input.documentChecklist.length > 0) {
    highlights.push({
      title: "필수 자료 미확보",
      description: `Lawbot 기준 준비 자료 ${input.documentChecklist.length}건이 남아 있습니다.`,
      tone: "warning"
    });
  }

  if (input.reviewReasons.length > 0 || input.riskFlags.length > 0) {
    highlights.push({
      title: "추가 검토 신호",
      description: `추가 검토 사유 ${input.reviewReasons.length}건 / 리스크 플래그 ${input.riskFlags.length}건`,
      tone: "info"
    });
  }

  return highlights.slice(0, 4);
}

export function buildDetailImmediateActions(input: {
  dueDate?: Date | null;
  responsePending: boolean;
  missingFacts: string[];
  documentChecklist: string[];
  reviewReasons: string[];
  routeRecommendationLabel: string;
}) {
  const actions: string[] = [];
  const now = Date.now();
  const dueDateTime = input.dueDate?.getTime() ?? null;

  if (dueDateTime !== null && dueDateTime < now) {
    actions.push("기한 초과 안내 여부를 먼저 확인하고 고객 커뮤니케이션 로그를 즉시 업데이트하세요.");
  } else if (isWithinDays(input.dueDate, 1)) {
    actions.push("당일 일정 건이므로 상담/서류 확인 우선순위를 최상단으로 올리세요.");
  }

  if (input.responsePending) {
    actions.push("응답 대기 상태를 해소할 다음 연락 일정을 확정해 로그에 남기세요.");
  }

  if (input.missingFacts.length > 0) {
    actions.push(`빠진 핵심 사실(${input.missingFacts.length}건)을 기준으로 추가 질문을 먼저 보내세요.`);
  }

  if (input.documentChecklist.length > 0) {
    actions.push(`준비 자료 체크리스트(${input.documentChecklist.length}건) 요청 문안을 바로 발송하세요.`);
  }

  if (input.reviewReasons.length > 0) {
    actions.push("추가 검토 필요 사유를 내부 메모에 구조화해 상태 전환 근거를 남기세요.");
  }

  actions.push(`현재 추천 경로(${input.routeRecommendationLabel}) 기준으로 상태와 후속 액션을 맞추세요.`);

  return actions.slice(0, 5);
}

export function detailRiskToneClass(tone: DetailRiskHighlight["tone"]) {
  if (tone === "danger") return "border-danger/30 bg-danger/10 text-danger";
  if (tone === "warning") return "border-warning/30 bg-warning/10 text-warning";
  return "border-info/30 bg-info/10 text-info";
}

export function buildLawbotClientSummary(input: {
  contactName: string;
  defaultSummary: string;
  lawbotSourceLabel: string;
  lawbotSummary?: string | null;
  lawbotPracticalUseStatus?: string | null;
  lawbotReviewReasons: string[];
  routeSignalSummary?: string | null;
}) {
  if (
    !input.lawbotSummary &&
    !input.lawbotPracticalUseStatus &&
    input.lawbotReviewReasons.length === 0 &&
    !input.routeSignalSummary
  ) {
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

export function buildLawbotDocumentRequest(input: {
  contactName: string;
  defaultRequest: string;
  lawbotDocumentChecklist: string[];
  lawbotMissingFacts: string[];
  routeSignalSummary?: string | null;
}) {
  if (
    input.lawbotDocumentChecklist.length === 0 &&
    input.lawbotMissingFacts.length === 0 &&
    !input.routeSignalSummary
  ) {
    return input.defaultRequest;
  }

  return [
    `${input.contactName}님, 정확한 검토를 위해 아래 자료와 사실관계 확인이 우선 필요합니다.`,
    input.routeSignalSummary ? `참고 기준: ${input.routeSignalSummary}` : null,
    ...(input.lawbotDocumentChecklist.slice(0, 5).map((item, index) => `${index + 1}. ${item}`) ?? []),
    ...(input.lawbotMissingFacts
      .slice(0, 3)
      .map((item, index) => `${index + 1 + Math.min(input.lawbotDocumentChecklist.length, 5)}. ${item}`) ?? []),
    "",
    input.defaultRequest
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildRouteSignalSummary(input: {
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

export function recommendOperationalRoute(input: {
  strengthLabel: StrengthLabel;
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
    input.lawbotReviewReasons.length + input.lawbotRiskFlags.length + input.lawbotMissingFacts.length;
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
    recommendationReason =
      "Lawbot 위험 신호나 추가 검토 포인트가 커서 외부 응답 기대치보다 보수적 검토가 먼저입니다.";
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
    recommendationReason =
      "Lawbot 준비도가 비교적 좋고 mock market-analyze 수요 온도도 높아 견적 검토로 넘기기 좋은 구간입니다.";
  } else if (favorsConsult || (marketDemandScore >= 74 && !favorsQuote)) {
    recommendedStatus = "CONSULTATION_REQUIRED";
    recommendationLabel = "상담 진행 권장";
    recommendationReason =
      "Lawbot상 즉시 보류 사유는 크지 않고 외부 반응 신호가 상담 선정리 흐름에 가까워 상담 연결이 가장 자연스럽습니다.";
  } else {
    recommendedStatus = "CONSULTATION_REQUIRED";
    recommendationLabel = "상담 진행 권장";
    recommendationReason = "즉시 보류할 정도는 아니지만, 방향 정리를 위한 상담 단계가 가장 자연스럽습니다.";
  }

  const orderedStatuses = [recommendedStatus, ...input.quickStatuses.filter((status) => status !== recommendedStatus)];

  return {
    recommendedStatus,
    recommendationLabel,
    recommendationReason,
    orderedStatuses
  };
}

export function buildRecommendedCommunicationIds(input: {
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

export function buildAnalysisHubSignals(input: {
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

export function buildCrossAnalysisSummary(input: {
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

export function buildExternalInsightSlots() {
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

export function buildMockMarketAnalyzeSignal(input: {
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
