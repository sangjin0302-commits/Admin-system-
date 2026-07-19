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
  const cronSecret = process.env.CRON_SECRET?.trim();
  // 시크릿이 비어 있으면 예전 코드는 검사 자체를 건너뛰어 누구나 실행할 수 있었다.
  // 미설정이면 무조건 거부한다.
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("job_queue"))) {
    return NextResponse.json({ ok: true, skipped: "flag_off" });
  }

  const r = await processBatch(10);
  logger.info("[cron:queue-worker]", r);
  return NextResponse.json({ ok: true, runAt: new Date().toISOString(), ...r });
}
