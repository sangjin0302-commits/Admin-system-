import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { scanRecentInquiries } from "@/lib/services/sentiment-analysis-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  // CRON_SECRET 이 비어 있으면 위 템플릿이 "Bearer undefined" 로 굳어져
  // 그 문자열을 보낸 아무나 통과한다. 미설정이면 무조건 거부한다.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const enabled = await isFeatureEnabled("sentiment_analysis");
  if (!enabled) {
    logger.info("[cron/sentiment-scan] feature disabled — skipping");
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }
  try {
    const result = await scanRecentInquiries(1);
    if (result.critical.length > 0) {
      await sendTelegramAlert({
        kind: "system",
        title: "감정분석 위험 신호",
        lines: [`Critical 감지 ${result.critical.length}건`, ...result.critical.slice(0, 5)],
      }).catch((err) => logger.warn("[cron/sentiment-scan] telegram alert failed", err));
    }
    logger.info("[cron/sentiment-scan] done", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("[cron/sentiment-scan] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
