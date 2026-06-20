import {
  CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS
} from "@/lib/services/customer-notification-preview-service";
import { customerNotificationSendError } from "./errors";
import type {
  CustomerNotificationSendConfirmations,
  CustomerNotificationSendInput
} from "./types";

export function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseCommunicationLogs(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

export function getBoolean(record: Record<string, unknown>, key: string) {
  return record[key] === true;
}

export function normalizeChannel(input: CustomerNotificationSendInput["channel"]) {
  if (!hasText(input)) return null;
  return input.trim().toLowerCase();
}

export function isSupportedSendChannel(
  channel: string
): channel is "manual" | "email" {
  return channel === "manual" || channel === "email";
}

export function assertSendChannel(channel: string | null): "manual" | "email" {
  if (!channel || !isSupportedSendChannel(channel)) {
    throw customerNotificationSendError(
      400,
      "CHANNEL_SEND_NOT_ENABLED",
      "Only manual audit and email dry-run notification records are enabled."
    );
  }
  return channel;
}

export function getSentEventType(channel: "manual" | "email") {
  return channel === "manual"
    ? "customer_notification_sent"
    : "customer_email_send_dry_run_recorded";
}

export function isManualChannel(channel: string): channel is "manual" {
  return channel === "manual";
}

export function normalizeConfirmations(
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

export function getExistingSentEventByIdempotencyKey(
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

export function getExistingSuccessfulEventByPreviewHash(
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

export function assertSendInput(input: CustomerNotificationSendInput): {
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
