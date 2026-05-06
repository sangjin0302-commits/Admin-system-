import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const centerSource = readFileSync(
  join(root, "src/components/admin/inquiry-communication-center-v2.tsx"),
  "utf8"
);
const logSource = readFileSync(
  join(root, "src/components/admin/inquiry-communication-log-panel.tsx"),
  "utf8"
);
const operationsSource = readFileSync(
  join(root, "src/components/admin/inquiry-operations-feed-panel-clean.tsx"),
  "utf8"
);

assert.match(centerSource, /CommunicationHubGroup/);
assert.match(centerSource, /title="고객에게 안내"/);
assert.match(centerSource, /고객에게 전달할 안내문을 확인하거나 복사합니다/);
assert.match(centerSource, /title="기록"/);
assert.match(centerSource, /실제 발송 없이, 운영자가 수행한 안내\/준비 내역을 감사 기록으로 남깁니다/);
assert.match(centerSource, /title="설정\/안전"/);
assert.match(centerSource, /실제 이메일 발송 가능 여부와 차단 사유를 확인합니다/);

const guideGroupIndex = centerSource.indexOf('title="고객에게 안내"');
const copyCardIndex = centerSource.indexOf("CustomerTrackingNoticeCopyCard", guideGroupIndex);
const previewCardIndex = centerSource.indexOf("CustomerNotificationPreviewCard", guideGroupIndex);
const recordGroupIndex = centerSource.indexOf('title="기록"');
const manualCardIndex = centerSource.indexOf("CustomerNotificationManualAuditCard", recordGroupIndex);
const emailDryRunCardIndex = centerSource.indexOf("CustomerNotificationEmailDryRunCard", recordGroupIndex);
const safetyGroupIndex = centerSource.indexOf('title="설정/안전"');
const readinessCardIndex = centerSource.indexOf("CustomerEmailProviderReadinessCard", safetyGroupIndex);

assert.ok(guideGroupIndex >= 0);
assert.ok(copyCardIndex > guideGroupIndex);
assert.ok(previewCardIndex > copyCardIndex);
assert.ok(recordGroupIndex > previewCardIndex);
assert.ok(manualCardIndex > recordGroupIndex);
assert.ok(emailDryRunCardIndex > manualCardIndex);
assert.ok(safetyGroupIndex > emailDryRunCardIndex);
assert.ok(readinessCardIndex > safetyGroupIndex);

for (const forbiddenAction of [
  "발송하기",
  "전송하기",
  "이메일 보내기",
  "SMS 보내기",
  "알림톡 보내기",
  "client-message-service",
  "dispatchInitialClientMessage",
  "providerCalled: true",
  "externalActionAllowed: true"
]) {
  assert.equal(centerSource.includes(forbiddenAction), false, `Forbidden hub action: ${forbiddenAction}`);
}

for (const forbiddenLogAction of [
  "CustomerNotificationManualAuditCard",
  "CustomerNotificationEmailDryRunCard",
  "CustomerNotificationPreviewCard",
  "CustomerTrackingNoticeCopyCard",
  "CustomerEmailProviderReadinessCard"
]) {
  assert.equal(logSource.includes(forbiddenLogAction), false, `Log panel has action card: ${forbiddenLogAction}`);
  assert.equal(
    operationsSource.includes(forbiddenLogAction),
    false,
    `Operations panel has action card: ${forbiddenLogAction}`
  );
}

console.log("customer communication hub hierarchy tests passed");
