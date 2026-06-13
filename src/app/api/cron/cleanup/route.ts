/**
 * Vercel Cron — 주 1회 정리 작업.
 */

import { NextResponse } from "next/server";

import { runCleanup } from "@/lib/services/cleanup-service";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runCleanup();
    console.log("[cron:cleanup]", result);
    return NextResponse.json({ ok: true, runAt: new Date().toISOString(), ...result });
  } catch (error) {
    console.error("[cron:cleanup] failed", error);
    return NextResponse.json({ ok: false, error: "cleanup failed" }, { status: 500 });
  }
}
