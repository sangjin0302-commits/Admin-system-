/**
 * Vercel Cron — 매분 큐 워커. 최대 10건 처리.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { processBatch } from "@/lib/services/job-queue-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("job_queue"))) {
    return NextResponse.json({ ok: true, skipped: "flag_off" });
  }

  const r = await processBatch(10);
  logger.info("[cron:queue-worker]", r);
  return NextResponse.json({ ok: true, runAt: new Date().toISOString(), ...r });
}
