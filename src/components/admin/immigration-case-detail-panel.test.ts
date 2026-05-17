import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const panelSource = readFileSync(
  join(projectRoot, "src/components/admin/immigration-case-detail-panel.tsx"),
  "utf8"
);
const caseDetailPageSource = readFileSync(
  join(projectRoot, "src/app/admin/cases/[id]/page.tsx"),
  "utf8"
);
const serviceSource = readFileSync(
  join(projectRoot, "src/lib/services/case-matter-service.ts"),
  "utf8"
);

function assertDoesNotContain(source: string, forbidden: string[]) {
  for (const value of forbidden) {
    assert.equal(source.includes(value), false, `Unexpected copy or field found: ${value}`);
  }
}

assert.match(panelSource, /export function ImmigrationCaseDetailPanel/);
assert.match(panelSource, /출입국 세부정보/);
assert.match(panelSource, /아직 저장된 출입국 세부정보가 없습니다/);
assert.match(panelSource, /여권번호, 외국인등록번호, 상세 주소 등 고유식별정보는 이 화면에 저장하지 않습니다/);
assert.match(panelSource, /처분서 원문, 송달일, 관할기관 기준으로 기한을 수동 확인하세요/);
assert.match(panelSource, /고객 발송 또는 기관 제출 자동화가 아닙니다/);
assert.match(panelSource, /CaseMatter dueDate/);
assert.match(panelSource, /체크한 경우에만 CaseMatter dueDate에 반영합니다/);
assert.match(panelSource, /syncCaseMatterDueDate: false/);
assert.match(panelSource, /syncCaseMatterDueDate: draft\.syncCaseMatterDueDate/);
assert.match(panelSource, /setField\(\{ syncCaseMatterDueDate: event\.target\.checked \}\)/);
assert.match(panelSource, /불복기한, 출국기한, 보완기한, 체류기간 만료일, 제출기한 순서/);
assert.match(panelSource, /처분서 원문과 송달일을 확인한 뒤 사용하세요/);
assert.match(panelSource, /\/api\/admin\/case-matters\/\$\{caseMatterId\}\/immigration-detail/);
assert.match(panelSource, /method: "PATCH"/);
assert.match(panelSource, /expectedUpdatedAt: immigrationDetail\?\.updatedAt/);
assert.match(panelSource, /expectedCaseUpdatedAt: immigrationDetail \? undefined : caseMatterUpdatedAt/);
assert.match(panelSource, /parseClientApiError/);
assert.match(panelSource, /response\.status === 409/);
assert.match(panelSource, /router\.refresh\(\)/);
assert.match(panelSource, /result\?\.ok/);
assert.match(panelSource, /scopeReviewRequired: detail\?\.scopeReviewRequired \?\? true/);
assert.match(panelSource, /attorneyScopeRisk: detail\?\.attorneyScopeRisk \?\? false/);
assert.match(panelSource, /officialFormCheckRequired: detail\?\.officialFormCheckRequired \?\? true/);

assertDoesNotContain(panelSource, [
  "passportNumber",
  "alienRegistrationNumber",
  "fullAddress",
  "결과 보장",
  "100% 허가",
  "즉시 해결",
  "AI가 판단",
  "자동 sync",
  "자동 반영"
]);

assert.match(caseDetailPageSource, /ImmigrationCaseDetailPanel/);
assert.match(caseDetailPageSource, /immigrationDetail=\{immigrationDetail\}/);
assert.match(caseDetailPageSource, /caseMatter\.immigrationDetail/);
assert.match(serviceSource, /immigrationDetail: \{/);
assert.match(serviceSource, /deadlineVerifiedAt: true/);

console.log("immigration-case-detail-panel source checks passed");
