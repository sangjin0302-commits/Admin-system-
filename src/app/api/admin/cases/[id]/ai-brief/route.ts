import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { generateCaseAssistantBrief } from "@/lib/ai/openai-case-brief";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await requireAdminApiSession("STAFF");
    const brief = await generateCaseAssistantBrief(id);
    return NextResponse.json({ brief });
  } catch (error) {
    return authErrorResponse(error, "Failed to generate AI case brief.");
  }
}
