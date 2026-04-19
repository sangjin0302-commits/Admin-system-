import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";
import { buildLawbotAnalysisDraft } from "@/lib/services/quote-lawbot-draft-helpers";
import type { QuoteWithRelations } from "@/lib/services/quote-serialization-helpers";

function buildContractAnalysisTerms(quote: QuoteWithRelations) {
  const analysis = analyzeInquiryCase(quote.inquiry);

  return [
    "[사건 분석 참고]",
    `사건 강도: ${analysis.strengthLabel} (${analysis.strengthScore}점)`,
    `사건 요약: ${analysis.summary}`,
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
    "[참고 법령]",
    ...analysis.lawReferences.map((item) => `- ${item.title}: ${item.summary}`),
    "",
    "[판례 검색어]",
    ...analysis.precedentReferences.map((item) => `- ${item.query}`)
  ].join("\n");
}

export function composeContractAnalysisTerms(
  quote: QuoteWithRelations,
  lawbotAnalysis?: Awaited<ReturnType<typeof getLawbotCaseAnalysis>>
) {
  const internalTerms = buildContractAnalysisTerms(quote);
  const lawbotTerms = buildLawbotAnalysisDraft(lawbotAnalysis ?? { status: "disabled", message: "" });

  return [internalTerms, lawbotTerms].filter(Boolean).join("\n\n");
}
