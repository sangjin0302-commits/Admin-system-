import { prisma } from "@/lib/prisma/client";
import { buildCustomerNotificationPreviewDto } from "@/lib/services/customer-notification-preview-service";
import {
  buildCustomerTrackingEmailMessage,
  getCustomerEmailProvider,
  isValidCustomerEmailAddress
} from "@/lib/services/customer-email-provider";
import { CUSTOMER_NOTIFICATION_MESSAGE_VERSION } from "@/lib/services/customer-notification-preview-service";
import { customerNotificationSendError } from "./errors";
import {
  assertSendInput,
  getExistingSentEventByIdempotencyKey,
  getExistingSuccessfulEventByPreviewHash,
  isManualChannel,
  parseCommunicationLogs
} from "./helpers";
import {
  buildAuditEntry,
  buildEmailDryRunAuditEntry,
  resultFromAuditEntry
} from "./audit-entries";
import type {
  CustomerNotificationSendDependencies,
  CustomerNotificationSendInput,
  CustomerNotificationSendPrismaClient,
  CustomerNotificationSendResult
} from "./types";

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
