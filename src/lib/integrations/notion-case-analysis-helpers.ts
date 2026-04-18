import type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-service";
import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";

type CaseAnalysisHelperInput = {
  analysis: InquiryCaseAnalysis;
  recommendedDocuments?: string[];
  lawbotAnalysis?: LawbotCaseAnalysisResult;
};

export function buildCaseSummary(input: {
  analysis: InquiryCaseAnalysis;
  lawbotAnalysis?: LawbotCaseAnalysisResult;
}) {
  const lawbotSummary =
    input.lawbotAnalysis?.status === "available"
      ? [
          input.lawbotAnalysis.data.practical_use_status
            ? `실전 사용 상태: ${input.lawbotAnalysis.data.practical_use_status}`
            : null,
          input.lawbotAnalysis.data.research_goal
            ? `조사 목표: ${input.lawbotAnalysis.data.research_goal}`
            : null
        ]
          .filter(Boolean)
          .join("\n")
      : null;

  return [
    input.analysis.summary,
    `사건 강도: ${input.analysis.strengthLabel} (${input.analysis.strengthScore}점)`,
    `핵심 쟁점: ${input.analysis.issues.slice(0, 2).join(", ") || "추가 확인 필요"}`,
    lawbotSummary
  ].join("\n");
}

export function buildNeededDocuments(input: CaseAnalysisHelperInput) {
  const lawDocs = input.analysis.lawReferences.map((item) => item.title);
  const recommendedDocs = input.recommendedDocuments ?? [];
  const lawbotDocs =
    input.lawbotAnalysis?.status === "available" ? (input.lawbotAnalysis.data.document_checklist ?? []) : [];

  return [...new Set([...recommendedDocs, ...lawDocs, ...lawbotDocs])].join(", ") || "추가 검토 필요";
}

export function buildMissingDocuments(input: {
  analysis: InquiryCaseAnalysis;
  lawbotAnalysis?: LawbotCaseAnalysisResult;
}) {
  const lawbotMissing =
    input.lawbotAnalysis?.status === "available" ? (input.lawbotAnalysis.data.critical_missing_facts ?? []) : [];

  return [...new Set([...input.analysis.missingFacts, ...lawbotMissing])].join(", ") || "원문 명시 없음";
}

export function buildNextAction(input: {
  analysis: InquiryCaseAnalysis;
  lawbotAnalysis?: LawbotCaseAnalysisResult;
}) {
  const lawbotPriorityAction =
    input.lawbotAnalysis?.status === "available" ? input.lawbotAnalysis.data.priority_actions?.[0] : null;
  const lawbotCheckpoint =
    input.lawbotAnalysis?.status === "available" ? input.lawbotAnalysis.data.practical_checklist?.[0] : null;

  return (
    lawbotPriorityAction ||
    lawbotCheckpoint ||
    input.analysis.recommendedAction ||
    input.analysis.issues[0] ||
    "사건 검토 후 다음 조치 확정"
  );
}
