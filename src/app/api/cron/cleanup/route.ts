/**
 * Vercel Cron — 주 1회 정리 작업.
 */

import { NextResponse } from "next/server";

import { runCleanup } from "@/lib/services/cleanup-service";
import { logger } from "@/lib/utils/logger";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  // 시크릿이 비어 있으면 예전 코드는 검사 자체를 건너뛰어 누구나 실행할 수 있었다.
  // 미설정이면 무조건 거부한다.
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runCleanup();
    logger.debug("[cron:cleanup]", result);
    return NextResponse.json({ ok: true, runAt: new Date().toISOString(), ...result });
  } catch (error) {
    logger.error("[cron:cleanup] failed", error);
    return NextResponse.json({ ok: false, error: "cleanup failed" }, { status: 500 });
  }
}
