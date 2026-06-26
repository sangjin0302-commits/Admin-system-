import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  areAllCustomerNotificationEmailDryRunConfirmationsChecked,
  buildCustomerNotificationEmailDryRunApiPath,
  buildCustomerNotificationEmailDryRunRequest,
  buildCustomerNotificationEmailDryRunSuccessViewModel,
  createEmptyCustomerNotificationEmailDryRunConfirmations,
  CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CHANNEL,
  CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CONFIRMATIONS,
  CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_FORBIDDEN_RENDER_TOKENS,
  CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_HTTP_METHOD,
  getCustomerNotificationEmailDryRunErrorMessage
} from "@/lib/services/customer-notification-email-dry-run-ui-model";

assert.equal(CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_HTTP_METHOD, "POST");
assert.equal(CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CHANNEL, "email");
assert.equal(CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CONFIRMATIONS.length, 6);
assert.deepEqual(
  CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CONFIRMATIONS.map((item) => item.label),
  [
    "이메일 수신자를 확인했습니다.",
    "접수번호를 확인했습니다.",
    "안내문 내용을 확인했습니다.",
    "내부 정보가 포함되지 않았음을 확인했습니다.",
    "고객 안내 목적 및 동의 범위를 확인했습니다.",
    "이메일 발송 준비 기록을 진행합니다."
  ]
);

assert.equal(
  buildCustomerNotificationEmailDryRunApiPath({ inquiryId: "inq 123" }),
  "/api/admin/inquiries/inq%20123/customer-notification/send"
);

const emptyConfirmations = createEmptyCustomerNotificationEmailDryRunConfirmations();
assert.equal(
  areAllCustomerNotificationEmailDryRunConfirmationsChecked(emptyConfirmations),
  false
);

const request = buildCustomerNotificationEmailDryRunRequest({
  previewHash: "preview-hash",
  messageVersion: "tracking-notice-v1",
  idempotencyKey: "email-ui-key"
});
assert.equal(request.channel, "email");
assert.equal(request.previewHash, "preview-hash");
assert.equal(request.messageVersion, "tracking-notice-v1");
assert.equal(request.idempotencyKey, "email-ui-key");
assert.deepEqual(Object.values(request.confirmations), [true, true, true, true, true, true]);
assert.equal(areAllCustomerNotificationEmailDryRunConfirmationsChecked(request.confirmations), true);

const success = buildCustomerNotificationEmailDryRunSuccessViewModel({
  status: "DRY_RUN_RECORDED",
  channel: "email",
  deliveryMode: "email_dry_run_only",
  recipientPreview: "c***@example.com",
  providerName: "dry-run",
  providerCalled: false,
  dryRunOnly: true,
  externalActionAllowed: false,
  messageVersion: "tracking-notice-v1",
  previewHash: "preview-hash",
  idempotencyKey: "email-ui-key",
  recordedAt: "2026-05-06T09:00:00.000Z",
  isResend: false,
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

assert.equal(success.statusLabel, "DRY_RUN_RECORDED");
assert.equal(success.channelLabel, "이메일");
assert.equal(success.deliveryModeLabel, "email_dry_run_only");
assert.equal(success.providerName, "dry-run");
assert.equal(success.providerCalledLabel, "false");
assert.equal(success.dryRunOnlyLabel, "true");
assert.equal(success.externalActionAllowedLabel, "false");
assert.equal(success.recordedAt, "2026-05-06T09:00:00.000Z");
assert.equal(success.isResendLabel, "false");
assert.equal(
  getCustomerNotificationEmailDryRunErrorMessage("DUPLICATE_NOTIFICATION_SEND"),
  "이미 같은 이메일 안내문에 대한 준비 기록이 있습니다."
);
assert.equal(
  getCustomerNotificationEmailDryRunErrorMessage("OTHER"),
  "이메일 발송 준비 기록에 실패했습니다. 상태를 확인한 뒤 다시 시도하세요."
);

const serialized = JSON.stringify(success);
for (const forbidden of CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_FORBIDDEN_RENDER_TOKENS) {
  assert.equal(serialized.includes(forbidden), false, `Forbidden render token leaked: ${forbidden}`);
}
for (const forbidden of ["internal-inquiry-id", "internal-case-id", "APPROVED", "hidden"]) {
  assert.equal(serialized.includes(forbidden), false, `Forbidden value leaked: ${forbidden}`);
}

const root = process.cwd();
const componentSource = readFileSync(
  join(root, "src/components/admin/customer-notification-email-dry-run-card.tsx"),
  "utf8"
);
const communicationCenterSource = readFileSync(
  join(root, "src/components/admin/inquiry-communication-center.tsx"),
  "utf8"
);
const communicationLogSource = readFileSync(
  join(root, "src/components/admin/inquiry-communication-log-panel.tsx"),
  "utf8"
);

assert.match(componentSource, /이메일 발송 준비 기록/);
assert.match(componentSource, /실제 이메일을 발송하지 않습니다/);
assert.match(componentSource, /CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_HTTP_METHOD/);
assert.match(componentSource, /buildCustomerNotificationEmailDryRunApiPath/);
assert.match(componentSource, /buildCustomerNotificationEmailDryRunRequest/);
assert.match(componentSource, /channel: "email"/);
assert.match(componentSource, /providerName/);
assert.match(componentSource, /providerCalled/);
assert.match(componentSource, /dryRunOnly/);
assert.match(componentSource, /externalActionAllowed/);
assert.match(communicationCenterSource, /CustomerNotificationEmailDryRunCard/);
assert.equal(communicationLogSource.includes("CustomerNotificationEmailDryRunCard"), false);

for (const forbidden of [
  "이메일 보내기",
  "SMS 보내기",
  "알림톡 보내기",
  "client-message-service",
  "dispatchInitialClientMessage",
  "send adapter",
  "externalActionAllowed: true",
  "channel: \"sms\"",
  "channel: \"alimtalk\""
]) {
  assert.equal(componentSource.includes(forbidden), false, `Forbidden source fragment: ${forbidden}`);
}

console.log("customer notification email dry-run UI model tests passed");
