import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { runPriorityScoringBatch } from "@/lib/services/priority-scoring-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = await isFeatureEnabled("priority_scoring");
  if (!enabled) {
    logger.info("[cron/priority-scoring] feature disabled — skipping");
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }

  try {
    const result = await runPriorityScoringBatch();
    logger.info("[cron/priority-scoring] done", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("[cron/priority-scoring] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
