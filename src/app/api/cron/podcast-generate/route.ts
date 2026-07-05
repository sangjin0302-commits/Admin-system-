/**
 * 매주 수요일 06:00 KST (UTC 화 21:00) 팟캐스트 자동 생성.
 * vercel.json 등록: "0 21 * * 2"
 */

import { NextResponse } from "next/server";
import { generateWeeklyEpisode } from "@/lib/services/podcast-generator-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isFeatureEnabled("podcast_series"))) {
    return NextResponse.json({ ok: false, skipped: "flag_disabled" });
  }
  try {
    const result = await generateWeeklyEpisode();
    if (!result.ok) return NextResponse.json({ ok: false, reason: result.reason });
    return NextResponse.json({
      ok: true,
      created: result.created,
      episodeId: result.episode.id,
      tts: result.episode.tts,
    });
  } catch (err) {
    logger.error("[cron podcast-generate] 실패", err);
    return NextResponse.json({ ok: false, error: "generate_failed" }, { status: 500 });
  }
}
