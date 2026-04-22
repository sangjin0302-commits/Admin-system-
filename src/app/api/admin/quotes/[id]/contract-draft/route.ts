import { ZodError } from "zod";

import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  createContractDraftFromQuote,
  QuoteContractDraftGuardError
} from "@/lib/services/quote-service";
import { createContractDraftSchema } from "@/lib/validation/quote";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.quotes.contract_draft.post");
  const { id } = await context.params;

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
    }

    createContractDraftSchema.parse(bodyResult.body ?? {});
    const quote = await createContractDraftFromQuote(id);
    return api.ok({ ok: true, quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "입력값을 다시 확인해 주세요."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof QuoteContractDraftGuardError) {
      return api.error(409, error.message, {
        code: error.code
      });
    }

    api.logError(error);
    return api.error(500, error instanceof Error ? error.message : "계약 초안을 생성하지 못했습니다.", {
      code: "CREATE_CONTRACT_DRAFT_FAILED"
    });
  }
}
