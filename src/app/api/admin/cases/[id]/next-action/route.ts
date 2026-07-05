import { NextResponse } from "next/server";
import { getNextAction, recordFeedback, type DecisionAction } from "@/lib/services/ai-decision-tree-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ACTIONS: DecisionAction[] = [
  "request_docs",
  "send_reminder",
  "schedule_meeting",
  "draft_document",
  "close_case",
  "escalate",
];

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const enabled = await isFeatureEnabled("ai_decision_tree");
  if (!enabled) return NextResponse.json({ result: null, disabled: true });
  try {
    const result = await getNextAction(id);
    return NextResponse.json({ result });
  } catch (err) {
    logger.error("[api/admin/cases/next-action GET] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as { action?: string; verdict?: string };
    const action = ALLOWED_ACTIONS.includes(body.action as DecisionAction) ? (body.action as DecisionAction) : null;
    const verdict = body.verdict === "accepted" || body.verdict === "rejected" ? body.verdict : null;
    if (!action || !verdict) {
      return NextResponse.json({ error: "action and verdict required" }, { status: 400 });
    }
    await recordFeedback(id, action, verdict);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[api/admin/cases/next-action POST] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
