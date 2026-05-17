import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  ImmigrationCaseDetailConcurrentUpdateError,
  ImmigrationCaseDetailUpdateError,
  updateImmigrationCaseDetail
} from "@/lib/services/immigration-case-detail-service";
import { updateImmigrationCaseDetailSchema } from "@/lib/validation/case-matter";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.immigration-detail.patch");
  const { id: rawCaseMatterId } = await context.params;
  const caseMatterId = normalizeAdminEntityId(rawCaseMatterId);

  if (!caseMatterId) {
    return api.error(400, "Invalid case matter id format.", {
      code: "INVALID_CASE_MATTER_ID"
    });
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
    }

    const payload = updateImmigrationCaseDetailSchema.parse(bodyResult.body);
    await updateImmigrationCaseDetail({
      caseMatterId,
      ...payload
    });

    return api.ok({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "Check request fields."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof ImmigrationCaseDetailConcurrentUpdateError) {
      return api.error(409, error.message, {
        code: "CONCURRENT_IMMIGRATION_DETAIL_UPDATE_CONFLICT",
        headers: {
          "X-Current-Updated-At": error.currentUpdatedAt
        }
      });
    }

    if (error instanceof ImmigrationCaseDetailUpdateError) {
      const status =
        error.code === "CASE_MATTER_NOT_FOUND" || error.code === "IMMIGRATION_CASE_DETAIL_NOT_FOUND"
          ? 404
          : 400;
      return api.error(status, error.message, { code: error.code });
    }

    api.logError(error);
    return api.error(500, "Failed to update immigration case detail.", {
      code: "PATCH_IMMIGRATION_CASE_DETAIL_FAILED"
    });
  }
}
