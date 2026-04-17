import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createQuoteDraftForInquiry } from "@/lib/services/quote-service";
import { createQuoteDraftSchema } from "@/lib/validation/quote";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    createQuoteDraftSchema.parse(await request.json().catch(() => ({})));
    const quote = await createQuoteDraftForInquiry(id);
    return NextResponse.json({ quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "견적 초안을 생성하지 못했습니다." },
      { status: 400 }
    );
  }
}
