import type { InquiryRecord } from "@/lib/services/inquiry-service";
import {
  buildFactInput,
  buildLawbotConnectionSnapshot,
  buildStoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-snapshot-helpers";
import type {
  LawbotCaseAnalysisResult,
  LawbotResponse
} from "@/lib/services/lawbot-case-analysis-types";

export {
  buildLawbotConnectionSnapshot,
  buildStoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-snapshot-helpers";
export type {
  LawbotCaseAnalysisResult,
  LawbotConnectionSnapshot,
  StoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-types";

export async function getLawbotCaseAnalysis(
  inquiry: NonNullable<InquiryRecord>
): Promise<LawbotCaseAnalysisResult> {
  const analyzeUrl = process.env.LAWBOT_ANALYZE_URL?.trim();
  const analyzeToken = process.env.LAWBOT_ANALYZE_TOKEN?.trim();

  if (!analyzeUrl) {
    return {
      status: "disabled",
      message: "Lawbot 분석 URL이 설정되지 않아 내부 사건 분석만 표시합니다."
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
      message: "Lawbot 분석 서버에 연결하지 못했습니다. URL 또는 서비스 상태를 확인해 주세요."
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
