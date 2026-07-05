/**
 * 매일 07:00 (KST) 오디오 브리핑 자동 생성 (Vercel Cron UTC 22:00).
 */

import { NextResponse } from "next/server";
import { generateBriefing } from "@/lib/services/audio-briefing-service";
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

  if (!(await isFeatureEnabled("audio_briefing"))) {
    return NextResponse.json({ ok: false, skipped: "flag_disabled" });
  }

  try {
    const record = await generateBriefing(undefined, true);
    return NextResponse.json({
      ok: true,
      date: record.date,
      tts: record.tts,
      audioUrl: record.audioUrl,
      stats: record.stats,
    });
  } catch (err) {
    logger.error("[cron audio-briefing] 실패", err);
    return NextResponse.json({ ok: false, error: "regen_failed" }, { status: 500 });
  }
}
