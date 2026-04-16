import { NextResponse } from "next/server";
import { ZodError } from "zod";

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
  const { id } = await context.params;

  try {
    const body = await request.json();

    if (body?.mode === "manual") {
      const payload = saveQuoteManualEditsSchema.parse(body);
      const quote = await saveQuoteManualEdits(id, payload);
      return NextResponse.json({ quote });
    }

    if (body?.mode === "status") {
      const payload = updateQuoteStatusSchema.parse(body);
      const quote = await transitionQuoteStatus(id, {
        status: payload.status,
        caseDueDate: payload.caseDueDate ? new Date(payload.caseDueDate) : undefined,
        caseInternalMemo: payload.caseInternalMemo
      });
      return NextResponse.json({ quote });
    }

    const payload = recalculateQuoteSchema.parse(body);
    const quote = await recalculateQuoteDraft(id, payload);
    return NextResponse.json({ quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "견적 정보를 수정하지 못했습니다." },
      { status: 400 }
    );
  }
}
