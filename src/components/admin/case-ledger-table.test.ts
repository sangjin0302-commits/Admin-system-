import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const source = readFileSync(join(projectRoot, "src/components/admin/case-ledger-table.tsx"), "utf8");

assert.match(source, /accountingPreset/);
assert.match(source, /name="accountingPreset"/);
assert.match(source, /해당 조건의 사건이 없습니다/);
assert.match(source, /전체 quick filter/);

for (const forbidden of [
  "세금 신고 완료",
  "회계 확정",
  "자동 청구",
  "자동 결제",
  "자동 입금 확인",
  "payment provider",
  "invoice issuing"
]) {
  assert.equal(source.includes(forbidden), false, `Forbidden wording found: ${forbidden}`);
}

console.log("case ledger table accounting filter source checks passed");
