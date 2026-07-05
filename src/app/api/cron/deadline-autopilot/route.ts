import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { runDeadlineAutopilot } from "@/lib/services/deadline-autopilot";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = await isFeatureEnabled("deadline_autopilot");
  if (!enabled) {
    logger.info("[cron/deadline-autopilot] feature disabled - skipping");
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }

  try {
    const result = await runDeadlineAutopilot();
    logger.info("[cron/deadline-autopilot] done", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("[cron/deadline-autopilot] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
