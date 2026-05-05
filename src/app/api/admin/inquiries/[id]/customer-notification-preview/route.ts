import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import {
  getCustomerNotificationPreview,
  parseCustomerNotificationChannel
} from "@/lib/services/customer-notification-preview-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.customer-notification-preview.get");
  const { id: rawInquiryId } = await context.params;
  const inquiryId = normalizeAdminEntityId(rawInquiryId);

  if (!inquiryId) {
    return api.error(400, "Invalid inquiry id.", {
      code: "INVALID_INQUIRY_ID"
    });
  }

  const url = new URL(request.url);
  const channel = parseCustomerNotificationChannel(url.searchParams.get("channel"));

  if (!channel) {
    return api.error(400, "Invalid customer notification channel.", {
      code: "CHANNEL_NOT_SUPPORTED"
    });
  }

  try {
    const preview = await getCustomerNotificationPreview(inquiryId, channel);
    if (!preview) {
      return api.error(404, "Inquiry not found.", {
        code: "INQUIRY_NOT_FOUND"
      });
    }

    return api.ok(preview);
  } catch (error) {
    api.logError(error);
    return api.error(500, "Customer notification preview failed.", {
      code: "CUSTOMER_NOTIFICATION_PREVIEW_FAILED"
    });
  }
}
