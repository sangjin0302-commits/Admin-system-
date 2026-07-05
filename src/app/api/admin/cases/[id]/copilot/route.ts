import { NextResponse } from "next/server";

import { getContextualAdvice } from "@/lib/services/case-copilot-service";
import { logger } from "@/lib/utils/logger";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: { message?: string } = {};
  try {
    body = (await req.json()) as { message?: string };
  } catch {
    // ignore
  }
  const message = (body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "message 필요" }, { status: 400 });

  try {
    const advice = await getContextualAdvice(id, message);
    return NextResponse.json(advice);
  } catch (err) {
    logger.error("[copilot] POST failed", err);
    return NextResponse.json({ error: "copilot 실패" }, { status: 500 });
  }
}
