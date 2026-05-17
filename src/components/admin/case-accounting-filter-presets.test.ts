import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const source = readFileSync(join(projectRoot, "src/components/admin/case-accounting-filter-presets.tsx"), "utf8");

assert.match(source, /export function CaseAccountingFilterPresets/);
assert.match(source, /Accounting filters/);
assert.match(source, /수임\/입금 quick filter/);
assert.match(source, /aria-current/);
assert.match(source, /item\.count/);
assert.match(source, /activePreset/);
assert.match(source, /CSV export 정책은 기존과 동일합니다/);
assert.match(source, /내부 관리용 필터입니다/);
assert.match(source, /회계\/세무 확정 자료가 아닙니다/);

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

console.log("case accounting filter presets source checks passed");
