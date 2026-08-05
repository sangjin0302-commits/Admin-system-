/**
 * 랜딩 성과 집계 계약 잠금.
 * 실행: npx tsx scripts/tests/landing-performance-check.ts
 */
import {
  aggregateLandingPerformance,
  isLandingCleanupCandidate,
  type GscQueryRow,
  type LandingPerfInput,
} from "../../src/lib/services/landing-performance";

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}

const landings: LandingPerfInput[] = [
  { term: "행정심판", label: "행정심판", tokens: ["행정심판", "이의신청"] },
  { term: "귀화", label: "귀화", tokens: ["귀화", "국적"] },
  { term: "법인설립", label: "법인 설립", tokens: ["법인설립"] },
];

const rows: GscQueryRow[] = [
  { query: "행정심판 청구기한", clicks: 5, impressions: 100 }, // 행정심판 active
  { query: "행정심판 절차", clicks: 2, impressions: 50 },
  { query: "귀화 요건", clicks: 0, impressions: 40 }, // 귀화 노출O 클릭0 → low_ctr
  // 법인설립: 매칭 행 없음 → cold
];

const perf = aggregateLandingPerformance(landings, rows);
const by = (t: string) => perf.find((p) => p.term === t)!;

check("행정심판 노출 합산(150)", by("행정심판").impressions === 150);
check("행정심판 클릭 합산(7)", by("행정심판").clicks === 7);
check("행정심판 매칭 쿼리 2", by("행정심판").matchedQueries === 2);
check("행정심판 active", by("행정심판").status === "active");
check("행정심판 CTR≈4.7", by("행정심판").ctr === 4.7);
check("귀화 low_ctr(노출40 클릭0)", by("귀화").status === "low_ctr");
check("법인설립 cold(매칭없음)", by("법인설립").status === "cold" && by("법인설립").impressions === 0);
// 정렬: low_ctr 먼저
check("정렬 low_ctr 최상단", perf[0].status === "low_ctr");

// 삭제 제안: cold + 클릭0 + 30일+ 경과
const NOW = 1_700_000_000_000;
const old = NOW - 40 * 86_400_000;
const fresh = NOW - 5 * 86_400_000;
check("cold+0클릭+40일 → 삭제 제안", isLandingCleanupCandidate("cold", 0, old, NOW) === true);
check("cold+0클릭+5일 → 아직 아님", isLandingCleanupCandidate("cold", 0, fresh, NOW) === false);
check("클릭 있으면 제외", isLandingCleanupCandidate("cold", 3, old, NOW) === false);
check("low_ctr 은 개선대상(제외)", isLandingCleanupCandidate("low_ctr", 0, old, NOW) === false);
check("active 제외", isLandingCleanupCandidate("active", 0, old, NOW) === false);

if (failed > 0) {
  console.error(`\n[landing-performance] FAILED ${failed}건`);
  process.exit(1);
}
console.log("\n[landing-performance] OK — 랜딩별 집계·상태분류·정렬 계약 유지.");
