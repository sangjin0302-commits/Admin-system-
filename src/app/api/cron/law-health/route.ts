/**
 * 법제처 target 헬스체크 — weekly-batch 디스패처가 호출한다.
 * vercel.json 에 별도 crons 항목은 두지 않는다(배치 디스패처가 이미 돈다).
 */

import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { runLawHealthCheck } from "@/lib/services/law-health-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = await isFeatureEnabled("law_health_check");
  if (!enabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "law_health_check disabled"
    });
  }

  try {
    const report = await runLawHealthCheck();
    logger.info("[cron/law-health] done", {
      total: report.total,
      ok: report.ok,
      empty: report.empty,
      failed: report.failed,
      skipped: report.skipped
    });
    // report.ok(정상 target 수)가 봉투의 ok(성공 여부)와 이름이 겹쳐서 report로 감싼다.
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    logger.error("[cron/law-health] failed", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
