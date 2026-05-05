import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma/client";
import { buildCustomerTrackingNoticeTemplate } from "@/lib/services/customer-tracking-notice-template";

export const CUSTOMER_NOTIFICATION_MESSAGE_VERSION = "tracking-notice-v1";

export const CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS = [
  "recipientConfirmed",
  "trackingCodeConfirmed",
  "messageContentReviewed",
  "noSensitiveInternalDataConfirmed",
  "customerConsentConfirmed",
  "finalSendConfirmed"
] as const;

export const customerNotificationChannelValues = [
  "manual",
  "email",
  "sms",
  "alimtalk"
] as const;

export type CustomerNotificationChannel =
  (typeof customerNotificationChannelValues)[number];

export type CustomerNotificationBlockedReasonCode =
  | "TRACKING_CODE_MISSING"
  | "RECIPIENT_MISSING"
  | "CHANNEL_CONSENT_NOT_CONFIRMED"
  | "CUSTOMER_CONSENT_NOT_CONFIRMED"
  | "SEND_DISABLED_PREVIEW_ONLY";

export type CustomerNotificationPreviewDto = {
  trackingCode: string | null;
  channel: CustomerNotificationChannel;
  recipientPreview: string;
  messageText: string | null;
  canSend: false;
  dryRunOnly: true;
  externalActionAllowed: false;
  blockedReasonCodes: CustomerNotificationBlockedReasonCode[];
  requiredConfirmations: typeof CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS;
  previewHash: string | null;
  messageVersion: typeof CUSTOMER_NOTIFICATION_MESSAGE_VERSION;
};

type InquiryRow = {
  email: string | null;
  phone: string | null;
  consentToPrivacy: boolean;
  publicTrackingCode: string | null;
};

type CustomerNotificationPreviewPrismaClient = {
  inquiry: {
    findUnique(args: unknown): Promise<InquiryRow | null>;
  };
};

export type CustomerNotificationPreviewDependencies = {
  prismaClient?: CustomerNotificationPreviewPrismaClient;
};

export function parseCustomerNotificationChannel(
  value: string | null | undefined
): CustomerNotificationChannel | null {
  const normalized = (value ?? "manual").trim().toLowerCase();
  if ((customerNotificationChannelValues as readonly string[]).includes(normalized)) {
    return normalized as CustomerNotificationChannel;
  }
  return null;
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function maskEmail(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return "";

  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) return "***";

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  const first = local[0] ?? "*";
  return `${first}***@${domain}`;
}

function maskPhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  return `***-****-${digits.slice(-4)}`;
}

function buildRecipientPreview(input: {
  inquiry: InquiryRow;
  channel: CustomerNotificationChannel;
}) {
  if (input.channel === "manual") return "수동 전달";
  if (input.channel === "email") return maskEmail(input.inquiry.email);
  return maskPhone(input.inquiry.phone);
}

function getRecipientMissing(input: {
  inquiry: InquiryRow;
  channel: CustomerNotificationChannel;
}) {
  if (input.channel === "manual") return false;
  if (input.channel === "email") return !hasText(input.inquiry.email);
  return !hasText(input.inquiry.phone);
}

export function buildCustomerNotificationPreviewHash(input: {
  messageText: string;
  channel: CustomerNotificationChannel;
  trackingCode: string;
  messageVersion?: string;
}) {
  const messageVersion = input.messageVersion ?? CUSTOMER_NOTIFICATION_MESSAGE_VERSION;
  return createHash("sha256")
    .update([
      messageVersion,
      input.channel,
      input.trackingCode,
      input.messageText
    ].join("\n---\n"))
    .digest("hex");
}

export function buildCustomerNotificationPreviewDto(input: {
  inquiry: InquiryRow;
  channel: CustomerNotificationChannel;
}): CustomerNotificationPreviewDto {
  const trackingCode = input.inquiry.publicTrackingCode?.trim() || null;
  const messageText = trackingCode
    ? buildCustomerTrackingNoticeTemplate({ trackingCode })
    : null;
  const blockedReasonCodes: CustomerNotificationBlockedReasonCode[] = [
    "SEND_DISABLED_PREVIEW_ONLY"
  ];

  if (!trackingCode) {
    blockedReasonCodes.push("TRACKING_CODE_MISSING");
  }

  if (getRecipientMissing(input)) {
    blockedReasonCodes.push("RECIPIENT_MISSING");
  }

  if (!input.inquiry.consentToPrivacy) {
    blockedReasonCodes.push("CUSTOMER_CONSENT_NOT_CONFIRMED");
  }

  if (input.channel === "sms" || input.channel === "alimtalk") {
    blockedReasonCodes.push("CHANNEL_CONSENT_NOT_CONFIRMED");
  }

  return {
    trackingCode,
    channel: input.channel,
    recipientPreview: buildRecipientPreview(input),
    messageText,
    canSend: false,
    dryRunOnly: true,
    externalActionAllowed: false,
    blockedReasonCodes: [...new Set(blockedReasonCodes)],
    requiredConfirmations: CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS,
    previewHash:
      trackingCode && messageText
        ? buildCustomerNotificationPreviewHash({
            messageText,
            channel: input.channel,
            trackingCode
          })
        : null,
    messageVersion: CUSTOMER_NOTIFICATION_MESSAGE_VERSION
  };
}

export async function getCustomerNotificationPreview(
  inquiryId: string,
  channel: CustomerNotificationChannel,
  dependencies: CustomerNotificationPreviewDependencies = {}
) {
  const prismaClient =
    dependencies.prismaClient ?? (prisma as unknown as CustomerNotificationPreviewPrismaClient);

  const inquiry = await prismaClient.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      email: true,
      phone: true,
      consentToPrivacy: true,
      publicTrackingCode: true
    }
  });

  if (!inquiry) return null;
  return buildCustomerNotificationPreviewDto({ inquiry, channel });
}
