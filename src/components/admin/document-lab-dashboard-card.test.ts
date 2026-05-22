import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { documentTemplateInventory, buildDocumentTemplateSourceVerificationPriority } from "@/lib/document-templates";
import { buildDocumentLabDashboardPriorityCardViewModel } from "./document-lab-dashboard-card";

const projectRoot = process.cwd();
const source = readFileSync(join(projectRoot, "src/components/admin/document-lab-dashboard-card.tsx"), "utf8");
const dashboardSource = readFileSync(join(projectRoot, "src/app/admin/dashboard-content.tsx"), "utf8");

const summary = buildDocumentTemplateSourceVerificationPriority(documentTemplateInventory);
const viewModel = buildDocumentLabDashboardPriorityCardViewModel(summary);

assert.equal(viewModel.urgentCount, summary.urgentCount);
assert.equal(viewModel.highRiskNeedsReviewCount, summary.highRiskNeedsReviewCount);
assert.equal(viewModel.needsReviewCount, summary.needsReviewCount);
assert.equal(viewModel.pendingCount, summary.pendingCount);
assert.equal(viewModel.manualOnlyCount, summary.manualOnlyCount);
assert.equal(viewModel.primaryHref, "/admin/document-lab?risk=high&sourceStatus=needs_review");
assert.ok(viewModel.topLabels.length > 0);

assert.match(source, /export function DocumentLabDashboardCard/);
assert.match(source, /buildDocumentLabDashboardPriorityCardViewModel/);
assert.match(source, /문서 서식 검토/);
assert.match(source, /긴급 검토/);
assert.match(source, /고위험 미확인/);
assert.match(source, /최신성 확인 필요/);
assert.match(source, /수동 작성 유지/);
assert.match(source, /긴급 검토 대상 없음/);
assert.match(source, /문서 실험실에서 보기/);
assert.match(source, /\/admin\/document-lab\?risk=high&sourceStatus=needs_review/);
assert.match(dashboardSource, /DocumentLabDashboardCard/);
assert.match(dashboardSource, /buildDocumentTemplateSourceVerificationPriority/);
assert.match(dashboardSource, /listDocumentTemplateInventory/);

for (const forbidden of [
  'type="file"',
  "문서 생성 가능",
  "자동 제출",
  "다운로드 가능",
  "HWP 생성",
  "고객 발송 가능",
  "법률 판단 완료",
  "Generate document",
  "Upload file",
  "Download file",
  "customer send",
  "agency submit"
]) {
  assert.equal(source.includes(forbidden), false, `Forbidden wording found: ${forbidden}`);
}

console.log("document lab dashboard card source checks passed");
