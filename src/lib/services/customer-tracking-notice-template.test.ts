import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildCustomerTrackingNoticeTemplate,
  CUSTOMER_TRACKING_NOTICE_EMPTY_MESSAGE,
  CUSTOMER_TRACKING_NOTICE_TRACK_URL,
  normalizeCustomerTrackingCode
} from "@/lib/services/customer-tracking-notice-template";

const trackingCode = "20260504-FC-0002-7D";
const notice = buildCustomerTrackingNoticeTemplate({
  trackingCode: " 20260504-fc-0002-7d "
});

assert.equal(normalizeCustomerTrackingCode(" 20260504-fc-0002-7d "), trackingCode);
assert.equal(normalizeCustomerTrackingCode("   "), null);
assert.equal(CUSTOMER_TRACKING_NOTICE_EMPTY_MESSAGE.includes("고객용 접수번호"), true);
assert.ok(notice);
assert.equal(notice?.includes(trackingCode), true);
assert.equal(notice?.includes(CUSTOMER_TRACKING_NOTICE_TRACK_URL), true);
assert.equal(notice?.includes("휴대폰 번호 뒤 4자리"), true);
assert.equal(notice?.includes("홈 화면에 추가"), true);
assert.equal(notice?.includes("담당자가 확인 후 연락드리겠습니다."), true);

const forbiddenTokens = [
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
  "DB id",
  "vercel.app/admin",
  "href=\"/admin\"",
  "client-message-service",
  "alimtalk",
  "send adapter"
];

for (const forbidden of forbiddenTokens) {
  assert.equal(notice?.includes(forbidden), false);
}

assert.equal(buildCustomerTrackingNoticeTemplate({ trackingCode: null }), null);
assert.equal(
  buildCustomerTrackingNoticeTemplate({
    trackingCode,
    trackUrl: "https://example.test/track"
  })?.includes("https://example.test/track"),
  true
);

const componentSource = readFileSync(
  join(process.cwd(), "src/components/admin/customer-tracking-notice-copy-card.tsx"),
  "utf8"
);

assert.match(componentSource, /buildCustomerTrackingNoticeTemplate/);
assert.match(componentSource, /navigator\.clipboard\.writeText/);
assert.match(componentSource, /고객 안내문 복사/);
assert.match(componentSource, /안내문을 복사했습니다/);
assert.match(componentSource, /안내문을 직접 선택해 복사해 주세요/);
assert.equal(componentSource.includes("fetch("), false);
assert.equal(componentSource.includes("/api/public/track"), false);
assert.equal(componentSource.includes("client-message-service"), false);
assert.equal(componentSource.includes("alimtalk"), false);
assert.equal(componentSource.includes("send adapter"), false);
assert.equal(componentSource.includes("sendSms"), false);
assert.equal(componentSource.includes("sendEmail"), false);
assert.equal(componentSource.includes("send/submit"), false);

console.log("customer tracking notice template tests passed");
