import { NextResponse } from "next/server";
import { runAutoPromote } from "@/lib/services/ab-auto-promote-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const enabled = await isFeatureEnabled("ab_auto_promote");
  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "ab_auto_promote disabled" });
  }
  try {
    const result = await runAutoPromote();
    logger.info("[cron/ab-auto-promote] done", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("[cron/ab-auto-promote] failed", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
