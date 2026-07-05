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
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
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
