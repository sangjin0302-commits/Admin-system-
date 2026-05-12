import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  CaseMatterConversionError,
  CaseTaskConcurrentUpdateError,
  CaseTaskUpdateError,
  updateCaseTaskMetadata,
  updateCaseTaskStatus
} from "@/lib/services/case-matter-service";
import { updateCaseTaskSchema } from "@/lib/validation/case-matter";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; taskId: string }> }
) {
  const api = createAdminRequestContext("admin.case-matters.tasks.patch");
  const { id: rawCaseMatterId, taskId: rawTaskId } = await context.params;
  const caseMatterId = normalizeAdminEntityId(rawCaseMatterId);
  const taskId = normalizeAdminEntityId(rawTaskId);

  if (!caseMatterId) {
    return api.error(400, "Invalid case matter id format.", {
      code: "INVALID_CASE_MATTER_ID"
    });
  }

  if (!taskId) {
    return api.error(400, "Invalid case task id format.", {
      code: "INVALID_CASE_TASK_ID"
    });
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
    }

    const payload = updateCaseTaskSchema.parse(bodyResult.body);
    if (payload.mode === "metadata") {
      await updateCaseTaskMetadata({
        caseMatterId,
        taskId,
        ...payload
      });
    } else {
      await updateCaseTaskStatus({
        caseMatterId,
        taskId,
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

    if (error instanceof CaseTaskConcurrentUpdateError) {
      return api.error(409, error.message, {
        code: "CONCURRENT_UPDATE_CONFLICT",
        headers: {
          "X-Current-Updated-At": error.currentUpdatedAt
        }
      });
    }

    if (error instanceof CaseTaskUpdateError) {
      const status =
        error.code === "CASE_MATTER_MISMATCH"
          ? 409
          : error.code === "CASE_TASK_NOT_FOUND"
            ? 404
            : 400;
      return api.error(status, error.message, { code: error.code });
    }

    if (error instanceof CaseMatterConversionError) {
      return api.error(404, error.message, { code: error.code });
    }

    api.logError(error);
    return api.error(500, "Failed to update case task.", {
      code: "PATCH_CASE_TASK_FAILED"
    });
  }
}
