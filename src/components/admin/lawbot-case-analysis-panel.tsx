"use client";

import { useState } from "react";

import { parseClientApiError } from "@/lib/http/client-api";
import type {
  LawbotCaseAnalysisResult,
  LawbotConnectionSnapshot,
  StoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-service";

import { renderPanel } from "./lawbot-case-analysis/panel-renderer";

export function LawbotCaseAnalysisPanel({
  inquiryId,
  initialResult,
  connectionSnapshot,
  storedSnapshot
}: {
  inquiryId: string;
  initialResult: LawbotCaseAnalysisResult;
  connectionSnapshot: LawbotConnectionSnapshot;
  storedSnapshot: StoredLawbotSnapshot | null;
}) {
  const [result, setResult] = useState<LawbotCaseAnalysisResult>(initialResult);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshAnalysis() {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/lawbot-analysis`, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        setResult({
          status: "error",
          message: await parseClientApiError(response, "Lawbot 분석 결과를 다시 불러오지 못했습니다.")
        });
        return;
      }

      const payload = (await response.json().catch(() => null)) as { result?: LawbotCaseAnalysisResult } | null;
      if (!payload?.result) {
        setResult({
          status: "error",
          message: "Lawbot 응답 형식이 올바르지 않아 분석 결과를 갱신하지 못했습니다."
        });
        return;
      }

      setResult(payload.result);
    } catch {
      setResult({
        status: "error",
        message: "Lawbot 분석 결과를 다시 불러오는 중 문제가 발생했습니다."
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  return renderPanel(result, refreshAnalysis, isRefreshing, connectionSnapshot, storedSnapshot);
}
