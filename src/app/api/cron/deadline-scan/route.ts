/**
 * Vercel Cron — 매일 자동 기한 점검
 * vercel.json 의 crons 에 등록.
 * Vercel은 Authorization: Bearer <CRON_SECRET> 헤더를 보내므로 검증.
 */

import { NextResponse } from "next/server";

import { scanAndCreateDeadlineAlerts } from "@/lib/services/deadline-alert-generator";

export async function GET(request: Request) {
  // 인증 — Vercel Cron은 Bearer <CRON_SECRET>
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected) {
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await scanAndCreateDeadlineAlerts({ warnDays: 14 });
    console.log("[cron:deadline-scan]", result);
    return NextResponse.json({ ok: true, runAt: new Date().toISOString(), ...result });
  } catch (error) {
    console.error("[cron:deadline-scan] failed", error);
    return NextResponse.json({ ok: false, error: "scan failed" }, { status: 500 });
  }
}
