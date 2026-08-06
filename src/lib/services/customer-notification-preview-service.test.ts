import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildCustomerNotificationPreviewDto,
  buildCustomerNotificationPreviewHash,
  CUSTOMER_NOTIFICATION_MESSAGE_VERSION,
  getCustomerNotificationPreview,
  parseCustomerNotificationChannel
} from "@/lib/services/customer-notification-preview-service";

type FakeInquiry = {
  email: string | null;
  phone: string | null;
  consentToPrivacy: boolean;
  publicTrackingCode: string | null;
};

const baseTrackingCode = "20260504-FC-0002-7D";

const baseInquiry: FakeInquiry = {
  email: "sangjin@example.com",
  phone: "010-1234-5678",
  consentToPrivacy: true,
  publicTrackingCode: baseTrackingCode
};

function fakePrisma(inquiry: FakeInquiry | null) {
  return {
    inquiry: {
      findUnique: async () => inquiry
    }
  };
}

function assertNoInternalFields(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    "inquiryId",
    "caseId",
    "workflowStatus",
    "bridgeWorkflowStatus",
    "Lawbot",
    "approvalGate",
    "reviewSignals",
    "documentDrafts",
    "messageDrafts",
    "communicationLogs",
    "adminNote",
    "internal DB id"
  ]) {
    assert.equal(serialized.includes(forbidden), false, `Forbidden field leaked: ${forbidden}`);
  }
}

async function testManualPreview() {
  const result = await getCustomerNotificationPreview("inq_123", "manual", {
    prismaClient: fakePrisma(baseInquiry)
  });
  assert.ok(result);
  assert.equal(result.channel, "manual");
  assert.equal(result.recipientPreview, "수동 전달");
  assert.equal(result.trackingCode, baseInquiry.publicTrackingCode);
  assert.equal(result.messageText?.includes(baseTrackingCode), true);
  assert.equal(result.messageText?.includes("https://ethosattorney.com/track"), true);
  assert.equal(result.canSend, false);
  assert.equal(result.dryRunOnly, true);
  assert.equal(result.externalActionAllowed, false);
  assert.ok(result.blockedReasonCodes.includes("SEND_DISABLED_PREVIEW_ONLY"));
  assert.equal(result.messageVersion, CUSTOMER_NOTIFICATION_MESSAGE_VERSION);
  assert.ok(result.previewHash);
  assertNoInternalFields(result);
}

async function testEmailPreview() {
  const result = await getCustomerNotificationPreview("inq_123", "email", {
    prismaClient: fakePrisma(baseInquiry)
  });
  assert.ok(result);
  assert.equal(result.recipientPreview, "sa*****@example.com");
  assert.equal(result.canSend, false);
  assert.equal(result.dryRunOnly, true);
  assert.equal(result.externalActionAllowed, false);
  assertNoInternalFields(result);
}

async function testSmsPreviewWithConsentBlock() {
  const result = await getCustomerNotificationPreview("inq_123", "sms", {
    prismaClient: fakePrisma(baseInquiry)
  });
  assert.ok(result);
  assert.equal(result.recipientPreview, "***-****-5678");
  assert.ok(result.blockedReasonCodes.includes("CHANNEL_CONSENT_NOT_CONFIRMED"));
  assert.equal(result.canSend, false);
  assertNoInternalFields(result);
}

async function testMissingPhoneBlocksSmsAndAlimtalk() {
  for (const channel of ["sms", "alimtalk"] as const) {
    const result = await getCustomerNotificationPreview("inq_123", channel, {
      prismaClient: fakePrisma({
        ...baseInquiry,
        phone: null
      })
    });
    assert.ok(result);
    assert.equal(result.recipientPreview, "");
    assert.ok(result.blockedReasonCodes.includes("RECIPIENT_MISSING"));
    assert.ok(result.blockedReasonCodes.includes("CHANNEL_CONSENT_NOT_CONFIRMED"));
    assert.equal(result.canSend, false);
  }
}

async function testMissingTrackingCode() {
  const result = await getCustomerNotificationPreview("inq_123", "manual", {
    prismaClient: fakePrisma({
      ...baseInquiry,
      publicTrackingCode: null
    })
  });
  assert.ok(result);
  assert.equal(result.trackingCode, null);
  assert.equal(result.messageText, null);
  assert.equal(result.previewHash, null);
  assert.ok(result.blockedReasonCodes.includes("TRACKING_CODE_MISSING"));
}

function testInvalidChannel() {
  assert.equal(parseCustomerNotificationChannel(null), "manual");
  assert.equal(parseCustomerNotificationChannel("EMAIL"), "email");
  assert.equal(parseCustomerNotificationChannel("unknown"), null);
}

function testStablePreviewHash() {
  const input = {
    messageText: "message",
    channel: "email" as const,
    trackingCode: baseTrackingCode
  };
  assert.equal(
    buildCustomerNotificationPreviewHash(input),
    buildCustomerNotificationPreviewHash(input)
  );
  assert.notEqual(
    buildCustomerNotificationPreviewHash(input),
    buildCustomerNotificationPreviewHash({ ...input, channel: "manual" })
  );
}

function testBuilderNoConsent() {
  const result = buildCustomerNotificationPreviewDto({
    inquiry: {
      ...baseInquiry,
      consentToPrivacy: false
    },
    channel: "email"
  });
  assert.ok(result.blockedReasonCodes.includes("CUSTOMER_CONSENT_NOT_CONFIRMED"));
  assert.equal(result.canSend, false);
}

function testSourceGuardrails() {
  const root = process.cwd();
  const routeSource = readFileSync(
    join(root, "src/app/api/admin/inquiries/[id]/customer-notification-preview/route.ts"),
    "utf8"
  );
  const serviceSource = readFileSync(
    join(root, "src/lib/services/customer-notification-preview-service.ts"),
    "utf8"
  );
  const combined = `${routeSource}\n${serviceSource}`;

  for (const forbidden of [
    "dispatchInitialClientMessage",
    "client-message-service",
    "clientMessageAdapters",
    "sendInitialMessage",
    "appendInquiryCommunicationLog",
    "prisma.inquiry.update",
    "prisma.inquiry.create",
    "prisma.inquiry.delete",
    "prisma.inquiry.upsert",
    "externalActionAllowed: true",
    "POST("
  ]) {
    assert.equal(combined.includes(forbidden), false, `Forbidden source fragment: ${forbidden}`);
  }
}

async function run() {
  await testManualPreview();
  await testEmailPreview();
  await testSmsPreviewWithConsentBlock();
  await testMissingPhoneBlocksSmsAndAlimtalk();
  await testMissingTrackingCode();
  testInvalidChannel();
  testStablePreviewHash();
  testBuilderNoConsent();
  testSourceGuardrails();
  console.log("customer notification preview service tests passed");
}

run().catch((error) => {
  throw error;
});
