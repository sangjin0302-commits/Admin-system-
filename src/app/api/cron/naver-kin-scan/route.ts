/**
 * 하루 2회 (KST 10시/16시 → UTC 01, 07) 네이버 지식iN 피드 스캔.
 */

import { NextResponse } from "next/server";
import { scanFeeds } from "@/lib/services/naver-kin-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isFeatureEnabled("naver_kin_auto_answer"))) {
    return NextResponse.json({ ok: false, skipped: "flag_disabled" });
  }
  try {
    const result = await scanFeeds();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    logger.error("[cron naver-kin-scan] 실패", err);
    return NextResponse.json({ ok: false, error: "scan_failed" }, { status: 500 });
  }
}
