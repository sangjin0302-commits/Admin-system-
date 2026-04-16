import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createContractDraftFromQuote } from "@/lib/services/quote-service";
import { createContractDraftSchema } from "@/lib/validation/quote";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    createContractDraftSchema.parse(await request.json().catch(() => ({})));
    const quote = await createContractDraftFromQuote(id);
    return NextResponse.json({ quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "계약 초안을 생성하지 못했습니다." },
      { status: 400 }
    );
  }
}
