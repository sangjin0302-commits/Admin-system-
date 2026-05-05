import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  sendManualCustomerNotificationAudit,
  CustomerNotificationSendServiceError
} from "@/lib/services/customer-notification-send-service";
import {
  CUSTOMER_NOTIFICATION_MESSAGE_VERSION,
  buildCustomerNotificationPreviewDto
} from "@/lib/services/customer-notification-preview-service";

const MANUAL_RECIPIENT_PREVIEW = "수동 전달";

type FakeInquiry = {
  id: string;
  email: string | null;
  phone: string | null;
  consentToPrivacy: boolean;
  publicTrackingCode: string | null;
  communicationLogs: string;
};

type FakePrismaState = {
  inquiry: FakeInquiry;
  counts: {
    findUnique: number;
    update: number;
  };
};

type FakePrismaClient = {
  $transaction: <T>(
    callback: (tx: {
      inquiry: {
        findUnique: () => Promise<FakeInquiry | null>;
        update: (args: { data: { communicationLogs: string } }) => Promise<FakeInquiry>;
      };
    }) => Promise<T>
  ) => Promise<T>;
};

function createFakePrisma(input?: {
  inquiry?: Partial<FakeInquiry>;
  initialCommunicationLogs?: unknown[];
}): { prismaClient: FakePrismaClient; state: FakePrismaState } {
  const state = {
    inquiry: {
      id: "inq_manual_001",
      email: "client@example.com",
      phone: "010-1234-5678",
      consentToPrivacy: true,
      publicTrackingCode: "20260504-FC-0002-7D",
      communicationLogs: JSON.stringify(input?.initialCommunicationLogs ?? []),
      ...input?.inquiry
    },
    counts: {
      findUnique: 0,
      update: 0
    }
  };

  const tx = {
    inquiry: {
      findUnique: async () => {
        state.counts.findUnique += 1;
        return state.inquiry;
      },
      update: async (args: { data: { communicationLogs: string } }) => {
        state.counts.update += 1;
        state.inquiry.communicationLogs = args.data.communicationLogs;
        return state.inquiry;
      }
    }
  };

  return {
    prismaClient: {
      $transaction: async <T>(
        callback: (txArg: {
          inquiry: {
            findUnique: () => Promise<FakeInquiry | null>;
            update: (args: { data: { communicationLogs: string } }) => Promise<FakeInquiry>;
          };
        }) => Promise<T>
      ) => callback(tx)
    },
    state
  };
}

function createSendInput(overrides?: {
  channel?: string;
  previewHash?: string;
  messageVersion?: string;
  idempotencyKey?: string;
  confirmations?: Partial<Record<string, boolean>>;
  resendReason?: string | null;
}) {
  return {
    inquiryId: "inq_manual_001",
    channel: overrides?.channel ?? "manual",
    previewHash: overrides?.previewHash ?? "",
    messageVersion: overrides?.messageVersion ?? CUSTOMER_NOTIFICATION_MESSAGE_VERSION,
    idempotencyKey: overrides?.idempotencyKey ?? "idempotent-001",
    confirmations: {
      recipientConfirmed: true,
      trackingCodeConfirmed: true,
      messageContentReviewed: true,
      noSensitiveInternalDataConfirmed: true,
      customerConsentConfirmed: true,
      finalSendConfirmed: true,
      ...overrides?.confirmations
    },
    resendReason: overrides?.resendReason
  };
}

function buildInputPreviewHash(inquiry: Pick<FakeInquiry, "email" | "phone" | "consentToPrivacy" | "publicTrackingCode">) {
  const preview = buildCustomerNotificationPreviewDto({
    inquiry,
    channel: "manual"
  });
  assert.ok(preview.previewHash);
  return preview.previewHash;
}

function assertForbiddenFieldsNotReturned(payload: unknown) {
  const serialized = JSON.stringify(payload);
  const forbidden = [
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
  ];

  for (const field of forbidden) {
    assert.equal(serialized.includes(field), false, `Forbidden field leaked: ${field}`);
  }
}

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

  for (const channel of ["email", "sms", "alimtalk"]) {
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

async function testNoProviderAndNoMutationStrings() {
  const source = readFileSync(
    join(process.cwd(), "src/lib/services/customer-notification-send-service.ts"),
    "utf8"
  );

  const forbidden = [
    "dispatchInitialClientMessage",
    "client-message-service",
    "providerCalled: true",
    "send adapter"
  ];
  for (const fragment of forbidden) {
    assert.equal(
      source.includes(fragment),
      false,
      `Forbidden source fragment detected: ${fragment}`
    );
  }
}

function testNoForbiddenResponseFieldInRouteAndTemplateFiles() {
  const root = process.cwd();
  const sendServiceSource = readFileSync(
    join(root, "src/lib/services/customer-notification-send-service.ts"),
    "utf8"
  );
  const routeSource = readFileSync(
    join(root, "src/app/api/admin/inquiries/[id]/customer-notification/send/route.ts"),
    "utf8"
  );
  const combined = `${sendServiceSource}\n${routeSource}`;

  assert.equal(combined.includes("prisma.inquiry.updateMany"), false);
  assert.equal(combined.includes("prisma.inquiry.create"), false);
  assert.equal(combined.includes("prisma.inquiry.delete"), false);
}

async function run() {
  await testManualSendSuccessAppendsAudit();
  await testSafeResponseNoInternalFields();
  await testProviderNotCalled();
  await testChannelRestrictionsRejected();
  await testMissingConfirmationReject();
  await testMissingIdempotencyReject();
  await testPreviewHashMismatchReject();
  await testMessageVersionMismatchReject();
  await testDuplicateSamePreviewWithoutResendReject();
  await testDuplicateByIdempotencyReturnsCachedResult();
  await testResendAllowedWithReason();
  await testTrackingCodeMissingReject();
  testNoProviderAndNoMutationStrings();
  testNoForbiddenResponseFieldInRouteAndTemplateFiles();

  console.log("customer notification send service tests passed");
}

run().catch((error) => {
  throw error;
});
