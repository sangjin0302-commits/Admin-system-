import assert from "node:assert/strict";

import { CUSTOMER_NOTIFICATION_MESSAGE_VERSION, buildCustomerNotificationPreviewDto } from "@/lib/services/customer-notification-preview-service";

export const MANUAL_RECIPIENT_PREVIEW = "수동 전달";

export type FakeInquiry = {
  id: string;
  email: string | null;
  phone: string | null;
  consentToPrivacy: boolean;
  publicTrackingCode: string | null;
  communicationLogs: string;
};

export type FakePrismaState = {
  inquiry: FakeInquiry;
  counts: {
    findUnique: number;
    update: number;
  };
};

export type FakePrismaClient = {
  $transaction: <T>(
    callback: (tx: {
      inquiry: {
        findUnique: () => Promise<FakeInquiry | null>;
        update: (args: { data: { communicationLogs: string } }) => Promise<FakeInquiry>;
      };
    }) => Promise<T>
  ) => Promise<T>;
};

export function createFakePrisma(input?: {
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

export function createSendInput(overrides?: {
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

export function buildInputPreviewHash(
  inquiry: Pick<FakeInquiry, "email" | "phone" | "consentToPrivacy" | "publicTrackingCode">,
  channel: "manual" | "email" = "manual"
) {
  const preview = buildCustomerNotificationPreviewDto({
    inquiry,
    channel
  });
  assert.ok(preview.previewHash);
  return preview.previewHash;
}

export function assertForbiddenFieldsNotReturned(payload: unknown) {
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
