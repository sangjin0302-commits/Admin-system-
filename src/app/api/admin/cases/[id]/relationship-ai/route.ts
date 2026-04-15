import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { generateRelationshipAssistantDraft } from "@/lib/ai/openai-relationship-draft";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await requireAdminApiSession("STAFF");
    const draft = await generateRelationshipAssistantDraft(id);
    return NextResponse.json({ draft });
  } catch (error) {
    return authErrorResponse(error, "Failed to generate AI relationship draft.");
  }
}
