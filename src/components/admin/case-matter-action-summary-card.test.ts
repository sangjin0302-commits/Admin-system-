import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const componentSource = readFileSync(
  join(root, "src/components/admin/case-matter-action-summary-card.tsx"),
  "utf8"
);
const dashboardSource = readFileSync(join(root, "src/app/admin/dashboard-content.tsx"), "utf8");

assert.match(componentSource, /오늘 할 일/);
assert.match(componentSource, /오늘 처리할 사건/);
assert.match(componentSource, /기한 임박/);
assert.match(componentSource, /미제출\/보완 필요/);
assert.match(componentSource, /장기 대기\/정체/);
assert.match(componentSource, /오늘 긴급하게 처리할 사건이 없습니다\./);
assert.match(componentSource, /기한 임박 또는 미제출 자료 이슈가 없습니다\./);
assert.match(componentSource, /href="\/admin\/cases"/);
assert.doesNotMatch(componentSource, /communicationLogs|internalMemo|payloadJson|ADMIN_BASIC_AUTH_PASSWORD|RESEND_API_KEY|EMAIL_FROM/);

assert.match(dashboardSource, /CaseMatterActionSummaryCard/);
assert.match(dashboardSource, /buildCaseMatterActionSummary/);
assert.match(dashboardSource, /buildCaseMatterActionDashboard/);
assert.match(dashboardSource, /safeListCaseMatters/);
assert.doesNotMatch(dashboardSource, /method:\s*"POST"|fetch\(/);

console.log("case matter action summary card tests passed");
