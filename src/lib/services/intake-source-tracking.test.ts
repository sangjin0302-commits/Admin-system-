import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildIntakeSourceTrackingFromSearchParams,
  buildIntakeSourceTrackingViewModel,
  normalizeIntakeSourceTrackingPayload,
  sanitizeIntakeTrackingText
} from "@/lib/services/intake-source-tracking";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry-safe";

const root = process.cwd();

const captured = new Date("2026-05-08T00:00:00.000Z");
const tracking = buildIntakeSourceTrackingFromSearchParams(
  {
    source: " autosns ",
    channel: "naver",
    practice_area: "middle_east_admin_business",
    content_id: "mic_46900181d72c",
    package_id: "mdri_7cc2f3c6648f_claude_v1",
    campaign_id: "<b>campaign</b>",
    utm_source: "newsletter\r\nignored",
    utm_medium: "blog",
    utm_campaign: "spring",
    utm_content: "cta",
    ref: "naver-post"
  },
  captured
);

assert.equal(tracking.source, "autosns");
assert.equal(tracking.channel, "naver");
assert.equal(tracking.practice_area, "middle_east_admin_business");
assert.equal(tracking.content_id, "mic_46900181d72c");
assert.equal(tracking.package_id, "mdri_7cc2f3c6648f_claude_v1");
assert.equal(tracking.utm_source, "newsletterignored");
assert.equal(tracking.captured_at, captured.toISOString());
assert.match(tracking.landing_url ?? "", /^\/intake\?/);
assert.equal((tracking.landing_url ?? "").includes("auth"), false);
assert.equal(buildIntakeSourceTrackingFromSearchParams({}).landing_url, undefined);

const longValue = "x".repeat(300);
assert.equal(sanitizeIntakeTrackingText(longValue)?.length, 160);
assert.equal(sanitizeIntakeTrackingText(" <img src=x onerror=alert(1)>\r\n "), "<img src=x onerror=alert(1)>");

const normalized = normalizeIntakeSourceTrackingPayload({
  ...tracking,
  landing_url: "https://adminofficemvp2.vercel.app/intake?source=autosns"
});
assert.equal(normalized.intakeSource, "autosns");
assert.equal(normalized.intakeChannel, "naver");
assert.equal(normalized.intakePracticeArea, "middle_east_admin_business");
assert.equal(normalized.intakeContentId, "mic_46900181d72c");
assert.equal(normalized.intakePackageId, "mdri_7cc2f3c6648f_claude_v1");
assert.equal(normalized.intakeTrackingCapturedAt?.toISOString(), captured.toISOString());

const parsedWithoutTracking = parseCreateInquiryInput({
  preferredLocale: "ko",
  clientType: "INDIVIDUAL",
  contactName: "Test Client",
  email: "client@example.com",
  phone: "010-0000-0000",
  title: "Public intake request",
  description: "This client needs help with an administrative matter and wants consultation.",
  requestedOutcome: "Review available options",
  declaredUrgency: "HIGH",
  category: "visa",
  categoryDetails: { workType: "Change" },
  consentToPrivacy: true,
  website: ""
});
assert.deepEqual(parsedWithoutTracking.intakeTracking, {});

const parsedWithTracking = parseCreateInquiryInput({
  preferredLocale: "ko",
  clientType: "INDIVIDUAL",
  contactName: "Test Client",
  email: "client@example.com",
  phone: "010-0000-0000",
  title: "Public intake request",
  description: "This client needs help with an administrative matter and wants consultation.",
  requestedOutcome: "Review available options",
  declaredUrgency: "HIGH",
  category: "visa",
  categoryDetails: { workType: "Change" },
  intakeTracking: tracking,
  consentToPrivacy: true,
  website: ""
});
assert.equal(parsedWithTracking.intakeTracking.intakeSource, "autosns");
assert.equal(parsedWithTracking.intakeTracking.intakeChannel, "naver");
assert.equal(parsedWithTracking.intakeTracking.intakeLandingUrl?.includes("source=autosns"), true);

const emptyViewModel = buildIntakeSourceTrackingViewModel({
  intakeSource: "website"
});
assert.equal(emptyViewModel.hasTracking, false);
assert.deepEqual(emptyViewModel.rows, []);

const viewModel = buildIntakeSourceTrackingViewModel({
  intakeSource: "autosns",
  intakeChannel: "naver",
  intakePracticeArea: "middle_east_admin_business",
  intakeContentId: "mic_46900181d72c",
  intakePackageId: "mdri_7cc2f3c6648f_claude_v1",
  intakeCampaignId: "<script>alert(1)</script>",
  intakeLandingUrl: "https://adminofficemvp2.vercel.app/intake?source=autosns",
  intakeTrackingCapturedAt: captured
});
assert.equal(viewModel.hasTracking, true);
assert.equal(viewModel.rows.some((row) => row.label === "Source" && row.value === "autosns"), true);
assert.equal(viewModel.rows.some((row) => row.label === "Landing URL" && row.isUrl), true);
assert.equal(JSON.stringify(viewModel).includes("dangerouslySetInnerHTML"), false);

const intakePageSource = readFileSync(join(root, "src/app/intake/page-safe.tsx"), "utf8");
const intakeFormSource = readFileSync(join(root, "src/components/intake/intake-form-safe-v3.tsx"), "utf8");
const validationSource = readFileSync(join(root, "src/lib/validation/inquiry-safe.ts"), "utf8");
const createDataSource = readFileSync(join(root, "src/lib/services/inquiry-create-data-helpers.ts"), "utf8");
const adminDetailSource = readFileSync(join(root, "src/components/admin/inquiry-detail-content-sections.tsx"), "utf8");
const adminPageSource = readFileSync(join(root, "src/app/admin/inquiries/[id]/page.tsx"), "utf8");
const routeSource = readFileSync(join(root, "src/app/api/inquiries/route-safe-v3.ts"), "utf8");

assert.match(intakePageSource, /buildIntakeSourceTrackingFromSearchParams/);
assert.match(intakeFormSource, /initialTracking/);
assert.match(intakeFormSource, /intakeTracking/);
assert.match(validationSource, /normalizeIntakeSourceTrackingPayload/);
assert.match(createDataSource, /\.\.\.input\.intakeTracking/);
assert.match(adminDetailSource, /접수 유입 정보/);
assert.match(adminDetailSource, /유입 추적 정보가 없습니다/);
assert.match(adminDetailSource, /rel="noreferrer noopener"/);
assert.match(adminPageSource, /buildIntakeSourceTrackingViewModel/);

for (const forbidden of [
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
  "RESEND_API_KEY",
  "Authorization"
]) {
  assert.equal(JSON.stringify(viewModel).includes(forbidden), false);
  assert.equal(routeSource.includes(`"${forbidden}"`), false);
}

assert.equal(intakeFormSource.includes("dangerouslySetInnerHTML"), false);
assert.equal(adminDetailSource.includes("dangerouslySetInnerHTML"), false);
assert.equal(intakeFormSource.includes("client-message-service"), false);
assert.equal(intakeFormSource.includes("run-lawbot-workflow"), false);

console.log("intake source tracking tests passed");
