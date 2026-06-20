import { CUSTOMER_NOTIFICATION_MESSAGE_VERSION } from "@/lib/services/customer-notification-preview-service";
import { getBoolean, getString, isRecord } from "./helpers";
import {
  MANUAL_RECIPIENT_PREVIEW,
  type CustomerNotificationSendConfirmations,
  type CustomerNotificationSendResult
} from "./types";

export function resultFromAuditEntry(
  entry: unknown
): CustomerNotificationSendResult | null {
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

export function buildAuditEntry(input: {
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

export function buildEmailDryRunAuditEntry(input: {
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
