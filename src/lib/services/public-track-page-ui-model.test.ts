import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildPublicTrackViewModel,
  formatPublicTrackDateTime,
  isPublicTrackLookupReady,
  normalizePublicTrackCodeInput,
  normalizePublicTrackPhoneLast4Input,
  PUBLIC_TRACK_API_PATH,
  PUBLIC_TRACK_FORBIDDEN_RENDER_TOKENS,
  PUBLIC_TRACK_GENERIC_NOT_FOUND_MESSAGE
} from "@/lib/services/public-track-page-ui-model";

const root = process.cwd();

assert.equal(PUBLIC_TRACK_API_PATH, "/api/public/track");
assert.equal(
  PUBLIC_TRACK_GENERIC_NOT_FOUND_MESSAGE,
  "접수 정보를 찾을 수 없습니다. 접수번호와 휴대폰 뒤 4자리를 확인해 주세요."
);

assert.equal(normalizePublicTrackCodeInput(" 20260504-fc-0002-7d "), "20260504-FC-0002-7D");
assert.equal(normalizePublicTrackPhoneLast4Input("010-9999-1234"), "1234");
assert.equal(normalizePublicTrackPhoneLast4Input("12a3b4"), "1234");
assert.equal(isPublicTrackLookupReady({ trackingCode: "20260504-FC-0002-7D", phoneLast4: "1234" }), true);
assert.equal(isPublicTrackLookupReady({ trackingCode: "", phoneLast4: "1234" }), false);
assert.equal(isPublicTrackLookupReady({ trackingCode: "20260504-FC-0002-7D", phoneLast4: "123" }), false);

const safeViewModel = buildPublicTrackViewModel({
  trackingCode: "20260504-FC-0002-7D",
  categoryLabel: "사실조사 및 계약서 작성",
  categoryDetailLabel: null,
  receivedAt: "2026-05-04T13:53:51.051Z",
  lastUpdatedAt: "2026-05-04T13:53:51.671Z",
  customerStatus: "UNDER_REVIEW",
  customerStatusLabel: "담당자 확인 중",
  message: "담당자가 접수 내용을 확인하고 있습니다.",
  documentsRequested: false,
  nextStepLabel: "확인 후 상담 또는 추가 안내를 드릴 예정입니다.",
  inquiryId: "internal-inquiry-id",
  caseId: "internal-case-id",
  workflowStatus: "APPROVED",
  bridgeWorkflowStatus: "APPROVED",
  Lawbot: "hidden",
  approvalGate: { externalActionAllowed: true },
  documentDrafts: [{ body: "hidden" }],
  messageDrafts: [{ body: "hidden" }],
  communicationLogs: [{ summary: "hidden" }],
  adminNote: "hidden"
});

assert.ok(safeViewModel);
assert.equal(safeViewModel.trackingCode, "20260504-FC-0002-7D");
assert.equal(safeViewModel.categoryLabel, "사실조사 및 계약서 작성");
assert.equal(safeViewModel.categoryDetailLabel, null);
assert.equal(safeViewModel.customerStatusLabel, "담당자 확인 중");
assert.equal(safeViewModel.documentsRequested, false);
assert.equal(formatPublicTrackDateTime("not-a-date"), "");

const renderedSafeOutput = JSON.stringify(safeViewModel);
for (const forbidden of PUBLIC_TRACK_FORBIDDEN_RENDER_TOKENS) {
  assert.equal(renderedSafeOutput.includes(forbidden), false);
}
for (const forbidden of [
  "internal-inquiry-id",
  "internal-case-id",
  "APPROVED",
  "externalActionAllowed",
  "hidden"
]) {
  assert.equal(renderedSafeOutput.includes(forbidden), false);
}

assert.equal(
  buildPublicTrackViewModel({
    trackingCode: "20260504-FC-0002-7D",
    categoryLabel: "사실조사 및 계약서 작성",
    receivedAt: "2026-05-04T13:53:51.051Z",
    lastUpdatedAt: "2026-05-04T13:53:51.671Z",
    customerStatusLabel: "APPROVED",
    message: "internal",
    nextStepLabel: "internal"
  }),
  null
);

const trackPagePath = join(root, "src/app/track/page.tsx");
const trackClientPath = join(root, "src/components/public-track/public-track-client.tsx");
const appShellPath = join(root, "src/components/layout/app-shell-safe.tsx");
assert.equal(existsSync(trackPagePath), true);
assert.equal(existsSync(trackClientPath), true);
assert.equal(existsSync(appShellPath), true);

const trackPageSource = readFileSync(trackPagePath, "utf8");
const trackClientSource = readFileSync(trackClientPath, "utf8");
const appShellSource = readFileSync(appShellPath, "utf8");
assert.match(trackPageSource, /PublicTrackClient/);
assert.match(trackClientSource, /PUBLIC_TRACK_API_PATH/);
assert.match(trackClientSource, /접수 조회/);
assert.equal(trackPageSource.includes("Administrative Office Intake System"), false);
assert.equal(trackClientSource.includes("Administrative Office Intake System"), false);
assert.equal(trackPageSource.includes("행정사 문의 접수 및 업무 관리시스템"), false);
assert.equal(trackClientSource.includes("행정사 문의 접수 및 업무 관리시스템"), false);
assert.equal(trackPageSource.includes('href="/admin"'), false);
assert.equal(trackClientSource.includes('href="/admin"'), false);
assert.equal(trackPageSource.includes("/api/admin"), false);
assert.equal(trackClientSource.includes("/api/admin"), false);
assert.equal(trackClientSource.includes("/api/inquiries"), false);
assert.equal(trackClientSource.includes("run-lawbot-workflow"), false);
assert.equal(trackClientSource.includes("client-message-service"), false);
assert.equal(trackClientSource.includes("externalActionAllowed"), false);
assert.equal(trackClientSource.includes("documentDrafts"), false);
assert.equal(trackClientSource.includes("messageDrafts"), false);
assert.match(appShellSource, /isHeaderlessPublicRoute/);
assert.match(appShellSource, /pathname === "\/track"/);
assert.match(appShellSource, /pathname\.startsWith\("\/track\/"\)/);

const intakeSource = readFileSync(join(root, "src/components/intake/intake-form-safe-v3.tsx"), "utf8");
assert.match(intakeSource, /href="\/track"/);
assert.match(intakeSource, /trackingCode/);

const middlewareSource = readFileSync(join(root, "middleware.ts"), "utf8");
assert.equal(middlewareSource.includes('pathname.startsWith("/track")'), false);

console.log("public track page ui model tests passed");
