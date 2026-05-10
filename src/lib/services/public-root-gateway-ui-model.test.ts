import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const rootPageSource = readFileSync(join(root, "src/app/page.tsx"), "utf8");
const appShellSource = readFileSync(join(root, "src/components/layout/app-shell-safe.tsx"), "utf8");
const marketingSource = readFileSync(join(root, "src/lib/services/public-marketing-pages.ts"), "utf8");

assert.match(rootPageSource, /PublicMarketingHomePage/);
assert.match(rootPageSource, /접수하기/);
assert.match(rootPageSource, /진행상황 조회/);
assert.match(rootPageSource, /href="\/track"/);
assert.match(rootPageSource, /href="\/services"/);
assert.match(rootPageSource, /PUBLIC_MARKETING_SERVICES/);
assert.match(rootPageSource, /buildServiceIntakeHref/);
assert.match(marketingSource, /source: "website"/);
assert.equal(rootPageSource.includes("redirect(\"/admin\")"), false);
assert.equal(rootPageSource.includes("page-admin-redirect"), false);
assert.equal(rootPageSource.includes('href="/admin"'), false);
assert.equal(rootPageSource.includes("관리자"), false);
assert.equal(rootPageSource.includes("Administrative Office Intake System"), false);
assert.match(appShellSource, /pathname === "\/"/);

for (const forbidden of [
  "inquiryId",
  "caseId",
  "workflowStatus",
  "bridgeWorkflowStatus",
  "Lawbot",
  "adminNote",
  "communicationLogs",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "EMAIL_ALLOWED_FROM_DOMAIN",
  "100% 허가",
  "확실한 해결",
  "즉시 수임",
  "결과 보장"
]) {
  assert.equal(rootPageSource.includes(forbidden), false, `Forbidden root token: ${forbidden}`);
}

console.log("public root gateway UI tests passed");
