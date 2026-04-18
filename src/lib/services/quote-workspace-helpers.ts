import type { QuoteSummarySnapshot, QuoteWorkspace } from "@/lib/quote-engine/types";
import { formatCurrency } from "@/lib/quote-engine/utils";
import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";

export const stageKindLabels: Record<string, string> = {
  RETAINER: "착수금",
  MIDTERM: "중도금",
  SUCCESS: "성공보수"
};

export const quoteStatusLabels: Record<string, string> = {
  DRAFT: "초안",
  READY_TO_SEND: "발송 준비",
  SENT: "발송 완료",
  ACCEPTED: "수락",
  REJECTED: "거절",
  EXPIRED: "만료"
};

export const caseStageLabels: Record<string, string> = {
  CONTRACT_PREPARATION: "계약 준비",
  DOCUMENT_COLLECTION: "서류 수집",
  UNDER_REVIEW: "검토 중",
  ACTIVE: "진행 중",
  SUBMITTED: "제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청",
  COMPLETED: "완료",
  ON_HOLD: "보류",
  CLOSED: "종결"
};

export function formatRange(min: number, max: number) {
  if (min === max) {
    return formatCurrency(min);
  }

  return `${formatCurrency(min)} ~ ${formatCurrency(max)}`;
}

export function buildCaseAnalysisDraft(workspace: QuoteWorkspace) {
  const analysis = workspace.caseAnalysis;
  return [
    "[AI 사건 분석 요약]",
    `- 사건 강도: ${analysis.strengthLabel} (${analysis.strengthScore}점)`,
    `- 해결 가능성: ${analysis.resolutionOutlook} (${analysis.resolutionProbabilityPercent}/100)`,
    `- 사건 요약: ${analysis.summary}`,
    "",
    "[핵심 쟁점]",
    ...analysis.issues.map((item) => `- ${item}`),
    "",
    "[유리 요소]",
    ...analysis.favorableFactors.map((item) => `- ${item}`),
    "",
    "[불리 요소]",
    ...analysis.riskFactors.map((item) => `- ${item}`),
    "",
    "[추가 확인 필요 사실]",
    ...analysis.missingFacts.map((item) => `- ${item}`),
    "",
    "[즉시 확인할 항목]",
    ...analysis.immediateActions.map((item) => `- ${item}`),
    "",
    "[권장 다음 조치]",
    `- ${analysis.recommendedAction}`,
    "",
    "[고객 안내 초안]",
    analysis.communicationGuidance.clientSummary,
    "",
    "[자료 요청 초안]",
    analysis.communicationGuidance.documentRequest,
    "",
    "[참고 법령]",
    ...analysis.lawReferences.map((item) => `- ${item.title}: ${item.summary}`),
    "",
    "[판례 검색어]",
    ...analysis.precedentReferences.map((item) => `- ${item.query}`)
  ].join("\n");
}

