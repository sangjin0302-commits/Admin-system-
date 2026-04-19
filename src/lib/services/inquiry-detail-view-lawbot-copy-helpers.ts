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
