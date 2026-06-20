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

async function testDuplicateSamePreviewWithoutResendReject() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);

  await sendManualCustomerNotificationAudit(
    createSendInput({ previewHash, idempotencyKey: "first" }),
    { prismaClient: fake.prismaClient }
  );

  await assert.rejects(
    () =>
      sendManualCustomerNotificationAudit(
        createSendInput({
          previewHash,
          idempotencyKey: "second"
        }),
        { prismaClient: fake.prismaClient }
      ),
    (error: unknown) =>
      error instanceof CustomerNotificationSendServiceError &&
      error.status === 409 &&
      error.code === "DUPLICATE_NOTIFICATION_SEND"
  );
}

async function testEmailDuplicateSamePreviewWithoutResendReject() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry, "email");

  await sendManualCustomerNotificationAudit(
    createSendInput({
      channel: "email",
      previewHash,
      idempotencyKey: "email-first"
    }),
    { prismaClient: fake.prismaClient }
  );

  await assert.rejects(
    () =>
      sendManualCustomerNotificationAudit(
        createSendInput({
          channel: "email",
          previewHash,
          idempotencyKey: "email-second"
        }),
        { prismaClient: fake.prismaClient }
      ),
    (error: unknown) =>
      error instanceof CustomerNotificationSendServiceError &&
      error.status === 409 &&
      error.code === "DUPLICATE_NOTIFICATION_SEND"
  );
}

async function testDuplicateByIdempotencyReturnsCachedResult() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);

  const first = await sendManualCustomerNotificationAudit(
    createSendInput({ previewHash, idempotencyKey: "same-key" }),
    { prismaClient: fake.prismaClient }
  );

  const second = await sendManualCustomerNotificationAudit(
    createSendInput({ previewHash, idempotencyKey: "same-key" }),
    { prismaClient: fake.prismaClient }
  );

  assert.deepEqual(first, second);
  const logs = JSON.parse(fake.state.inquiry.communicationLogs);
  assert.equal(logs.length, 1);
}

async function testEmailDuplicateByIdempotencyReturnsCachedResult() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry, "email");

  const first = await sendManualCustomerNotificationAudit(
    createSendInput({
      channel: "email",
      previewHash,
      idempotencyKey: "same-email-key"
    }),
    { prismaClient: fake.prismaClient }
  );

  const second = await sendManualCustomerNotificationAudit(
    createSendInput({
      channel: "email",
      previewHash,
      idempotencyKey: "same-email-key"
    }),
    { prismaClient: fake.prismaClient }
  );

  assert.deepEqual(first, second);
  const logs = JSON.parse(fake.state.inquiry.communicationLogs);
  assert.equal(logs.length, 1);
}

async function testResendAllowedWithReason() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry);

  await sendManualCustomerNotificationAudit(
    createSendInput({ previewHash, idempotencyKey: "first" }),
    { prismaClient: fake.prismaClient }
  );

  const resend = await sendManualCustomerNotificationAudit(
    createSendInput({
      previewHash,
      idempotencyKey: "second",
      resendReason: "Customer requested re-confirmation after correction."
    }),
    { prismaClient: fake.prismaClient }
  );

  assert.equal(resend.isResend, true);

  const logs = JSON.parse(fake.state.inquiry.communicationLogs);
  assert.equal(logs.length, 2);
  assert.equal(logs.at(-1).isResend, true);
  assert.equal(logs.at(-1).resendReason, "Customer requested re-confirmation after correction.");
}

async function testEmailResendAllowedWithReason() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry, "email");

  await sendManualCustomerNotificationAudit(
    createSendInput({
      channel: "email",
      previewHash,
      idempotencyKey: "email-first"
    }),
    { prismaClient: fake.prismaClient }
  );

  const resend = await sendManualCustomerNotificationAudit(
    createSendInput({
      channel: "email",
      previewHash,
      idempotencyKey: "email-second",
      resendReason: "Customer asked for another dry-run record."
    }),
    { prismaClient: fake.prismaClient }
  );

  assert.equal(resend.status, "DRY_RUN_RECORDED");
  assert.equal(resend.isResend, true);

  const logs = JSON.parse(fake.state.inquiry.communicationLogs);
  assert.equal(logs.length, 2);
  assert.equal(logs.at(-1).isResend, true);
  assert.equal(logs.at(-1).resendReason, "Customer asked for another dry-run record.");
}

async function run() {
  await testDuplicateSamePreviewWithoutResendReject();
  await testEmailDuplicateSamePreviewWithoutResendReject();
  await testDuplicateByIdempotencyReturnsCachedResult();
  await testEmailDuplicateByIdempotencyReturnsCachedResult();
  await testResendAllowedWithReason();
  await testEmailResendAllowedWithReason();
  console.log("customer notification duplicates/resends tests passed");
}

run().catch((error) => {
  throw error;
});
