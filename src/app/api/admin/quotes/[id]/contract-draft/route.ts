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
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create contract draft." },
      { status: 400 }
    );
  }
}
