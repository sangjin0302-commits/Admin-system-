import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  CaseMatterConversionError,
  SupplementRequestConcurrentUpdateError,
  SupplementRequestUpdateError,
  updateSupplementRequestMetadata,
  updateSupplementRequestStatus
} from "@/lib/services/case-matter-service";
import { updateSupplementRequestSchema } from "@/lib/validation/case-matter";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; supplementRequestId: string }> }
) {
  const api = createAdminRequestContext("admin.case-matters.supplement-requests.patch");
  const { id: rawCaseMatterId, supplementRequestId: rawSupplementRequestId } = await context.params;
  const caseMatterId = normalizeAdminEntityId(rawCaseMatterId);
  const supplementRequestId = normalizeAdminEntityId(rawSupplementRequestId);

  if (!caseMatterId) {
    return api.error(400, "Invalid case matter id format.", {
      code: "INVALID_CASE_MATTER_ID"
    });
  }

  if (!supplementRequestId) {
    return api.error(400, "Invalid supplement request id format.", {
      code: "INVALID_SUPPLEMENT_REQUEST_ID"
    });
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
    }

    const payload = updateSupplementRequestSchema.parse(bodyResult.body);
    if (payload.mode === "metadata") {
      await updateSupplementRequestMetadata({
        caseMatterId,
        supplementRequestId,
        ...payload
      });
    } else {
      await updateSupplementRequestStatus({
        caseMatterId,
        supplementRequestId,
        ...payload
      });
    }

    return api.ok({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "Check request fields."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof SupplementRequestConcurrentUpdateError) {
      return api.error(409, error.message, {
        code: "CONCURRENT_UPDATE_CONFLICT",
        headers: {
          "X-Current-Updated-At": error.currentUpdatedAt
        }
      });
    }

    if (error instanceof SupplementRequestUpdateError) {
      const status =
        error.code === "CASE_MATTER_MISMATCH"
          ? 409
          : error.code === "SUPPLEMENT_REQUEST_NOT_FOUND"
            ? 404
            : 400;
      return api.error(status, error.message, { code: error.code });
    }

    if (error instanceof CaseMatterConversionError) {
      return api.error(404, error.message, { code: error.code });
    }

    api.logError(error);
    return api.error(500, "Failed to update supplement request.", {
      code: "PATCH_SUPPLEMENT_REQUEST_FAILED"
    });
  }
}
