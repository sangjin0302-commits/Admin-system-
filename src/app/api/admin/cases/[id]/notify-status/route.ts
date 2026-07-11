import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { notifyCaseStatusChange } from "@/lib/services/case-progress-notify-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.cases.notify-status.post");
  const { id: rawId } = await context.params;
  const caseId = normalizeAdminEntityId(rawId);

  if (!caseId) {
    return api.error(400, "Invalid case id format.", { code: "INVALID_CASE_ID" });
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
    }

    const { oldStatus, newStatus } = bodyResult.body as {
      oldStatus: string;
      newStatus: string;
    };

    if (!oldStatus || !newStatus) {
      return api.error(400, "oldStatus and newStatus are required.", {
        code: "MISSING_STATUS_FIELDS",
      });
    }

    await notifyCaseStatusChange(caseId, oldStatus, newStatus);

    return api.ok({ ok: true });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Failed to send status notification.", {
      code: "NOTIFY_STATUS_FAILED",
    });
  }
}
