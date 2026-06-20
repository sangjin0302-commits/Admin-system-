import assert from "node:assert/strict";

import {
  sendManualCustomerNotificationAudit,
  CustomerNotificationSendServiceError
} from "@/lib/services/customer-notification-send-service";
import { CUSTOMER_NOTIFICATION_MESSAGE_VERSION } from "@/lib/services/customer-notification-preview-service";
import {
  MANUAL_RECIPIENT_PREVIEW,
  assertForbiddenFieldsNotReturned,
  buildInputPreviewHash,
  createFakePrisma,
  createSendInput
} from "./test-helpers";

async function testManualSendSuccessAppendsAudit() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);

  const result = await sendManualCustomerNotificationAudit(
    createSendInput({ previewHash }),
    {
      prismaClient: fake.prismaClient,
      now: () => new Date("2026-05-05T10:00:00.000Z")
    }
  );

  assert.equal(result.status, "SENT");
  assert.equal(result.channel, "manual");
  assert.equal(result.deliveryMode, "manual_audit_only");
  assert.equal(result.recipientPreview, MANUAL_RECIPIENT_PREVIEW);
  assert.equal(result.messageVersion, CUSTOMER_NOTIFICATION_MESSAGE_VERSION);
  assert.equal(result.previewHash, previewHash);
  assert.equal(result.idempotencyKey, "idempotent-001");
  assert.equal(result.externalActionAllowed, false);
  assert.equal(result.providerCalled, false);
  assert.equal(result.isResend, false);
  assert.equal(fake.state.counts.findUnique, 1);
  assert.equal(fake.state.counts.update, 1);

  const logs = JSON.parse(fake.state.inquiry.communicationLogs);
  assert.equal(logs.length, 1);
  const log = logs.at(-1);
  assert.equal(log.type, "customer_notification_sent");
  assert.equal(log.source, "admin_customer_notification");
  assert.equal(log.channel, "manual");
  assert.equal(log.deliveryMode, "manual_audit_only");
  assert.equal(log.trackingCode, fake.state.inquiry.publicTrackingCode);
  assert.equal(log.recipientPreview, MANUAL_RECIPIENT_PREVIEW);
  assert.equal(log.messageVersion, CUSTOMER_NOTIFICATION_MESSAGE_VERSION);
  assert.equal(log.previewHash, previewHash);
  assert.equal(log.idempotencyKey, "idempotent-001");
  assert.equal(log.externalActionAllowed, false);
  assert.equal(log.providerCalled, false);
  assert.equal(log.isResend, false);

  assert.equal(log.createdAt, result.sentAt);
  assert.equal(log.sentAt, result.sentAt);
}

async function testSafeResponseNoInternalFields() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);
  const result = await sendManualCustomerNotificationAudit(
    createSendInput({ previewHash }),
    { prismaClient: fake.prismaClient }
  );

  assertForbiddenFieldsNotReturned(result);
}

async function testProviderNotCalled() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);
  const result = await sendManualCustomerNotificationAudit(
    createSendInput({ previewHash }),
    { prismaClient: fake.prismaClient }
  );

  assert.equal(result.externalActionAllowed, false);
  assert.equal(result.providerCalled, false);
}

async function testChannelRestrictionsRejected() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);

  for (const channel of ["sms", "alimtalk"]) {
    await assert.rejects(
      () =>
        sendManualCustomerNotificationAudit(
          createSendInput({
            channel,
            previewHash,
            idempotencyKey: `block-${channel}`
          }),
          { prismaClient: fake.prismaClient }
        ),
      (error: unknown) =>
        error instanceof CustomerNotificationSendServiceError &&
        error.status === 400 &&
        error.code === "CHANNEL_SEND_NOT_ENABLED"
    );
  }
}

async function testTrackingCodeMissingReject() {
  const fake = createFakePrisma({
    inquiry: {
      publicTrackingCode: null
    }
  });
  const previewHash = "any-hash";

  await assert.rejects(
    () =>
      sendManualCustomerNotificationAudit(
        createSendInput({ previewHash }),
        { prismaClient: fake.prismaClient }
      ),
    (error: unknown) =>
      error instanceof CustomerNotificationSendServiceError &&
      error.status === 404 &&
      error.code === "NOT_FOUND"
  );
}

async function run() {
  await testManualSendSuccessAppendsAudit();
  await testSafeResponseNoInternalFields();
  await testProviderNotCalled();
  await testChannelRestrictionsRejected();
  await testTrackingCodeMissingReject();
  console.log("customer notification manual send tests passed");
}

run().catch((error) => {
  throw error;
});
