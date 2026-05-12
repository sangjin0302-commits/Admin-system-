import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  CaseMatterConcurrentUpdateError,
  CaseMatterConversionError,
  RequiredDocumentConcurrentUpdateError,
  RequiredDocumentUpdateError,
  updateRequiredDocumentMetadata
} from "@/lib/services/case-matter-service";
import { updateRequiredDocumentMetadataSchema } from "@/lib/validation/case-matter";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  const api = createAdminRequestContext("admin.case-matters.required-documents.metadata.patch");
  const { id: rawCaseMatterId, documentId: rawRequiredDocumentId } = await context.params;

  const caseMatterId = normalizeAdminEntityId(rawCaseMatterId);
  if (!caseMatterId) {
    return api.error(400, "Invalid case matter id format.", {
      code: "INVALID_CASE_MATTER_ID"
    });
  }

  const requiredDocumentId = normalizeAdminEntityId(rawRequiredDocumentId);
  if (!requiredDocumentId) {
    return api.error(400, "Invalid required document id format.", {
      code: "INVALID_REQUIRED_DOCUMENT_ID"
    });
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
    }

    const payload = updateRequiredDocumentMetadataSchema.parse(bodyResult.body);
    await updateRequiredDocumentMetadata({
      caseMatterId,
      requiredDocumentId,
      ...payload
    });

    return api.ok({
      ok: true
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "Check request fields."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof RequiredDocumentConcurrentUpdateError) {
      return api.error(409, error.message, {
        code: "CONCURRENT_UPDATE_CONFLICT",
        headers: {
          "X-Current-Updated-At": error.currentUpdatedAt
        }
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

    if (error instanceof RequiredDocumentUpdateError) {
      const status =
        error.code === "CASE_MATTER_MISMATCH" || error.code === "REQUIRED_DOCUMENT_DUPLICATE"
          ? 409
          : error.code === "REQUIRED_DOCUMENT_NOT_FOUND"
            ? 404
            : 400;
      return api.error(status, error.message, { code: error.code });
    }

    if (error instanceof CaseMatterConversionError) {
      return api.error(404, error.message, { code: error.code });
    }

    api.logError(error);
    return api.error(500, "Failed to update required document metadata.", {
      code: "PATCH_REQUIRED_DOCUMENT_METADATA_FAILED"
    });
  }
}
