import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildCustomerNotificationPreviewApiPath,
  buildCustomerNotificationPreviewViewModel,
  CUSTOMER_NOTIFICATION_PREVIEW_CHANNELS,
  CUSTOMER_NOTIFICATION_PREVIEW_FORBIDDEN_RENDER_TOKENS,
  CUSTOMER_NOTIFICATION_PREVIEW_HTTP_METHOD
} from "@/lib/services/customer-notification-preview-ui-model";

assert.equal(CUSTOMER_NOTIFICATION_PREVIEW_HTTP_METHOD, "GET");
assert.deepEqual(
  CUSTOMER_NOTIFICATION_PREVIEW_CHANNELS.map((item) => item.label),
  ["수동 전달", "이메일", "SMS", "알림톡"]
);
assert.equal(
  buildCustomerNotificationPreviewApiPath({
    inquiryId: "inq 123",
    channel: "sms"
  }),
  "/api/admin/inquiries/inq%20123/customer-notification-preview?channel=sms"
);

const viewModel = buildCustomerNotificationPreviewViewModel({
  trackingCode: "20260504-FC-0002-7D",
  channel: "sms",
  recipientPreview: "***-****-5678",
  messageText: "접수번호: 20260504-FC-0002-7D\nhttps://adminofficemvp2.vercel.app/track",
  canSend: false,
  dryRunOnly: true,
  externalActionAllowed: false,
  blockedReasonCodes: ["SEND_DISABLED_PREVIEW_ONLY", "CHANNEL_CONSENT_NOT_CONFIRMED"],
  requiredConfirmations: [
    "recipientConfirmed",
    "trackingCodeConfirmed",
    "messageContentReviewed",
    "noSensitiveInternalDataConfirmed",
    "customerConsentConfirmed",
    "finalSendConfirmed"
  ],
  previewHash: "hash-value",
  messageVersion: "tracking-notice-v1",
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
} as never);

assert.equal(viewModel.channelLabel, "SMS");
assert.equal(viewModel.canSendLabel, "불가");
assert.equal(viewModel.dryRunOnlyLabel, "true");
assert.equal(viewModel.externalActionAllowedLabel, "false");
assert.ok(viewModel.blockedReasonLabels.includes("현재 단계는 미리보기 전용입니다."));
assert.ok(viewModel.blockedReasonLabels.includes("SMS/알림톡 채널 동의가 확인되지 않았습니다."));
assert.ok(viewModel.requiredConfirmationLabels.includes("수신자 확인"));
assert.ok(viewModel.requiredConfirmationLabels.includes("최종 실행 확인"));

const serialized = JSON.stringify(viewModel);
for (const forbidden of CUSTOMER_NOTIFICATION_PREVIEW_FORBIDDEN_RENDER_TOKENS) {
  assert.equal(serialized.includes(forbidden), false, `Forbidden render token leaked: ${forbidden}`);
}
for (const forbidden of ["internal-inquiry-id", "internal-case-id", "APPROVED", "hidden"]) {
  assert.equal(serialized.includes(forbidden), false, `Forbidden value leaked: ${forbidden}`);
}

const root = process.cwd();
const componentSource = readFileSync(
  join(root, "src/components/admin/customer-notification-preview-card.tsx"),
  "utf8"
);
const communicationCenterSource = readFileSync(
  join(root, "src/components/admin/inquiry-communication-center-v2.tsx"),
  "utf8"
);
const communicationLogSource = readFileSync(
  join(root, "src/components/admin/inquiry-communication-log-panel.tsx"),
  "utf8"
);

assert.match(componentSource, /고객 알림 미리보기/);
assert.match(componentSource, /SMS/);
assert.match(componentSource, /알림톡/);
assert.match(componentSource, /CUSTOMER_NOTIFICATION_PREVIEW_HTTP_METHOD/);
assert.match(componentSource, /buildCustomerNotificationPreviewApiPath/);
assert.match(componentSource, /canSendLabel/);
assert.match(componentSource, /dryRunOnlyLabel/);
assert.match(componentSource, /externalActionAllowedLabel/);
assert.match(componentSource, /SMS\/알림톡은 별도 채널 동의 확인 전까지 발송할 수 없습니다/);
assert.match(communicationCenterSource, /CustomerNotificationPreviewCard/);
assert.match(communicationCenterSource, /CustomerTrackingNoticeCopyCard/);
assert.equal(communicationLogSource.includes("CustomerNotificationPreviewCard"), false);

for (const forbidden of [
  'method: "POST"',
  "SMS 보내기",
  "이메일 보내기",
  "알림톡 보내기",
  "전송 버튼",
  "client-message-service",
  "dispatchInitialClientMessage",
  "appendInquiryCommunicationLog",
  "prisma.inquiry.update",
  "externalActionAllowed: true"
]) {
  assert.equal(componentSource.includes(forbidden), false, `Forbidden source fragment: ${forbidden}`);
}

console.log("customer notification preview UI model tests passed");
