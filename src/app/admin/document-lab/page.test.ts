import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/app/admin/document-lab/page.tsx"), "utf8");
const dashboardSource = readFileSync(join(process.cwd(), "src/app/admin/dashboard-content.tsx"), "utf8");

assert.match(source, /export default function AdminDocumentLabPage/);
assert.match(source, /문서 실험실/);
assert.match(source, /관리자 전용 실험 공간/);
assert.match(source, /read-only inventory/);
assert.match(source, /문서 생성 없음/);
assert.match(source, /다운로드 없음/);
assert.match(source, /파일 업로드 없음/);
assert.match(source, /CaseMatter 연결 없음/);
assert.match(source, /고객 발송 없음/);
assert.match(source, /기관 제출 없음/);
assert.match(source, /AI 단독 법률판단 없음/);
assert.match(source, /공식 서식 최신성 확인 필요/);
assert.match(source, /Template inventory/);
assert.match(source, /listDocumentTemplateInventory/);
assert.match(source, /admin review 필요/);
assert.match(dashboardSource, /href="\/admin\/document-lab"/);
assert.match(dashboardSource, /문서 실험실/);

for (const forbidden of [
  "자동 제출",
  "자동 완성 완료",
  "즉시 제출 가능",
  "즉시 제출",
  "법률 판단 완료",
  "고객 발송 가능",
  "HWP 생성 가능",
  "DOCX export 가능",
  "PDF export 가능"
]) {
  assert.equal(source.includes(forbidden), false, `Forbidden wording found: ${forbidden}`);
}

console.log("document lab page source checks passed");
