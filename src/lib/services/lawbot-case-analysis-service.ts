import type { InquiryRecord } from "@/lib/services/inquiry-service";
import { normalizeLawbotResponse } from "@/lib/services/lawbot-case-analysis-contract";
import {
  buildFactInput,
  buildLawbotConnectionSnapshot,
  buildStoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-snapshot-helpers";
import type {
  LawbotCaseAnalysisResult,
  LawbotOperationOutcome,
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

type GetLawbotCaseAnalysisOptions = {
  trigger?: "automatic" | "manual";
};

function buildOutcome(
  status: LawbotOperationOutcome["status"],
  reasonCode: LawbotOperationOutcome["reasonCode"]
): LawbotOperationOutcome {
  return { status, reasonCode };
}

export async function getLawbotCaseAnalysis(
  inquiry: NonNullable<InquiryRecord>,
  options: GetLawbotCaseAnalysisOptions = {}
): Promise<LawbotCaseAnalysisResult> {
  const trigger = options.trigger ?? "automatic";
  const automaticCallsEnabled = process.env.LAWBOT_ENABLE_AUTOMATIC_CALLS?.trim().toLowerCase() === "true";
  const analyzeUrl = process.env.LAWBOT_ANALYZE_URL?.trim();
  const analyzeToken = process.env.LAWBOT_ANALYZE_TOKEN?.trim();

  if (!analyzeUrl) {
    return {
      status: "disabled",
      message: "Lawbot analyze URL is not configured.",
      outcome: buildOutcome("skipped_by_policy", "missing_analyze_url")
    };
  }

  if (trigger !== "manual" && !automaticCallsEnabled) {
    return {
      status: "disabled",
      message: "Automatic Lawbot calls are disabled by policy.",
      outcome: buildOutcome("skipped_by_policy", "automatic_calls_disabled")
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
        message: `Lawbot analyze request failed (${response.status}).`,
        outcome: buildOutcome("failed", "upstream_http_error")
      };
    }

    const rawJson = (await response.json()) as unknown;
    const normalized = normalizeLawbotResponse(rawJson);
    if (!normalized.ok) {
      return {
        status: "error",
        message: `Lawbot response contract validation failed: ${normalized.reason}`,
        outcome: buildOutcome("failed", "contract_validation_failed")
      };
    }
    const json = normalized.data as LawbotResponse;

    return {
      status: "available",
      data: json,
      outcome: buildOutcome("success", "analysis_completed")
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        status: "error",
        message: "Lawbot analyze request timed out.",
        outcome: buildOutcome("failed", "request_timeout")
      };
    }

    return {
      status: "error",
      message: "Unable to reach Lawbot analyze service.",
      outcome: buildOutcome("failed", "network_error")
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
