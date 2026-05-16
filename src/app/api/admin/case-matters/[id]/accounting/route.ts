import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  CaseAccountingMemoConcurrentUpdateError,
  CaseAccountingMemoUpdateError,
  CaseMatterConcurrentUpdateError,
  CaseMatterConversionError,
  updateCaseAccountingMemo
} from "@/lib/services/case-matter-service";
import { updateCaseAccountingMemoSchema } from "@/lib/validation/case-matter";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.accounting.patch");
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

    const payload = updateCaseAccountingMemoSchema.parse(bodyResult.body);
    await updateCaseAccountingMemo({
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

    if (error instanceof CaseMatterConcurrentUpdateError) {
      return api.error(409, error.message, {
        code: "CONCURRENT_CASE_UPDATE_CONFLICT",
        headers: {
          "X-Current-Updated-At": error.currentUpdatedAt
        }
      });
    }

    if (error instanceof CaseAccountingMemoConcurrentUpdateError) {
      return api.error(409, error.message, {
        code: "CONCURRENT_ACCOUNTING_UPDATE_CONFLICT",
        headers: {
          "X-Current-Updated-At": error.currentUpdatedAt
        }
      });
    }

    if (error instanceof CaseAccountingMemoUpdateError) {
      const status = error.code === "ACCOUNTING_MEMO_NOT_FOUND" ? 404 : 400;
      return api.error(status, error.message, { code: error.code });
    }

    if (error instanceof CaseMatterConversionError) {
      return api.error(404, error.message, { code: error.code });
    }

    api.logError(error);
    return api.error(500, "Failed to update case accounting memo.", {
      code: "PATCH_CASE_ACCOUNTING_MEMO_FAILED"
    });
  }
}
