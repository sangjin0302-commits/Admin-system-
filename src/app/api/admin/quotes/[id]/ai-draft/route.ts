import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { generateQuoteAssistantDraft } from "@/lib/ai/openai-quote-draft";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await requireAdminApiSession("STAFF");
    const draft = await generateQuoteAssistantDraft(id);
    return NextResponse.json({ draft });
  } catch (error) {
    return authErrorResponse(error, "Failed to generate AI quote draft.");
  }
}
