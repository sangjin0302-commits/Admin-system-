import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { getLawbotMessageSendReadiness } from "@/lib/services/lawbot-message-send-readiness-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.lawbot-review.message-send-readiness.get");
  const { id: rawInquiryId } = await context.params;
  const inquiryId = normalizeAdminEntityId(rawInquiryId);

  if (!inquiryId) {
    return api.error(400, "Invalid inquiry id.", {
      code: "INVALID_INQUIRY_ID"
    });
  }

  try {
    const result = await getLawbotMessageSendReadiness(inquiryId);
    if (!result) {
      return api.error(404, "Inquiry not found.", {
        code: "INQUIRY_NOT_FOUND"
      });
    }

    return api.ok({ ok: true, result });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Lawbot message send readiness check failed.", {
      code: "LAWBOT_MESSAGE_SEND_READINESS_FAILED"
    });
  }
}
