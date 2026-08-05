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

/** 텔레그램/로그용 요약 라인. 첫 줄=건수, 이후 상위 maxItems 건 제목(구분 접두). */
export function buildGazetteDigestLines(picked: GazetteItem[], maxItems = 8): string[] {
  const top = picked.slice(0, maxItems);
  return [
    `🗞 지난 7일 관보 ${picked.length}건`,
    ...top.map((g) => {
      const cat = g.category ? `[${g.category}] ` : "";
      return `• ${cat}${g.title}`.slice(0, 180);
    }),
  ];
}
