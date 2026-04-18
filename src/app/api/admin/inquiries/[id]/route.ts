import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  InquiryConcurrentUpdateError,
  InquiryStatusGuardError,
  updateInquiryAdminFields
} from "@/lib/services/inquiry-service";
import { updateInquiryAdminSchema } from "@/lib/validation/admin-safe-v2";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.patch");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);

  if (!id) {
    return api.error(
      400,
      "\uBB38\uC758 ID \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
      { code: "INVALID_INQUIRY_ID" }
    );
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
    }

    const payload = updateInquiryAdminSchema.parse(bodyResult.body);
    const inquiry = await updateInquiryAdminFields(id, {
      status: payload.status,
      assignee: payload.assignee,
      internalMemo: payload.internalMemo,
      statusChangeNote: payload.statusChangeNote,
      statusChangeSource: "management_form",
      expectedUpdatedAt: payload.expectedUpdatedAt
    });
    return api.ok({ ok: true, inquiry });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "입력값을 다시 확인해 주세요."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof InquiryStatusGuardError) {
      return api.error(409, error.message, {
        code: "STATUS_TRANSITION_BLOCKED",
        blockers: error.blockers
      });
    }

    if (error instanceof InquiryConcurrentUpdateError) {
      return api.error(409, error.message, {
        code: "CONCURRENT_UPDATE_CONFLICT",
        headers: {
          "X-Current-Updated-At": error.currentUpdatedAt
        }
      });
    }

    api.logError(error);
    return api.error(500, "문의 정보를 수정하지 못했습니다.", { code: "PATCH_INQUIRY_FAILED" });
  }
}
