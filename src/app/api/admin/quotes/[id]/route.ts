import { ZodError } from "zod";

import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  recalculateQuoteDraft,
  saveQuoteManualEdits,
  transitionQuoteStatus
} from "@/lib/services/quote-service";
import {
  recalculateQuoteSchema,
  saveQuoteManualEditsSchema,
  updateQuoteStatusSchema
} from "@/lib/validation/quote";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.quotes.patch");
  const { id } = await context.params;

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
    }
    const body =
      bodyResult.body && typeof bodyResult.body === "object" && !Array.isArray(bodyResult.body)
        ? bodyResult.body
        : {};

    if (body?.mode === "manual") {
      const payload = saveQuoteManualEditsSchema.parse(body);
      const quote = await saveQuoteManualEdits(id, payload);
      return api.ok({ ok: true, quote });
    }

    if (body?.mode === "status") {
      const payload = updateQuoteStatusSchema.parse(body);
      const quote = await transitionQuoteStatus(id, {
        status: payload.status,
        caseDueDate: payload.caseDueDate ? new Date(payload.caseDueDate) : undefined,
        caseInternalMemo: payload.caseInternalMemo
      });
      return api.ok({ ok: true, quote });
    }

    const recalculatePayload =
      body.mode === undefined ? { ...body, mode: "recalculate" } : body;
    const payload = recalculateQuoteSchema.parse(recalculatePayload);
    const quote = await recalculateQuoteDraft(id, payload);
    return api.ok({ ok: true, quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "입력값을 다시 확인해 주세요."), {
        code: "VALIDATION_ERROR"
      });
    }

    api.logError(error);
    return api.error(500, error instanceof Error ? error.message : "견적 정보를 수정하지 못했습니다.", {
      code: "PATCH_QUOTE_FAILED"
    });
  }
}
