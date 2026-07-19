import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { runReviewRequestBatch } from "@/lib/services/review-request-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  // CRON_SECRET 이 비어 있으면 위 템플릿이 "Bearer undefined" 로 굳어져
  // 그 문자열을 보낸 아무나 통과한다. 미설정이면 무조건 거부한다.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
