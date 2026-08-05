/**
 * 키워드 랜딩 성과 집계(순수). GSC 검색어 행을 랜딩 토큰에 매칭해 랜딩별
 * 노출/클릭/CTR 을 합산하고 상태를 분류한다(네트워크·DB 없음 → test:landing-performance).
 *
 * GSC API 는 query 차원만 제공(page 차원 없음) → 랜딩 토큰 매칭으로 근사한다.
 */

export type GscQueryRow = { query: string; clicks: number; impressions: number };

export type LandingPerfInput = { term: string; label: string; tokens: string[] };

export type LandingPerfStatus = "active" | "low_ctr" | "cold";

export type LandingPerfRow = {
  term: string;
  label: string;
  impressions: number;
  clicks: number;
  ctr: number; // 백분율(소수 1자리)
  matchedQueries: number;
  status: LandingPerfStatus;
};

const COLD_IMPRESSION_THRESHOLD = 20; // 이 미만 노출이면 "노출 적음"으로 본다.

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

/** 검색어가 랜딩 토큰 중 하나라도 포함하면 매칭. 빈 토큰은 무시(과매칭 방지). */
function queryMatchesLanding(query: string, tokens: string[]): boolean {
  const nq = normalize(query);
  for (const token of tokens) {
    const nt = normalize(token);
    if (nt && nq.includes(nt)) return true;
  }
  return false;
}

export function aggregateLandingPerformance(
  landings: LandingPerfInput[],
  rows: GscQueryRow[]
): LandingPerfRow[] {
  const out = landings.map((l) => {
    let impressions = 0;
    let clicks = 0;
    let matchedQueries = 0;
    for (const r of rows) {
      if (queryMatchesLanding(r.query, l.tokens)) {
        impressions += r.impressions;
        clicks += r.clicks;
        matchedQueries += 1;
      }
    }
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0;
    let status: LandingPerfStatus;
    if (clicks > 0) status = "active";
    else if (impressions >= COLD_IMPRESSION_THRESHOLD) status = "low_ctr";
    else status = "cold";
    return { term: l.term, label: l.label, impressions, clicks, ctr, matchedQueries, status };
  });
  // 개선 필요(노출 있는데 클릭 0) 상위 노출 → 그 다음 활성 → 노출 적음.
  const rank: Record<LandingPerfStatus, number> = { low_ctr: 0, active: 1, cold: 2 };
  return out.sort((a, b) => rank[a.status] - rank[b.status] || b.impressions - a.impressions);
}

/**
 * 삭제 제안 대상: 생성 후 minAgeDays 이상 지났는데 여전히 노출 적음(cold)+클릭 0.
 * low_ctr(노출은 있는데 클릭 0)은 개선 대상이지 삭제 대상이 아니므로 제외.
 */
export function isLandingCleanupCandidate(
  status: LandingPerfStatus,
  clicks: number,
  createdAtMs: number,
  nowMs: number,
  minAgeDays = 30
): boolean {
  if (clicks > 0) return false;
  if (status !== "cold") return false;
  const ageDays = (nowMs - createdAtMs) / 86_400_000;
  return ageDays >= minAgeDays;
}

/**
 * 성과 목록에서 삭제 후보(DB 랜딩만) 추출. createdAtBySlug 에 든 slug(=DB 확장)만
 * 대상. 주간 크론 리포트용.
 */
export function pickLandingCleanupCandidates(
  perf: LandingPerfRow[],
  createdAtBySlug: Map<string, number>,
  nowMs: number
): Array<{ term: string; label: string }> {
  return perf
    .filter((p) => {
      const created = createdAtBySlug.get(p.term);
      return created !== undefined && isLandingCleanupCandidate(p.status, p.clicks, created, nowMs);
    })
    .map((p) => ({ term: p.term, label: p.label }));
}

export const LANDING_PERF_STATUS_LABEL: Record<LandingPerfStatus, string> = {
  active: "유입 있음",
  low_ctr: "개선 필요(노출↑ 클릭0)",
  cold: "노출 적음",
};
