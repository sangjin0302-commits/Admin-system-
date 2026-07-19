/**
 * Vercel Cron — 매일 오전 6시 자율 마케팅 결정 사이클 실행.
 */

import { NextResponse } from "next/server";

import { runDecisionCycle } from "@/lib/services/auto-marketing-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
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

  const enabled = await isFeatureEnabled("auto_marketing_campaign");
  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feature disabled" });
  }

  try {
    const result = await runDecisionCycle();
    logger.debug("[cron:auto-marketing]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.debug("[cron:auto-marketing] failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "cycle failed" }, { status: 500 });
  }
}
