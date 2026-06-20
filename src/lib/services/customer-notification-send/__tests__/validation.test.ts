import assert from "node:assert/strict";

import {
  sendManualCustomerNotificationAudit,
  CustomerNotificationSendServiceError
} from "@/lib/services/customer-notification-send-service";
import {
  buildInputPreviewHash,
  createFakePrisma,
  createSendInput
} from "./test-helpers";

async function testMissingConfirmationReject() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);

  await assert.rejects(
    () =>
      sendManualCustomerNotificationAudit(
        createSendInput({
          previewHash,
          confirmations: {
            recipientConfirmed: true,
            trackingCodeConfirmed: true,
            messageContentReviewed: true,
            noSensitiveInternalDataConfirmed: true,
            customerConsentConfirmed: false,
            finalSendConfirmed: true
          }
        }),
        { prismaClient: fake.prismaClient }
      ),
    (error: unknown) =>
      error instanceof CustomerNotificationSendServiceError &&
      error.status === 400 &&
      error.code === "VALIDATION_ERROR"
  );
}

async function testMissingIdempotencyReject() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);

  await assert.rejects(
    () =>
      sendManualCustomerNotificationAudit(
        createSendInput({
          previewHash,
          idempotencyKey: ""
        }),
        { prismaClient: fake.prismaClient }
      ),
    (error: unknown) =>
      error instanceof CustomerNotificationSendServiceError &&
      error.status === 400 &&
      error.code === "VALIDATION_ERROR"
  );
}

async function testPreviewHashMismatchReject() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);

  await assert.rejects(
    () =>
      sendManualCustomerNotificationAudit(
        createSendInput({
          previewHash: `${previewHash}-wrong`
        }),
        { prismaClient: fake.prismaClient }
      ),
    (error: unknown) =>
      error instanceof CustomerNotificationSendServiceError &&
      error.status === 409 &&
      error.code === "PREVIEW_HASH_MISMATCH"
  );
}

async function testMessageVersionMismatchReject() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);

  await assert.rejects(
    () =>
      sendManualCustomerNotificationAudit(
        createSendInput({
          previewHash,
          messageVersion: "old-version"
        }),
        { prismaClient: fake.prismaClient }
      ),
    (error: unknown) =>
      error instanceof CustomerNotificationSendServiceError &&
      error.status === 400 &&
      error.code === "VALIDATION_ERROR"
  );
}

async function run() {
  await testMissingConfirmationReject();
  await testMissingIdempotencyReject();
  await testPreviewHashMismatchReject();
  await testMessageVersionMismatchReject();
  console.log("customer notification send validation tests passed");
}

run().catch((error) => {
  throw error;
});
