import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  CaseMatterConcurrentUpdateError,
  CaseMatterConversionError,
  startRequiredDocumentChecklist
} from "@/lib/services/case-matter-service";
import { startRequiredDocumentChecklistSchema } from "@/lib/validation/case-matter";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.case-matters.required-documents.starter.post");
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

    const payload = startRequiredDocumentChecklistSchema.parse(bodyResult.body);
    const result = await startRequiredDocumentChecklist({
      caseMatterId,
      ...payload
    });

    return api.ok({
      ok: true,
      createdCount: result.createdCount,
      skippedCount: result.skippedCount
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "Check request fields."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof CaseMatterConcurrentUpdateError) {
      return api.error(409, error.message, {
        code: "CONCURRENT_UPDATE_CONFLICT",
        headers: {
          "X-Current-Updated-At": error.currentUpdatedAt
        }
      });
    }

    if (error instanceof CaseMatterConversionError) {
      return api.error(404, error.message, { code: error.code });
    }

    api.logError(error);
    return api.error(500, "Failed to start required document checklist.", {
      code: "POST_REQUIRED_DOCUMENT_CHECKLIST_STARTER_FAILED"
    });
  }
}
