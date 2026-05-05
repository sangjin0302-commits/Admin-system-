import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  areAllCustomerNotificationManualAuditConfirmationsChecked,
  buildCustomerNotificationManualAuditApiPath,
  buildCustomerNotificationManualAuditRequest,
  buildCustomerNotificationManualAuditSuccessViewModel,
  createEmptyCustomerNotificationManualAuditConfirmations,
  CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CHANNEL,
  CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CONFIRMATIONS,
  CUSTOMER_NOTIFICATION_MANUAL_AUDIT_FORBIDDEN_RENDER_TOKENS,
  CUSTOMER_NOTIFICATION_MANUAL_AUDIT_HTTP_METHOD,
  getCustomerNotificationManualAuditErrorMessage
} from "@/lib/services/customer-notification-manual-audit-ui-model";

assert.equal(CUSTOMER_NOTIFICATION_MANUAL_AUDIT_HTTP_METHOD, "POST");
assert.equal(CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CHANNEL, "manual");
assert.equal(CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CONFIRMATIONS.length, 6);
assert.deepEqual(
  CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CONFIRMATIONS.map((item) => item.label),
  [
    "수신자를 확인했습니다.",
    "접수번호를 확인했습니다.",
    "안내문 내용을 확인했습니다.",
    "내부 정보가 포함되지 않았음을 확인했습니다.",
    "고객 안내 목적 및 동의 범위를 확인했습니다.",
    "수동 전달 완료 기록을 진행합니다."
  ]
);

assert.equal(
  buildCustomerNotificationManualAuditApiPath({ inquiryId: "inq 123" }),
  "/api/admin/inquiries/inq%20123/customer-notification/send"
);

const emptyConfirmations = createEmptyCustomerNotificationManualAuditConfirmations();
assert.equal(
  areAllCustomerNotificationManualAuditConfirmationsChecked(emptyConfirmations),
  false
);

const request = buildCustomerNotificationManualAuditRequest({
  previewHash: "preview-hash",
  messageVersion: "tracking-notice-v1",
  idempotencyKey: "manual-ui-key"
});
assert.equal(request.channel, "manual");
assert.equal(request.previewHash, "preview-hash");
assert.equal(request.messageVersion, "tracking-notice-v1");
assert.equal(request.idempotencyKey, "manual-ui-key");
assert.deepEqual(Object.values(request.confirmations), [true, true, true, true, true, true]);
assert.equal(areAllCustomerNotificationManualAuditConfirmationsChecked(request.confirmations), true);

const success = buildCustomerNotificationManualAuditSuccessViewModel({
  status: "SENT",
  channel: "manual",
  deliveryMode: "manual_audit_only",
  recipientPreview: "수동 전달",
  messageVersion: "tracking-notice-v1",
  previewHash: "preview-hash",
  idempotencyKey: "manual-ui-key",
  sentAt: "2026-05-05T09:00:00.000Z",
  externalActionAllowed: false,
  providerCalled: false,
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

assert.equal(success.statusLabel, "SENT");
assert.equal(success.channelLabel, "수동 전달");
assert.equal(success.deliveryModeLabel, "manual_audit_only");
assert.equal(success.providerCalledLabel, "false");
assert.equal(success.externalActionAllowedLabel, "false");
assert.equal(success.isResendLabel, "false");
assert.equal(
  getCustomerNotificationManualAuditErrorMessage("DUPLICATE_NOTIFICATION_SEND"),
  "이미 같은 안내문에 대한 수동 전달 기록이 있습니다."
);
assert.equal(
  getCustomerNotificationManualAuditErrorMessage("OTHER"),
  "수동 전달 완료 기록에 실패했습니다. 상태를 확인한 뒤 다시 시도하세요."
);

const serialized = JSON.stringify(success);
for (const forbidden of CUSTOMER_NOTIFICATION_MANUAL_AUDIT_FORBIDDEN_RENDER_TOKENS) {
  assert.equal(serialized.includes(forbidden), false, `Forbidden render token leaked: ${forbidden}`);
}
for (const forbidden of ["internal-inquiry-id", "internal-case-id", "APPROVED", "hidden"]) {
  assert.equal(serialized.includes(forbidden), false, `Forbidden value leaked: ${forbidden}`);
}

const root = process.cwd();
const componentSource = readFileSync(
  join(root, "src/components/admin/customer-notification-manual-audit-card.tsx"),
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

assert.match(componentSource, /수동 전달 완료 기록/);
assert.match(componentSource, /이 기능은 실제 문자, 이메일, 알림톡을 발송하지 않습니다/);
assert.match(componentSource, /CUSTOMER_NOTIFICATION_MANUAL_AUDIT_HTTP_METHOD/);
assert.match(componentSource, /buildCustomerNotificationManualAuditApiPath/);
assert.match(componentSource, /buildCustomerNotificationManualAuditRequest/);
assert.match(componentSource, /channel: "manual"/);
assert.match(componentSource, /providerCalled/);
assert.match(componentSource, /externalActionAllowed/);
assert.match(communicationCenterSource, /CustomerNotificationManualAuditCard/);
assert.equal(communicationLogSource.includes("CustomerNotificationManualAuditCard"), false);

for (const forbidden of [
  "발송하기",
  "전송하기",
  "SMS 보내기",
  "이메일 보내기",
  "알림톡 보내기",
  "client-message-service",
  "dispatchInitialClientMessage",
  "send adapter",
  "externalActionAllowed: true",
  "channel: \"email\"",
  "channel: \"sms\"",
  "channel: \"alimtalk\""
]) {
  assert.equal(componentSource.includes(forbidden), false, `Forbidden source fragment: ${forbidden}`);
}

console.log("customer notification manual audit UI model tests passed");
