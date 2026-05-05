import { prisma } from "@/lib/prisma/client";
import {
  buildCustomerNotificationPreviewDto,
  CUSTOMER_NOTIFICATION_MESSAGE_VERSION,
  CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS,
  type CustomerNotificationChannel
} from "@/lib/services/customer-notification-preview-service";

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

export type CustomerNotificationSendResult = {
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

function isManualChannel(channel: string): channel is CustomerNotificationChannel {
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
  idempotencyKey: string
) {
  return logs.find((entry) => {
    if (!isRecord(entry)) return false;
    return (
      entry.type === "customer_notification_sent" &&
      entry.channel === "manual" &&
      entry.idempotencyKey === idempotencyKey
    );
  });
}

function getExistingSuccessfulEventByPreviewHash(
  logs: unknown[],
  previewHash: string
) {
  return logs.find((entry) => {
    if (!isRecord(entry)) return false;
    return (
      entry.type === "customer_notification_sent" &&
      entry.channel === "manual" &&
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

  if (
    channel !== "manual" ||
    deliveryMode !== "manual_audit_only" ||
    !recipientPreview ||
    messageVersion !== CUSTOMER_NOTIFICATION_MESSAGE_VERSION ||
    !previewHash ||
    !idempotencyKey ||
    !sentAt
  ) {
    return null;
  }

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

function buildAuditEntry(input: {
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

function assertManualSendInput(input: CustomerNotificationSendInput): {
  normalizedIdempotencyKey: string;
  normalizedPreviewHash: string;
  normalizedMessageVersion: string;
  confirmations: CustomerNotificationSendConfirmations;
} {
  const normalizedChannel = normalizeChannel(input.channel);
  if (!normalizedChannel || !isManualChannel(normalizedChannel)) {
    throw customerNotificationSendError(
      400,
      "CHANNEL_SEND_NOT_ENABLED",
      "Only manual customer notification audit is enabled."
    );
  }

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
    normalizedIdempotencyKey,
    normalizedPreviewHash,
    normalizedMessageVersion,
    confirmations
  } = assertManualSendInput(input);
  const prismaClient =
    dependencies.prismaClient ?? (prisma as unknown as CustomerNotificationSendPrismaClient);
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

    const preview = buildCustomerNotificationPreviewDto({
      inquiry,
      channel: "manual"
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
      normalizedIdempotencyKey
    );
    const existingResult = resultFromAuditEntry(existingByIdempotencyKey);
    if (existingResult) {
      return existingResult;
    }

    const duplicateByPreviewHash = getExistingSuccessfulEventByPreviewHash(
      logs,
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

    const sentAt = now().toISOString();
    const auditEntry = buildAuditEntry({
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
  });
}
