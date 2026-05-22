import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/app/admin/document-lab/page.tsx"), "utf8");
const dashboardSource = readFileSync(join(process.cwd(), "src/app/admin/dashboard-content.tsx"), "utf8");

assert.match(source, /export default async function AdminDocumentLabPage/);
assert.match(source, /searchParams/);
assert.match(source, /read-only inventory/);
assert.match(source, /listDocumentTemplateInventory/);
assert.match(source, /normalizeDocumentTemplateInventoryFilters/);
assert.match(source, /filterDocumentTemplateInventory/);
assert.match(source, /groupDocumentTemplatesByCategory/);
assert.match(source, /buildDocumentTemplateFilterHref/);
assert.match(source, /buildDocumentTemplateSourceStatusFilterOptions/);
assert.match(source, /buildDocumentTemplateReadiness/);
assert.match(source, /buildDocumentTemplateReadinessSummary/);
assert.match(source, /buildDocumentTemplateSourceVerificationPriority/);
assert.match(source, /getDocumentTemplateOfficialSourceStatus/);
assert.match(source, /getDocumentTemplateOfficialSourceStatusLabel/);
assert.match(source, /getDocumentTemplateReadinessStatusLabel/);
assert.match(source, /Inventory filters/);
assert.match(source, /category/);
assert.match(source, /risk/);
assert.match(source, /conversionStatus/);
assert.match(source, /sourceStatus/);
assert.match(source, /sourceStatusFilterOptions/);
assert.match(source, /option\.count/);
assert.match(source, /bg-white\/20/);
assert.match(source, /filteredTemplates\.length/);
assert.match(source, /groupedTemplates/);
assert.match(source, /readinessSummary/);
assert.match(source, /readinessByTemplateId/);
assert.match(source, /Ready candidate/);
assert.match(source, /Source needed/);
assert.match(source, /Conversion test/);
assert.match(source, /Manual only/);
assert.match(source, /준비 상태/);
assert.match(source, /필수 준비/);
assert.match(source, /부족:/);
assert.match(source, /Official source verified/);
assert.match(source, /Source review/);
assert.match(source, /Source pending/);
assert.match(source, /Official source priority/);
assert.match(source, /공식 출처 검토 우선순위/);
assert.match(source, /sourcePrioritySummary/);
assert.match(source, /topPriorityTemplates/);
assert.match(source, /고위험 최신성 확인/);
assert.match(source, /고위험 출처 미확인/);
assert.match(source, /긴급 검토/);
assert.match(source, /고위험 미확인/);
assert.match(source, /우선 검토 대상/);
assert.match(source, /우선 검토 대상 서식이 없습니다/);
assert.match(source, /Risk별 출처 상태/);
assert.match(source, /risk: "high", sourceStatus: "needs_review"/);
assert.match(source, /risk: "high", sourceStatus: "pending"/);
assert.match(source, /출처 검증/);
assert.match(source, /공식 출처/);
assert.match(source, /최신 확인일/);
assert.match(source, /확인자/);
assert.match(source, /검토 메모/);
assert.match(source, /공식 출처 확인/);
assert.match(source, /공식 출처 미확인/);
assert.match(source, /최신성 확인 필요/);
assert.match(source, /수동 작성 유지/);
assert.match(source, /option\.labelKo/);
assert.match(source, /조건에 맞는 서식이 없습니다/);
assert.match(source, /admin review/);
assert.match(source, /문서 생성 없음/);
assert.match(source, /다운로드 없음/);
assert.match(source, /파일 업로드 없음/);
assert.match(source, /CaseMatter 연결 없음/);
assert.match(source, /고객 발송 없음/);
assert.match(source, /기관 제출 없음/);
assert.match(source, /AI 단독 법률판단 없음/);
assert.match(dashboardSource, /href="\/admin\/document-lab"/);

for (const forbidden of [
  'type="file"',
  "자동 제출",
  "자동 완성 완료",
  "즉시 제출 가능",
  "즉시 제출",
  "법률 판단 완료",
  "고객 발송 가능",
  "HWP 생성 가능",
  "DOCX export 가능",
  "PDF export 가능",
  "Generate",
  "Generate document",
  "Upload file",
  "Download file",
  "customer send",
  "agency submit",
  "생성 가능",
  "제출 가능",
  "drive.google.com",
  "docs.google.com",
  "C:\\",
  "/Users/",
  "/mnt/"
]) {
  assert.equal(source.includes(forbidden), false, `Forbidden wording found: ${forbidden}`);
}

console.log("document lab page source checks passed");
