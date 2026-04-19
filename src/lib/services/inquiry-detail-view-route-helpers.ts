import type { InquiryStatus } from "@/types/inquiry";
import type {
  MockMarketAnalyzeSignal,
  StrengthLabel
} from "@/lib/services/inquiry-detail-view-types";

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
