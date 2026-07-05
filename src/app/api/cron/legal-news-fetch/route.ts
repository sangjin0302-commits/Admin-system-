import { NextResponse } from "next/server";
import { fetchAndProcess } from "@/lib/services/legal-news-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const enabled = await isFeatureEnabled("legal_news_ai");
  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "legal_news_ai disabled" });
  }
  try {
    const result = await fetchAndProcess();
    logger.info("[cron/legal-news] done", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("[cron/legal-news] failed", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
