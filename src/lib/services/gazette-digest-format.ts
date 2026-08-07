/**
 * 주간 관보 요약 — 선택·포맷 순수 로직(네트워크·DB·env 없음).
 * cron 라우트에서 분리해 단위 테스트로 계약 고정(test:gazette-digest).
 */
import type { GazetteItem } from "@/lib/services/gazette-client";

/**
 * 지난 7일 관보 선택.
 * - 날짜 있는 항목 중 window 내(dateMs>=weekAgoMs)면 그것들.
 * - 날짜는 있으나 window 내가 없으면 [](이번 주 새 관보 없음).
 * - 날짜 파싱이 전부 실패(dateMs=0)면 최신 fallbackCount 건으로 폴백.
 */
export function selectRecentGazette(
  items: GazetteItem[],
  weekAgoMs: number,
  fallbackCount = 10
): GazetteItem[] {
  const dated = items.filter((i) => i.dateMs > 0);
  const recent = dated.filter((i) => i.dateMs >= weekAgoMs);
  if (recent.length > 0) return recent;
  if (dated.length > 0) return [];
  return items.slice(0, fallbackCount);
}

export type GazetteStats = {
  total: number;
  byAgency: { agency: string; count: number }[]; // 많은 순
  dateRange: { fromMs: number; toMs: number } | null; // 날짜 있는 항목 기준
};

/** 주간 관보 통계 — 총건수·기관별 분포·기간. 순수 계산(테스트 고정). */
export function buildGazetteStats(picked: GazetteItem[]): GazetteStats {
  const byAgencyMap = new Map<string, number>();
  let fromMs = Number.POSITIVE_INFINITY;
  let toMs = 0;
  for (const g of picked) {
    const agency = (g.agency ?? "").trim() || "기타";
    byAgencyMap.set(agency, (byAgencyMap.get(agency) ?? 0) + 1);
    if (g.dateMs > 0) {
      if (g.dateMs < fromMs) fromMs = g.dateMs;
      if (g.dateMs > toMs) toMs = g.dateMs;
    }
  }
  const byAgency = [...byAgencyMap.entries()]
    .map(([agency, count]) => ({ agency, count }))
    .sort((a, b) => b.count - a.count || a.agency.localeCompare(b.agency));
  return {
    total: picked.length,
    byAgency,
    dateRange: toMs > 0 ? { fromMs, toMs } : null,
  };
}

/**
 * 텔레그램/로그용 요약 라인. 통계(총건수·상위 기관) + 상위 maxItems 건 제목(기관 접두).
 * (관보는 카테고리 태깅을 하지 않으므로 접두는 발령기관으로.)
 */
export function buildGazetteDigestLines(picked: GazetteItem[], maxItems = 8): string[] {
  const stats = buildGazetteStats(picked);
  const top = picked.slice(0, maxItems);
  const agencyLine =
    stats.byAgency.length > 0
      ? "기관별: " + stats.byAgency.slice(0, 4).map((a) => `${a.agency} ${a.count}`).join(" · ")
      : "";
  return [
    `🗞 지난 7일 관보 ${stats.total}건`,
    ...(agencyLine ? [agencyLine] : []),
    ...top.map((g) => {
      const agency = (g.agency ?? "").trim() ? `[${g.agency}] ` : "";
      return `• ${agency}${g.title}`.slice(0, 180);
    }),
  ];
}
