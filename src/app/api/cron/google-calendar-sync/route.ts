/**
 * Vercel Cron — Google Calendar 자동 동기 (1시간 간격 권장).
 * vercel.json crons 에 등록.
 */

import { NextResponse } from "next/server";
import { syncToGoogleCalendar } from "@/lib/services/google-calendar-sync-service";
import { logger } from "@/lib/utils/logger";

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

  try {
    const result = await syncToGoogleCalendar();
    logger.debug("[cron:google-cal-sync]", result);
    return NextResponse.json({ runAt: new Date().toISOString(), ...result });
  } catch (error) {
    logger.error("[cron:google-cal-sync] failed", error);
    return NextResponse.json({ ok: false, error: "sync failed" }, { status: 500 });
  }
}
