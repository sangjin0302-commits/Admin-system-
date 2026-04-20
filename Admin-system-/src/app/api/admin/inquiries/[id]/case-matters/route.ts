import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  CaseMatterConversionError,
  convertInquiryToCaseMatter,
  listCaseMattersForInquiry
} from "@/lib/services/case-matter-service";
import { convertInquiryToCaseMatterSchema } from "@/lib/validation/case-matter";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.case-matters.get");
  const { id: rawId } = await context.params;
  const inquiryId = normalizeAdminEntityId(rawId);

  if (!inquiryId) {
    return api.error(400, "Invalid inquiry id format.", { code: "INVALID_INQUIRY_ID" });
  }

  try {
    const caseMatters = await listCaseMattersForInquiry(inquiryId);
    return api.ok({
      ok: true,
      inquiryId,
      count: caseMatters.length,
      caseMatters
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Failed to load case matters.", {
      code: "CASE_MATTERS_LIST_FAILED"
    });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.case-matters.post");
  const { id: rawId } = await context.params;
  const inquiryId = normalizeAdminEntityId(rawId);

  if (!inquiryId) {
    return api.error(400, "Invalid inquiry id format.", { code: "INVALID_INQUIRY_ID" });
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    const rawBody = bodyResult.ok
      ? bodyResult.body ?? {}
      : request.headers.get("content-length") === "0"
        ? {}
        : null;

    if (!rawBody) {
      return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
    }

    const payload = convertInquiryToCaseMatterSchema.parse(rawBody);
    const result = await convertInquiryToCaseMatter({
      inquiryId,
      ...payload
    });

    return api.ok(
      {
        ok: true,
        inquiryId,
        created: result.created,
        caseMatter: result.caseMatter,
        linkedQuoteId: result.linkedQuoteId,
        linkedContractDraftId: result.linkedContractDraftId
      },
      { status: result.created ? 201 : 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "Check request fields."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof CaseMatterConversionError) {
      return api.error(404, error.message, { code: error.code });
    }

    api.logError(error);
    return api.error(500, "Failed to convert inquiry into case matter.", {
      code: "CONVERT_CASE_MATTER_FAILED"
    });
  }
}

