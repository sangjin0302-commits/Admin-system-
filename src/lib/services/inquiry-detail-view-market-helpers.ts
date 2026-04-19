import type { MockMarketAnalyzeSignal } from "@/lib/services/inquiry-detail-view-types";

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
