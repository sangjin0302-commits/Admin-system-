import { prisma } from "@/lib/prisma/client";
import {
  buildCustomerNotificationPreviewDto,
  CUSTOMER_NOTIFICATION_MESSAGE_VERSION,
  CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS,
  type CustomerNotificationChannel
} from "@/lib/services/customer-notification-preview-service";
import {
  buildCustomerTrackingEmailMessage,
  getCustomerEmailProvider,
  isValidCustomerEmailAddress,
  type CustomerEmailProvider
} from "@/lib/services/customer-email-provider";

type CustomerNotificationSendConfirmationKey =
  (typeof CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS)[number];

export type CustomerNotificationSendConfirmations = Record<
  CustomerNotificationSendConfirmationKey,
  boolean
>;

export type CustomerNotificationSendInput = {
  inquiryId: string;
  channel: CustomerNotificationChannel | string;
  previewHash: string;
  messageVersion: string;
  idempotencyKey: string;
  confirmations: Partial<CustomerNotificationSendConfirmations>;
  resendReason?: string | null;
};

export type ManualCustomerNotificationSendResult = {
  status: "SENT";
  channel: "manual";
  deliveryMode: "manual_audit_only";
  recipientPreview: string;
  messageVersion: typeof CUSTOMER_NOTIFICATION_MESSAGE_VERSION;
  previewHash: string;
  idempotencyKey: string;
  sentAt: string;
  externalActionAllowed: false;
  providerCalled: false;
  isResend: boolean;
};

export type EmailCustomerNotificationDryRunResult = {
  status: "DRY_RUN_RECORDED";
  channel: "email";
  deliveryMode: "email_dry_run_only";
  recipientPreview: string;
  providerName: "dry-run";
  providerCalled: false;
  dryRunOnly: true;
  externalActionAllowed: false;
  messageVersion: typeof CUSTOMER_NOTIFICATION_MESSAGE_VERSION;
  previewHash: string;
  idempotencyKey: string;
  recordedAt: string;
  isResend: boolean;
};

export type CustomerNotificationSendResult =
  | ManualCustomerNotificationSendResult
  | EmailCustomerNotificationDryRunResult;

type InquiryRow = {
  id: string;
  email: string | null;
  phone: string | null;
  publicTrackingCode: string | null;
  consentToPrivacy: boolean;
  communicationLogs: string | null;
};

type TransactionClient = {
  inquiry: {
    findUnique(args: unknown): Promise<InquiryRow | null>;
    update(args: unknown): Promise<unknown>;
  };
};

type CustomerNotificationSendPrismaClient = {
  $transaction<T>(callback: (tx: TransactionClient) => Promise<T>): Promise<T>;
};

export type CustomerNotificationSendDependencies = {
  prismaClient?: CustomerNotificationSendPrismaClient;
  emailProvider?: CustomerEmailProvider;
  now?: () => Date;
};

export class CustomerNotificationSendServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "CustomerNotificationSendServiceError";
    this.status = status;
    this.code = code;
  }
}

