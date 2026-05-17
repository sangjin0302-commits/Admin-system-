import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const source = readFileSync(join(projectRoot, "src/components/admin/case-accounting-dashboard-card.tsx"), "utf8");

assert.match(source, /export function CaseAccountingDashboardCard/);
assert.match(source, /수임\/입금 확인/);
assert.match(source, /확인 필요/);
assert.match(source, /미입금/);
assert.match(source, /부분 입금/);
assert.match(source, /수임료 미확정/);
assert.match(source, /확인 필요 사유/);
assert.match(source, /followUpReasonBreakdown/);
assert.match(source, /item\.labelKo/);
assert.match(source, /item\.count/);
assert.match(source, /item\.href/);
assert.match(source, /href="\/admin\/ledger"/);
assert.match(source, /업무처리부에서 자세히 보기/);
assert.match(source, /내부 관리용 요약입니다/);
assert.match(source, /회계\/세무 확정 자료가 아닙니다/);
assert.match(source, /현재 표시할 확인 사유가 없습니다/);

for (const forbidden of [
  "회계 확정",
  "세금 신고 완료",
  "자동 청구",
  "자동 결제",
  "자동 입금 확인",
  "payment provider",
  "invoice issuing"
]) {
  assert.equal(source.includes(forbidden), false, `Forbidden wording found: ${forbidden}`);
}

console.log("case accounting dashboard card source checks passed");
