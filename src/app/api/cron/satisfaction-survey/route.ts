import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { processScheduledSurveys } from "@/lib/services/satisfaction-survey-service";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET?.trim();
  // CRON_SECRET 이 비어 있으면 위 템플릿이 "Bearer undefined" 로 굳어져
  // 그 문자열을 보낸 아무나 통과한다. 미설정이면 무조건 거부한다.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enabled = await isFeatureEnabled("satisfaction_survey_auto");
    if (!enabled) {
      return NextResponse.json({ skipped: true, reason: "feature disabled" });
    }

    const result = await processScheduledSurveys();
    logger.info(`Satisfaction survey cron: sent=${result.sent}, skipped=${result.skipped}`);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("Satisfaction survey cron error:", err);
    return NextResponse.json({ error: "설문 발송 실패" }, { status: 500 });
  }
}
