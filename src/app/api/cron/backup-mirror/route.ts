/**
 * Vercel Cron — 매일 03:00 백업 미러 전체 동기화.
 *
 * 기능 플래그 `backup_mirror`가 켜져 있고 config.enabled=true인 경우에만 실행.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { runFullSync } from "@/lib/services/backup-mirror-service";

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

  if (!(await isFeatureEnabled("backup_mirror"))) {
    return NextResponse.json({ ok: true, skipped: "flag_off" });
  }

  const r = await runFullSync();
  logger.info("[cron:backup-mirror]", { ok: r.ok, count: r.count, error: r.error });
  return NextResponse.json({ ok: r.ok, runAt: new Date().toISOString(), count: r.count, error: r.error });
}
