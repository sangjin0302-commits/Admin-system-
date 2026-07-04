import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { runReviewRequestBatch } from "@/lib/services/review-request-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = await isFeatureEnabled("review_automation");
  if (!enabled) {
    logger.info("[cron/review-request] feature disabled — skipping");
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }

  try {
    const result = await runReviewRequestBatch();
    logger.info("[cron/review-request] done", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("[cron/review-request] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