export function customerNotificationSendError(
  status: number,
  code: string,
  message: string
) {
  return new CustomerNotificationSendServiceError(status, code, message);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const MANUAL_RECIPIENT_PREVIEW = "수동 전달";

function parseCommunicationLogs(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function getBoolean(record: Record<string, unknown>, key: string) {
  return record[key] === true;
}

function normalizeChannel(input: CustomerNotificationSendInput["channel"]) {
  if (!hasText(input)) return null;
  return input.trim().toLowerCase();
}

function isSupportedSendChannel(channel: string): channel is "manual" | "email" {
  return channel === "manual" || channel === "email";
}

function assertSendChannel(channel: string | null): "manual" | "email" {
  if (!channel || !isSupportedSendChannel(channel)) {
    throw customerNotificationSendError(
      400,
      "CHANNEL_SEND_NOT_ENABLED",
      "Only manual audit and email dry-run notification records are enabled."
    );
  }
  return channel;
}

function getSentEventType(channel: "manual" | "email") {
  return channel === "manual"
    ? "customer_notification_sent"
    : "customer_email_send_dry_run_recorded";
}

function isManualChannel(channel: string): channel is "manual" {
  return channel === "manual";
}

function normalizeConfirmations(
  confirmations: CustomerNotificationSendInput["confirmations"]
): CustomerNotificationSendConfirmations {
  if (!isRecord(confirmations)) {
    throw customerNotificationSendError(
      400,
      "VALIDATION_ERROR",
      "Missing confirmation values for required fields."
    );
  }

  const result = {} as CustomerNotificationSendConfirmations;
  for (const key of CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS) {
    if (confirmations[key] !== true) {
      throw customerNotificationSendError(
        400,
        "VALIDATION_ERROR",
        `Missing confirmation: ${key}`
      );
    }
    result[key] = true;
  }

  return result;
}

function getExistingSentEventByIdempotencyKey(
  logs: unknown[],
  channel: "manual" | "email",
  idempotencyKey: string
) {
  const eventType = getSentEventType(channel);
  return logs.find((entry) => {
    if (!isRecord(entry)) return false;
    return (
      entry.type === eventType &&
      entry.channel === channel &&
      entry.idempotencyKey === idempotencyKey
    );
  });
}

function getExistingSuccessfulEventByPreviewHash(
  logs: unknown[],
  channel: "manual" | "email",
  previewHash: string
) {
  const eventType = getSentEventType(channel);
  return logs.find((entry) => {
    if (!isRecord(entry)) return false;
    return (
      entry.type === eventType &&
      entry.channel === channel &&
      entry.previewHash === previewHash
    );
  });
}

function resultFromAuditEntry(entry: unknown): CustomerNotificationSendResult | null {
  if (!isRecord(entry)) return null;
  const channel = getString(entry, "channel");
  const deliveryMode = getString(entry, "deliveryMode");
  const recipientPreview = getString(entry, "recipientPreview");
  const messageVersion = getString(entry, "messageVersion");
  const previewHash = getString(entry, "previewHash");
  const idempotencyKey = getString(entry, "idempotencyKey");
  const sentAt = getString(entry, "sentAt");
  const recordedAt = getString(entry, "recordedAt");

  if (
    channel === "manual" &&
    deliveryMode === "manual_audit_only" &&
    recipientPreview &&
    messageVersion === CUSTOMER_NOTIFICATION_MESSAGE_VERSION &&
    previewHash &&
    idempotencyKey &&
    sentAt
  ) {
    return {
      status: "SENT",
      channel: "manual",
      deliveryMode: "manual_audit_only",
      recipientPreview,
      messageVersion,
      previewHash,
      idempotencyKey,
      sentAt,
      externalActionAllowed: false,
      providerCalled: false,
      isResend: getBoolean(entry, "isResend")
    };
  }

  if (
    channel !== "email" ||
    deliveryMode !== "email_dry_run_only" ||
    !recipientPreview ||
    messageVersion !== CUSTOMER_NOTIFICATION_MESSAGE_VERSION ||
    !previewHash ||
    !idempotencyKey ||
    !recordedAt
  ) {
    return null;
  }

  return {
    status: "DRY_RUN_RECORDED",
    channel: "email",
    deliveryMode: "email_dry_run_only",
    recipientPreview,
    providerName: "dry-run",
    providerCalled: false,
    dryRunOnly: true,
    externalActionAllowed: false,
    messageVersion,
    previewHash,
    idempotencyKey,
    recordedAt,
    isResend: getBoolean(entry, "isResend")
  };
}

function buildAuditEntry(input: {
  channel: "manual";
  sentAt: string;
  trackingCode: string;
  previewHash: string;
  idempotencyKey: string;
  confirmations: CustomerNotificationSendConfirmations;
  isResend: boolean;
  resendReason?: string | null;
}) {
  const base = {
    type: "customer_notification_sent",
    source: "admin_customer_notification",
    channel: "manual",
    deliveryMode: "manual_audit_only",
    trackingCode: input.trackingCode,
    recipientPreview: MANUAL_RECIPIENT_PREVIEW,
    messageVersion: CUSTOMER_NOTIFICATION_MESSAGE_VERSION,
    previewHash: input.previewHash,
    idempotencyKey: input.idempotencyKey,
    confirmations: input.confirmations,
    externalActionAllowed: false,
    providerCalled: false,
    sentAt: input.sentAt,
    createdAt: input.sentAt,
    isResend: input.isResend
  };

  const resendReason = input.resendReason?.trim();
  return resendReason ? { ...base, resendReason } : base;
}

function buildEmailDryRunAuditEntry(input: {
  recordedAt: string;
  trackingCode: string;
  recipientPreview: string;
  providerName: "dry-run";
  previewHash: string;
  idempotencyKey: string;
  confirmations: CustomerNotificationSendConfirmations;
  isResend: boolean;
  resendReason?: string | null;
}) {
  const base = {
    type: "customer_email_send_dry_run_recorded",
    source: "admin_customer_notification",
    channel: "email",
    deliveryMode: "email_dry_run_only",
    trackingCode: input.trackingCode,
    recipientPreview: input.recipientPreview,
    providerName: input.providerName,
    providerCalled: false,
    dryRunOnly: true,
    externalActionAllowed: false,
    messageVersion: CUSTOMER_NOTIFICATION_MESSAGE_VERSION,
    previewHash: input.previewHash,
    idempotencyKey: input.idempotencyKey,
    confirmations: input.confirmations,
    recordedAt: input.recordedAt,
    createdAt: input.recordedAt,
    isResend: input.isResend
  };

  const resendReason = input.resendReason?.trim();
  return resendReason ? { ...base, resendReason } : base;
}

function assertSendInput(input: CustomerNotificationSendInput): {
  normalizedChannel: "manual" | "email";
  normalizedIdempotencyKey: string;
  normalizedPreviewHash: string;
  normalizedMessageVersion: string;
  confirmations: CustomerNotificationSendConfirmations;
} {
  const normalizedChannel = normalizeChannel(input.channel);
  const sendChannel = assertSendChannel(normalizedChannel);

  const normalizedPreviewHash = hasText(input.previewHash)
    ? input.previewHash.trim()
    : "";
  const normalizedMessageVersion = hasText(input.messageVersion)
    ? input.messageVersion.trim()
    : "";

  if (
    !hasText(normalizedPreviewHash) ||
    !hasText(normalizedMessageVersion) ||
    !hasText(input.idempotencyKey)
  ) {
    throw customerNotificationSendError(
      400,
      "VALIDATION_ERROR",
      "Required send confirmation fields are missing."
    );
  }

  const normalizedIdempotencyKey = input.idempotencyKey.trim();
  const confirmations = normalizeConfirmations(input.confirmations);

  return {
    normalizedChannel: sendChannel,
    normalizedIdempotencyKey,
    normalizedPreviewHash,
    normalizedMessageVersion,
    confirmations
  };
}

export async function sendManualCustomerNotificationAudit(
  input: CustomerNotificationSendInput,
  dependencies: CustomerNotificationSendDependencies = {}
): Promise<CustomerNotificationSendResult> {
  const {
    normalizedChannel,
    normalizedIdempotencyKey,
    normalizedPreviewHash,
    normalizedMessageVersion,
    confirmations
  } = assertSendInput(input);
  const prismaClient =
    dependencies.prismaClient ?? (prisma as unknown as CustomerNotificationSendPrismaClient);
  const emailProvider = dependencies.emailProvider ?? getCustomerEmailProvider();
  const now = dependencies.now ?? (() => new Date());

  return prismaClient.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({
      where: { id: input.inquiryId },
      select: {
        id: true,
        email: true,
        phone: true,
        publicTrackingCode: true,
        consentToPrivacy: true,
        communicationLogs: true
      }
    });

    if (!inquiry) {
      throw customerNotificationSendError(
        404,
        "NOT_FOUND",
        "Customer notification target was not found."
      );
    }

    if (!inquiry.publicTrackingCode?.trim()) {
      throw customerNotificationSendError(
        404,
        "NOT_FOUND",
        "Customer notification target was not found."
      );
    }

    if (normalizedChannel === "email" && !inquiry.email?.trim()) {
      throw customerNotificationSendError(
        400,
        "RECIPIENT_MISSING",
        "Customer email recipient is missing."
      );
    }

    if (normalizedChannel === "email" && !isValidCustomerEmailAddress(inquiry.email)) {
      throw customerNotificationSendError(
        400,
        "INVALID_RECIPIENT_EMAIL",
        "Customer email recipient is invalid."
      );
    }

    const preview = buildCustomerNotificationPreviewDto({
      inquiry,
      channel: normalizedChannel
    });

    if (!preview.previewHash) {
      throw customerNotificationSendError(
        409,
        "PREVIEW_HASH_MISMATCH",
        "Customer notification preview hash does not match."
      );
    }

    if (normalizedPreviewHash !== preview.previewHash) {
      throw customerNotificationSendError(
        409,
        "PREVIEW_HASH_MISMATCH",
        "Customer notification preview hash does not match."
      );
    }

    if (normalizedMessageVersion !== preview.messageVersion) {
      throw customerNotificationSendError(
        400,
        "VALIDATION_ERROR",
        "Customer notification message version does not match."
      );
    }

    const logs = parseCommunicationLogs(inquiry.communicationLogs);

    const existingByIdempotencyKey = getExistingSentEventByIdempotencyKey(
      logs,
      normalizedChannel,
      normalizedIdempotencyKey
    );
    const existingResult = resultFromAuditEntry(existingByIdempotencyKey);
    if (existingResult) {
      return existingResult;
    }

    const duplicateByPreviewHash = getExistingSuccessfulEventByPreviewHash(
      logs,
      normalizedChannel,
      normalizedPreviewHash
    );
    const resendReason = input.resendReason?.trim() ?? "";

    if (duplicateByPreviewHash && !resendReason) {
      throw customerNotificationSendError(
        409,
        "DUPLICATE_NOTIFICATION_SEND",
        "Customer notification was already recorded for this preview."
      );
    }

    if (isManualChannel(normalizedChannel)) {
      const sentAt = now().toISOString();
      const auditEntry = buildAuditEntry({
        channel: "manual",
        sentAt,
        trackingCode: inquiry.publicTrackingCode.trim(),
        previewHash: preview.previewHash,
        idempotencyKey: normalizedIdempotencyKey,
        confirmations,
        isResend: Boolean(duplicateByPreviewHash),
        resendReason: resendReason || null
      });

      await tx.inquiry.update({
        where: { id: input.inquiryId },
        data: {
          communicationLogs: JSON.stringify([...logs, auditEntry])
        }
      });

      const result = resultFromAuditEntry(auditEntry);
      if (!result) {
        throw customerNotificationSendError(
          500,
          "CUSTOMER_NOTIFICATION_SEND_AUDIT_FAILED",
          "Customer notification audit result could not be built."
        );
      }

      return result;
    }

    const message = buildCustomerTrackingEmailMessage({
      trackingCode: inquiry.publicTrackingCode.trim()
    });
    const providerResult = await emailProvider.sendEmail({
      to: inquiry.email ?? "",
      from: "notice@adminofficemvp2.vercel.app",
      subject: message.subject,
      text: message.text,
      html: message.html,
      idempotencyKey: normalizedIdempotencyKey,
      metadata: {
        channel: "email",
        messageVersion: CUSTOMER_NOTIFICATION_MESSAGE_VERSION,
        previewHash: preview.previewHash
      }
    });

    if (
      providerResult.providerName !== "dry-run" ||
      providerResult.providerCalled !== false ||
      providerResult.dryRunOnly !== true ||
      providerResult.externalActionAllowed !== false ||
      providerResult.status !== "DRY_RUN_ACCEPTED"
    ) {
      throw customerNotificationSendError(
        500,
        "CUSTOMER_EMAIL_DRY_RUN_PROVIDER_INVALID",
        "Customer email dry-run provider returned an unsafe result."
      );
    }

    const recordedAt = now().toISOString();
    const emailAuditEntry = buildEmailDryRunAuditEntry({
      recordedAt,
      trackingCode: inquiry.publicTrackingCode.trim(),
      recipientPreview: preview.recipientPreview,
      providerName: "dry-run",
      previewHash: preview.previewHash,
      idempotencyKey: normalizedIdempotencyKey,
      confirmations,
      isResend: Boolean(duplicateByPreviewHash),
      resendReason: resendReason || null
    });

    await tx.inquiry.update({
      where: { id: input.inquiryId },
      data: {
        communicationLogs: JSON.stringify([...logs, emailAuditEntry])
      }
    });

    const result = resultFromAuditEntry(emailAuditEntry);
    if (!result) {
      throw customerNotificationSendError(
        500,
        "CUSTOMER_NOTIFICATION_SEND_AUDIT_FAILED",
        "Customer notification audit result could not be built."
      );
    }

    return result;
  });
}