export function buildLawbotAnalysisDraft(result: LawbotCaseAnalysisResult) {
  if (result.status !== "available") {
    return null;
  }

  const data = result.data;
  return [
    "[Lawbot 참고 분석]",
    `- 입력 요약: ${data.input_summary}`,
    "",
    "[Lawbot 핵심 쟁점]",
    ...(data.key_issues.length > 0 ? data.key_issues.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 추가 확인 사실]",
    ...(data.followup_facts.length > 0 ? data.followup_facts.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 참고 법령]",
    ...(data.applicable_laws.length > 0 ? data.applicable_laws.map((item) => `- ${item.law}: ${item.summary}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 참고 판례]",
    ...(data.related_precedents?.length
      ? data.related_precedents.map((item) =>
          `- ${item.case_name} / ${item.case_number}${item.court_name ? ` / ${item.court_name}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}`
        )
      : ["- 원문 명시 없음"])
  ].join("\n");
}

export function buildActionChecklist(workspace: QuoteWorkspace) {
  const actions = [
    workspace.caseAnalysis.recommendedAction,
    ...workspace.caseAnalysis.missingFacts.slice(0, 3).map((item) => `${item} 확인`)
  ];

  if (workspace.lawbotAnalysis.status === "available") {
    actions.push(...workspace.lawbotAnalysis.data.next_search_recommendations.slice(0, 3));
  }

  return [...new Set(actions.filter(Boolean))];
}

export function buildActionTemplates(workspace: QuoteWorkspace, quote: QuoteSummarySnapshot | null) {
  const missingFacts = workspace.caseAnalysis.missingFacts.slice(0, 3);
  const lawbotMissingFacts =
    workspace.lawbotAnalysis.status === "available"
      ? workspace.lawbotAnalysis.data.followup_facts.slice(0, 3)
      : [];

  const combinedMissingFacts = [...new Set([...missingFacts, ...lawbotMissingFacts])].slice(0, 4);
  const documentRequest = [
    `${workspace.inquiry.contactName}님, 문의 내용 검토 결과 우선 아래 자료를 먼저 확인하면 다음 단계 판단이 훨씬 빨라집니다.`,
    "",
    ...combinedMissingFacts.map((item, index) => `${index + 1}. ${item}`),
    "",
    "자료를 보내주시면 확인 후 상담 또는 견적 진행 방향을 순차적으로 안내드리겠습니다."
  ].join("\n");

  const cautiousReview = [
    `${workspace.inquiry.contactName}님, 현재 내용만으로는 바로 진행 판단을 확정하기보다 추가 사실 확인이 먼저 필요한 상태입니다.`,
    workspace.caseAnalysis.recommendedAction,
    "",
    "관련 자료를 보완해 주시면 가능 범위와 주의할 점을 정리해서 다시 안내드리겠습니다."
  ].join("\n");

  const quoteAdvance = [
    `${workspace.inquiry.contactName}님, 현재 검토 기준으로는 견적 또는 수임 검토 단계로 이어갈 수 있는 여지가 있습니다.`,
    quote ? `예상 견적 범위는 ${formatRange(quote.totalMin, quote.totalMax)}입니다.` : "세부 견적은 자료 확인 후 확정됩니다.",
    workspace.caseAnalysis.recommendedAction,
    "",
    "원하시면 바로 견적 설명과 다음 준비 절차를 안내드리겠습니다."
  ].join("\n");

  return { documentRequest, cautiousReview, quoteAdvance };
}

export function buildRecommendedSpecialTerms(workspace: QuoteWorkspace) {
  const missingFacts = workspace.caseAnalysis.missingFacts.slice(0, 3);
  const lawbotFollowups =
    workspace.lawbotAnalysis.status === "available"
      ? workspace.lawbotAnalysis.data.followup_facts.slice(0, 3)
      : [];

  const factChecklist = [...new Set([...missingFacts, ...lawbotFollowups])];

  return [
    "[권장 특약 초안]",
    "1. 의뢰인은 사실관계와 제출자료를 정확하게 제공하고, 추가 확인 요청이 있는 경우 지체 없이 협조합니다.",
    "2. 행정기관 또는 관계기관의 심사 기준, 재량 판단, 보완 요구, 제도 변경에 따라 결과와 소요 기간이 달라질 수 있습니다.",
    "3. 업무 범위에 포함되지 않은 번역, 공증, 외부 수수료, 추가 보완 대응, 현장 방문은 별도 협의 또는 추가 비용 대상이 될 수 있습니다.",
    "4. 실제 제출 전 사실관계 또는 서류 상태가 달라질 경우 보수와 진행 전략이 조정될 수 있습니다.",
    factChecklist.length > 0 ? "" : null,
    factChecklist.length > 0 ? "[추가 확인 필요 사항]" : null,
    ...factChecklist.map((item, index) => `${index + 1}. ${item}`)
  ]
    .filter(Boolean)
    .join("\n");
}
