import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { checkAndMaybeRollback } from "@/lib/services/auto-rollback-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const enabled = await isFeatureEnabled("auto_rollback");
  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }
  try {
    const result = await checkAndMaybeRollback();
    logger.info("[cron/auto-rollback-check] done", { result });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("[cron/auto-rollback-check] 실패", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
