/**
 * 주간 관보 요약 선택·포맷 계약 잠금.
 * 실행: npx tsx scripts/tests/gazette-digest-check.ts
 */
import {
  selectRecentGazette,
  buildGazetteDigestLines,
  buildGazetteStats,
} from "../../src/lib/services/gazette-digest-format";
import type { GazetteItem } from "../../src/lib/services/gazette-client";

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}

function item(p: Partial<GazetteItem>): GazetteItem {
  return { id: "x", title: "t", agency: "", category: "", dateMs: 0, url: null, summary: "", legalBasis: "", ...p };
}

const NOW = 1_700_000_000_000;
const WEEK = 7 * 24 * 60 * 60 * 1000;
const weekAgo = NOW - WEEK;

// window 내 항목만 선택
const mixed = [
  item({ id: "a", dateMs: NOW - 1 * 24 * 60 * 60 * 1000 }), // 1일 전 → 포함
  item({ id: "b", dateMs: NOW - 10 * 24 * 60 * 60 * 1000 }), // 10일 전 → 제외
];
const sel1 = selectRecentGazette(mixed, weekAgo);
check("window 내만 선택", sel1.length === 1 && sel1[0].id === "a");

// 날짜 있으나 window 내 없음 → [](이번 주 없음)
const old = [item({ id: "c", dateMs: NOW - 30 * 24 * 60 * 60 * 1000 })];
check("최근 없음 → 빈 배열", selectRecentGazette(old, weekAgo).length === 0);

// 날짜 전부 0 → 최신 fallback
const undated = [item({ id: "d" }), item({ id: "e" }), item({ id: "f" })];
check("날짜없음 → fallback 최신 2건", selectRecentGazette(undated, weekAgo, 2).length === 2);

// 통계: 총건수·기관별·기간
const statsItems = [
  item({ title: "A", agency: "법무부", dateMs: NOW - 1 * 24 * 60 * 60 * 1000 }),
  item({ title: "B", agency: "법무부", dateMs: NOW - 2 * 24 * 60 * 60 * 1000 }),
  item({ title: "C", agency: "행정안전부", dateMs: NOW - 3 * 24 * 60 * 60 * 1000 }),
];
const stats = buildGazetteStats(statsItems);
check("통계 총건수", stats.total === 3);
check("통계 기관별 최다", stats.byAgency[0].agency === "법무부" && stats.byAgency[0].count === 2);
check("통계 기간 존재", stats.dateRange !== null && stats.dateRange!.toMs > stats.dateRange!.fromMs);
check("통계 agency 없으면 기타", buildGazetteStats([item({ title: "x" })]).byAgency[0].agency === "기타");

// 포맷: 첫 줄 건수 + 기관 통계 라인 + 항목 기관 접두(카테고리 아님)
const lines = buildGazetteDigestLines(
  [item({ title: "출입국관리법 개정", agency: "법무부" }), item({ title: "고시 A", agency: "" })],
  8
);
check("첫 줄 건수", lines[0] === "🗞 지난 7일 관보 2건");
check("기관별 통계 라인", lines[1].startsWith("기관별:"));
check("기관 접두 포함", lines[2] === "• [법무부] 출입국관리법 개정");
check("기관 없으면 접두 없음", lines[3] === "• 고시 A");

// maxItems 제한: 건수(1) + 기관통계(1) + 항목 8 = 10
const many = Array.from({ length: 20 }, (_, i) => item({ title: `t${i}`, agency: "법무부" }));
check("maxItems 제한(1+1+8)", buildGazetteDigestLines(many, 8).length === 10);

if (failed > 0) {
  console.error(`\n[gazette-digest] FAILED ${failed}건`);
  process.exit(1);
}
console.log("\n[gazette-digest] OK — 주간 선택(window·폴백)·요약 라인 계약 유지.");
