import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS,
  type CustomerNotificationChannel
} from "@/lib/services/customer-notification-preview-service";
import {
  CustomerNotificationSendServiceError,
  sendManualCustomerNotificationAudit
} from "@/lib/services/customer-notification-send-service";

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readStringTrimmed(value: unknown) {
  const valueAsString = readString(value);
  return valueAsString.trim();
}

function allConfirmationsProvided(value: unknown): boolean {
  if (!isObject(value)) return false;

  for (const key of CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS) {
    if (value[key] !== true) {
      return false;
    }
  }
  return true;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.customer-notification-send.post");
  const { id: rawInquiryId } = await context.params;
  const inquiryId = normalizeAdminEntityId(rawInquiryId);

  if (!inquiryId) {
    return api.error(400, "Invalid inquiry id.", {
      code: "INVALID_INQUIRY_ID"
    });
  }

  const bodyResult = await safeReadJsonBody(request);
  if (!bodyResult.ok) {
    return api.error(400, "Invalid JSON body.", {
      code: "VALIDATION_ERROR"
    });
  }

  if (!isObject(bodyResult.body)) {
    return api.error(400, "Invalid request payload.", {
      code: "VALIDATION_ERROR"
    });
  }

  const body = bodyResult.body;
  const channel = readString(body.channel).trim().toLowerCase() as
    | CustomerNotificationChannel
    | "";
  const previewHash = readStringTrimmed(body.previewHash);
  const messageVersion = readStringTrimmed(body.messageVersion);
  const idempotencyKey = readStringTrimmed(body.idempotencyKey);

  const confirmations = isObject(body.confirmations) ? body.confirmations : null;
  const resendReason = readString(body.resendReason);

  if (channel !== "manual") {
    return api.error(400, "Only manual channel is allowed.", {
      code: "CHANNEL_SEND_NOT_ENABLED"
    });
  }

  if (!previewHash || !messageVersion || !idempotencyKey) {
    return api.error(400, "Required send confirmation fields are missing.", {
      code: "VALIDATION_ERROR"
    });
  }

  if (!allConfirmationsProvided(confirmations)) {
    return api.error(400, "Required send confirmations are missing.", {
      code: "VALIDATION_ERROR"
    });
  }

  const confirmationsRaw = confirmations!;
  try {
    const result = await sendManualCustomerNotificationAudit({
      inquiryId,
      channel,
      previewHash,
      messageVersion,
      idempotencyKey: idempotencyKey,
      confirmations: confirmationsRaw,
      resendReason
    });

    return api.ok(result);
  } catch (error) {
    if (error instanceof CustomerNotificationSendServiceError) {
      return api.error(error.status, error.message, {
        code: error.code
      });
    }

    api.logError(error);
    return api.error(500, "Customer notification send audit failed.", {
      code: "CUSTOMER_NOTIFICATION_SEND_AUDIT_FAILED"
    });
  }
}
