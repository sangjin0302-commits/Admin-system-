import { ZodError, z } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  InquiryConcurrentUpdateError,
  InquiryStatusGuardError,
  updateInquiryAdminFields
} from "@/lib/services/inquiry-service";
import { inquiryStatusValues } from "@/types/inquiry";

const updateStatusSchema = z.object({
  status: z.enum(inquiryStatusValues),
  statusChangeNote: z.string().trim().max(300).optional(),
  expectedUpdatedAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "기준 시각 형식이 올바르지 않습니다."
    })
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.status.patch");
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
      return api.error(
        400,
        "\uC694\uCCAD \uBCF8\uBB38(JSON)\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.",
        { code: "INVALID_JSON_BODY" }
      );
    }

    const payload = updateStatusSchema.parse(bodyResult.body);
    const inquiry = await updateInquiryAdminFields(id, {
      status: payload.status,
      statusChangeNote: payload.statusChangeNote,
      statusChangeSource: "status_panel",
      expectedUpdatedAt: payload.expectedUpdatedAt
    });
    return api.ok({ ok: true, inquiry });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(
        400,
        firstZodMessage(error, "\uC785\uB825\uAC12\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694."),
        { code: "VALIDATION_ERROR" }
      );
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
    return api.error(
      500,
      "\uBB38\uC758 \uC0C1\uD0DC\uB97C \uBCC0\uACBD\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
      { code: "PATCH_INQUIRY_STATUS_FAILED" }
    );
  }
}
