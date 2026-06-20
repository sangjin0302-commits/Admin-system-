import assert from "node:assert/strict";

import {
  sendManualCustomerNotificationAudit,
  CustomerNotificationSendServiceError
} from "@/lib/services/customer-notification-send-service";
import { CUSTOMER_NOTIFICATION_MESSAGE_VERSION } from "@/lib/services/customer-notification-preview-service";
import {
  buildInputPreviewHash,
  createFakePrisma,
  createSendInput
} from "./test-helpers";

async function testEmailDryRunSuccessAppendsAudit() {
  const fake = createFakePrisma();
  const previewHash = buildInputPreviewHash(fake.state.inquiry, "email");
  const providerCalls: unknown[] = [];

  const result = await sendManualCustomerNotificationAudit(
    createSendInput({
      channel: "email",
      previewHash,
      idempotencyKey: "email-dry-run-001"
    }),
    {
      prismaClient: fake.prismaClient,
      now: () => new Date("2026-05-05T11:00:00.000Z"),
      emailProvider: {
        sendEmail: async (input) => {
          providerCalls.push(input);
          return {
            providerName: "dry-run",
            providerCalled: false,
            dryRunOnly: true,
            externalActionAllowed: false,
            status: "DRY_RUN_ACCEPTED"
          };
        }
      }
    }
  );

  assert.equal(result.status, "DRY_RUN_RECORDED");
  assert.equal(result.channel, "email");
  assert.equal(result.deliveryMode, "email_dry_run_only");
  assert.equal(result.recipientPreview, "c***@example.com");
  assert.equal(result.providerName, "dry-run");
  assert.equal(result.providerCalled, false);
  assert.equal(result.dryRunOnly, true);
  assert.equal(result.externalActionAllowed, false);
  assert.equal(result.messageVersion, CUSTOMER_NOTIFICATION_MESSAGE_VERSION);
  assert.equal(result.previewHash, previewHash);
  assert.equal(result.idempotencyKey, "email-dry-run-001");
  assert.equal(result.recordedAt, "2026-05-05T11:00:00.000Z");
  assert.equal(result.isResend, false);
  assert.equal(providerCalls.length, 1);
  assert.equal(fake.state.counts.update, 1);

  const logs = JSON.parse(fake.state.inquiry.communicationLogs);
  assert.equal(logs.length, 1);
  const log = logs.at(-1);
  assert.equal(log.type, "customer_email_send_dry_run_recorded");
  assert.equal(log.source, "admin_customer_notification");
  assert.equal(log.channel, "email");
  assert.equal(log.deliveryMode, "email_dry_run_only");
  assert.equal(log.providerName, "dry-run");
  assert.equal(log.providerCalled, false);
  assert.equal(log.dryRunOnly, true);
  assert.equal(log.externalActionAllowed, false);
  assert.equal(log.trackingCode, fake.state.inquiry.publicTrackingCode);
  assert.equal(log.recipientPreview, "c***@example.com");
  assert.equal(log.messageVersion, CUSTOMER_NOTIFICATION_MESSAGE_VERSION);
  assert.equal(log.previewHash, previewHash);
  assert.equal(log.idempotencyKey, "email-dry-run-001");
  assert.equal(log.recordedAt, result.recordedAt);
  assert.equal(log.createdAt, result.recordedAt);
  assert.equal(log.isResend, false);
  assert.equal(log.messageText, undefined);
  assert.equal(log.messageBody, undefined);
  assert.equal(log.subject, undefined);
  assert.equal(log.text, undefined);
  assert.equal(log.html, undefined);
  assert.equal(JSON.stringify(log).includes("raw message body"), false);
}

async function testEmailMissingOrInvalidRecipientRejects() {
  for (const [email, code] of [
    [null, "RECIPIENT_MISSING"],
    ["bad-email", "INVALID_RECIPIENT_EMAIL"]
  ] as const) {
    const fake = createFakePrisma({
      inquiry: {
        email
      }
    });
    const previewHash =
      email && email.includes("@")
        ? buildInputPreviewHash(fake.state.inquiry, "email")
        : "preview-hash";

    await assert.rejects(
      () =>
        sendManualCustomerNotificationAudit(
          createSendInput({
            channel: "email",
            previewHash,
            idempotencyKey: `email-${code}`
          }),
          { prismaClient: fake.prismaClient }
        ),
      (error: unknown) =>
        error instanceof CustomerNotificationSendServiceError &&
        error.status === 400 &&
        error.code === code
    );
  }
}

async function run() {
  await testEmailDryRunSuccessAppendsAudit();
  await testEmailMissingOrInvalidRecipientRejects();
  console.log("customer notification email send tests passed");
}

run().catch((error) => {
  throw error;
});
