import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const source = readFileSync(join(projectRoot, "src/components/admin/case-accounting-summary-cards.tsx"), "utf8");

assert.match(source, /export function CaseAccountingSummaryCards/);
assert.match(source, /전체 사건/);
assert.match(source, /수임료 확정/);
assert.match(source, /수임료 미확정/);
assert.match(source, /미입금 사건/);
assert.match(source, /부분 입금 사건/);
assert.match(source, /입금 완료/);
assert.match(source, /후속 확인 필요/);
assert.match(source, /수임\/입금 확인/);
assert.match(source, /내부 관리용/);
assert.match(source, /회계\/세무 확정 자료가 아닙니다/);
assert.match(source, /금액 합산은 이번 요약에서 제외합니다/);
assert.match(source, /사건 확인/);

for (const forbidden of [
  "세금 신고 완료",
  "회계 확정",
  "자동 청구",
  "자동 결제",
  "자동 입금 확인",
  "법적/세무 확정 판단",
  "provider",
  "payment provider",
  "invoice issuing"
]) {
  assert.equal(source.includes(forbidden), false, `Forbidden wording found: ${forbidden}`);
}

console.log("case accounting summary cards source checks passed");
