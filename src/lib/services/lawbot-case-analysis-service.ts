import type { InquiryRecord } from "@/lib/services/inquiry-service";

type LawbotApplicableLaw = {
  law: string;
  summary: string;
};

type LawbotSearchQuery = {
  kind: "law" | "precedent" | "interpretation" | "general";
  query: string;
  label: string;
};

type LawbotPrecedentSuggestion = {
  query: string;
};

type LawbotRelatedPrecedent = {
  case_name: string;
  case_number: string;
  decision_date?: string | null;
  court_name?: string | null;
  reason: string;
};

type LawbotRelatedInterpretation = {
  title: string;
  number?: string | null;
  decision_date?: string | null;
  agency?: string | null;
  reason: string;
};

type LawbotResponse = {
  input_summary: string;
  key_issues: string[];
  followup_facts: string[];
  applicable_laws: LawbotApplicableLaw[];
  analysis_mode?: "internal" | "public_fast";
  precedent_source_type?: "real" | "fallback" | "none";
  interpret_source_type?: "real" | "fallback" | "none";
  next_search_recommendations: string[];
  recommended_search_queries: LawbotSearchQuery[];
  precedent_search_suggestions?: LawbotPrecedentSuggestion[];
  related_precedents?: LawbotRelatedPrecedent[];
  related_interpretations?: LawbotRelatedInterpretation[];
  pros?: string[];
  cons?: string[];
  argument_strategy?: string[];
  counter_argument_points?: string[];
};

export type LawbotCaseAnalysisResult =
  | {
      status: "available";
      data: LawbotResponse;
    }
  | {
      status: "disabled";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };

function buildFactInput(inquiry: NonNullable<InquiryRecord>) {
  return [
    `사건 제목: ${inquiry.title}`,
    `문의 유형: ${inquiry.inquiryType}`,
    inquiry.contactName ? `이름: ${inquiry.contactName}` : null,
    inquiry.nationality ? `국적: ${inquiry.nationality}` : null,
    inquiry.currentStatus ? `현재 상태: ${inquiry.currentStatus}` : null,
    inquiry.targetAgency ? `관할 기관: ${inquiry.targetAgency}` : null,
    inquiry.requestedOutcome ? `원하는 결과: ${inquiry.requestedOutcome}` : null,
    inquiry.description ? `상세 내용: ${inquiry.description}` : null,
    inquiry.generatedSummary ? `기존 요약: ${inquiry.generatedSummary}` : null,
    inquiry.classificationReason ? `분류 근거: ${inquiry.classificationReason}` : null,
    inquiry.recommendedNextStep ? `기존 권장 조치: ${inquiry.recommendedNextStep}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

export async function getLawbotCaseAnalysis(
  inquiry: NonNullable<InquiryRecord>
): Promise<LawbotCaseAnalysisResult> {
  const analyzeUrl = process.env.LAWBOT_ANALYZE_URL?.trim();
  const analyzeToken = process.env.LAWBOT_ANALYZE_TOKEN?.trim();

  if (!analyzeUrl) {
    return {
      status: "disabled",
      message: "Lawbot 분석 주소가 아직 설정되지 않아 내부 사건 분석만 표시합니다."
    };
  }

  const timeoutMs = Number(process.env.LAWBOT_ANALYZE_TIMEOUT_MS ?? "8000");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(analyzeToken ? { "x-lawbot-token": analyzeToken } : {})
      },
      body: JSON.stringify({
        fact_input: buildFactInput(inquiry)
      }),
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        status: "error",
        message: `Lawbot 분석 호출에 실패했습니다. (${response.status})`
      };
    }

    const json = (await response.json()) as LawbotResponse;

    return {
      status: "available",
      data: json
    };
  } catch {
    return {
      status: "error",
      message: "Lawbot 분석 서버에 연결하지 못했습니다. 주소 또는 서비스 상태를 확인해 주세요."
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
