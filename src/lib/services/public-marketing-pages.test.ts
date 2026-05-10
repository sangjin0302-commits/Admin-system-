import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildServiceIntakeHref,
  getPublicMarketingService,
  PUBLIC_MARKETING_SAFE_NOTICE,
  PUBLIC_MARKETING_SERVICES
} from "@/lib/services/public-marketing-pages";

const root = process.cwd();

assert.equal(PUBLIC_MARKETING_SERVICES.length, 7);
assert.equal(PUBLIC_MARKETING_SAFE_NOTICE.includes("일반 정보 제공"), true);
assert.equal(PUBLIC_MARKETING_SAFE_NOTICE.includes("공식 기관 확인"), true);

const expected = new Map([
  ["visa", "visa"],
  ["corporation", "corporation"],
  ["administrative-appeal", "administrative_appeal"],
  ["fact-contract", "fact_contract"],
  ["permit-license", "permit_license"],
  ["arabic-interpretation", "arabic_interpretation"],
  ["civil-petition", "civil_petition"]
]);

for (const [slug, practiceArea] of expected) {
  const service = getPublicMarketingService(slug);
  assert.ok(service, `Missing service: ${slug}`);
  assert.equal(service.practiceArea, practiceArea);
  assert.equal(service.audience.length > 0, true);
  assert.equal(service.scope.length > 0, true);
  assert.equal(service.preparation.length > 0, true);
  assert.equal(service.process.length > 0, true);
  assert.equal(service.cautions.length > 0, true);

  const href = buildServiceIntakeHref(service);
  assert.equal(href.includes("/intake?"), true);
  assert.equal(href.includes("source=website"), true);
  assert.equal(href.includes("channel=service_page"), true);
  assert.equal(href.includes(`practice_area=${practiceArea}`), true);
}

assert.equal(getPublicMarketingService("missing"), null);

const rootPagePath = join(root, "src/app/page.tsx");
const servicesPagePath = join(root, "src/app/services/page.tsx");
const serviceDetailPagePath = join(root, "src/app/services/[slug]/page.tsx");
const appShellPath = join(root, "src/components/layout/app-shell-safe.tsx");

for (const path of [rootPagePath, servicesPagePath, serviceDetailPagePath, appShellPath]) {
  assert.equal(existsSync(path), true, `Missing source: ${path}`);
}

const combinedSource = [
  readFileSync(rootPagePath, "utf8"),
  readFileSync(servicesPagePath, "utf8"),
  readFileSync(serviceDetailPagePath, "utf8"),
  readFileSync(join(root, "src/lib/services/public-marketing-pages.ts"), "utf8")
].join("\n");

for (const label of ["비자", "법인", "행정심판", "사실조사", "인허가", "아랍어 통번역", "기타 민원"]) {
  assert.equal(combinedSource.includes(label), true, `Missing label: ${label}`);
}

for (const forbidden of [
  "100% 허가",
  "확실한 해결",
  "즉시 수임",
  "결과 보장",
  "href=\"/admin\"",
  "Administrative Office Intake System",
  "inquiryId",
  "caseId",
  "workflowStatus",
  "bridgeWorkflowStatus",
  "Lawbot",
  "approvalGate",
  "documentDrafts",
  "messageDrafts",
  "communicationLogs",
  "adminNote",
  "client-message-service",
  "run-lawbot-workflow",
  "resend.emails.send",
  "new Resend",
  "dangerouslySetInnerHTML"
]) {
  assert.equal(combinedSource.includes(forbidden), false, `Forbidden token: ${forbidden}`);
}

const appShellSource = readFileSync(appShellPath, "utf8");
assert.match(appShellSource, /pathname === "\/services"/);
assert.match(appShellSource, /pathname\.startsWith\("\/services\/"\)/);

console.log("public marketing pages tests passed");
