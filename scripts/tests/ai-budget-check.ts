/**
 * AI 예산 가드 순수 판정 계약 잠금.
 * 실행: npx tsx scripts/tests/ai-budget-check.ts
 */
import { decideAiAllowed, currentMonth } from "../../src/lib/services/ai-budget-guard";

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}

// 킬스위치 최우선
check("killed → 거부", decideAiAllowed(true, 10, 0).ok === false);
check("killed reason", decideAiAllowed(true, 10, 0).reason === "ai_master_kill");

// 예산 이하 → 허용
check("예산 이하 허용", decideAiAllowed(false, 10, 4.99).ok === true);

// 예산 도달/초과 → 거부
check("예산 도달 거부", decideAiAllowed(false, 10, 10).ok === false);
check("예산 초과 거부", decideAiAllowed(false, 10, 12.5).ok === false);
check("초과 reason 포함", decideAiAllowed(false, 10, 12.5).reason?.startsWith("monthly_budget_exceeded") === true);

// 예산 0 → 항상 거부(전면 차단 스위치로 사용 가능)
check("예산 0 → 거부", decideAiAllowed(false, 0, 0).ok === false);

// currentMonth 결정적(UTC)
check("currentMonth 형식", /^\d{4}-\d{2}$/.test(currentMonth(1_700_000_000_000)));
check("currentMonth 2023-11", currentMonth(Date.UTC(2023, 10, 15)) === "2023-11");
check("currentMonth 1월 패딩", currentMonth(Date.UTC(2026, 0, 1)) === "2026-01");

if (failed > 0) {
  console.error(`\n[ai-budget] FAILED ${failed}건`);
  process.exit(1);
}
console.log("\n[ai-budget] OK — 킬스위치·월예산 판정·월키 계약 유지.");
