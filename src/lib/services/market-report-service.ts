/**
 * 시장 AI 리포트 — **버튼 클릭 시에만** 실행됩니다.
 *
 * 비용 원칙: AI 상시 지출 0. 자동 실행·cron 연결 금지.
 * 동일 집계에 대해 1시간 캐시하여 연속 클릭 시 재호출하지 않습니다.
 */

import { withCache } from "@/lib/services/cache-service";
import { getMarketDashboard, listDocuments } from "@/lib/services/market-collect-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";
import { logger } from "@/lib/utils/logger";

const CACHE_KEY = "market:ai-report";
const CACHE_TTL_SECONDS = 3600; // 1시간

const SYSTEM_PROMPT = [
  "당신은 행정사무소의 시장 분석 어시스턴트입니다.",
  "주어진 수집 데이터에 근거한 **사실 나열과 관찰된 패턴**만 서술하십시오.",
  "",
  "절대 금지 (v6.4 마케팅 지침 준수):",
  "- 승소·인용 가능성 예측이나 결과 보장 표현",
  "- 과장된 표현('최고', '1위', '압도적' 등)",
  "- 경쟁사 비방·폄훼, 특정 사무소에 대한 부정적 단정",
  "- 데이터에 없는 사실의 추측·창작",
  "",
  "작성 규칙:",
  "- 수치는 제공된 집계값만 사용하고, 근거가 없으면 '데이터 부족'이라고 명시하십시오.",
  "- 경쟁사는 관찰된 게시 활동·주제 분포로만 중립적으로 기술하십시오.",
  "- 한국어, 마크다운, 800자 내외.",
  "- 구성: ## 요약 / ## 경쟁사 동향 / ## 여론·위험 신호 / ## 관찰된 기회",
].join("\n");

export type MarketReport = {
  ok: boolean;
  report: string;
  model?: string;
  generatedAt: string;
  skipped?: string;
};

/** 대시보드 집계 + 상위 경쟁사 + 최근 문서 → AI 리포트. 1시간 캐시. */
export async function generateMarketReport(): Promise<MarketReport> {
  try {
    return await withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
      const [dashboard, recentDocs] = await Promise.all([
        getMarketDashboard(),
        listDocuments({ limit: 25 }),
      ]);

      if (dashboard.totals.documents === 0) {
        return {
          ok: false,
          report: "",
          skipped: "no_data",
          generatedAt: new Date().toISOString(),
        } satisfies MarketReport;
      }

      const facts = [
        `수집 문서: ${dashboard.totals.documents}건 (분석 대상 ${dashboard.totals.relevant}건)`,
        `식별된 경쟁사: ${dashboard.totals.competitors}곳`,
        `최근 수집: ${dashboard.lastCollectedAt ?? "없음"}`,
        "",
        "[여론 분포]",
        ...dashboard.sentimentBreakdown.map((s) => `- ${s.sentiment}: ${s.count}건`),
        "",
        "[상위 경쟁사]",
        ...dashboard.topCompetitors.map(
          (c) =>
            `- ${c.displayName} | 7일 ${c.postingFreq7d}건 / 30일 ${c.postingFreq30d}건 | 노출점수 ${c.visibilityScore} | 주제: ${c.mainTopics.join(", ") || "미분류"} | 지역: ${c.regionTags.join(", ") || "미상"}`
        ),
        "",
        "[주제 분포 (최근 30일)]",
        ...dashboard.risingTopics.map((t) => `- ${t.topic}: ${t.count}건`),
        "",
        "[최근 위험 신호]",
        ...dashboard.recentRisks.slice(0, 8).map((r) => `- ${r.title} → ${r.riskFlags.join(", ")}`),
        "",
        "[최근 문서 제목]",
        ...recentDocs.slice(0, 15).map((d) => `- [${d.docType}/${d.sentiment}] ${d.title}`),
      ].join("\n");

      const prompt = [
        "다음은 네이버에서 수집·분류한 행정사 시장 데이터 집계입니다.",
        "이 데이터에 근거해서만 시장·경쟁사 분석 리포트를 작성하십시오.",
        "",
        facts,
      ].join("\n");

      const result = await smartInvoke("drafting", prompt, {
        system: SYSTEM_PROMPT,
        maxTokens: 1500,
        inputLength: prompt.length,
      });

      return {
        ok: true,
        report: result.text,
        model: result.model,
        generatedAt: new Date().toISOString(),
      } satisfies MarketReport;
    });
  } catch (err) {
    logger.error("[market-report] 리포트 생성 실패", err);
    return {
      ok: false,
      report: "",
      skipped: "report_failed",
      generatedAt: new Date().toISOString(),
    };
  }
}
