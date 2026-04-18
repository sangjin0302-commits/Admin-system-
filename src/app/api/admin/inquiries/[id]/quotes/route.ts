import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import { createQuoteDraftForInquiry } from "@/lib/services/quote-service";
import { createQuoteDraftSchema } from "@/lib/validation/quote";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.quotes.post");
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

    createQuoteDraftSchema.parse(bodyResult.body ?? {});
    const quote = await createQuoteDraftForInquiry(id);
    return api.ok({ ok: true, quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(
        400,
        firstZodMessage(error, "\uC785\uB825\uAC12\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694."),
        { code: "VALIDATION_ERROR" }
      );
    }

    api.logError(error);
    return api.error(
      500,
      error instanceof Error
        ? error.message
        : "\uACAC\uC801 \uCD08\uC548\uC744 \uC0DD\uC131\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
      { code: "CREATE_QUOTE_FAILED" }
    );
  }
}
