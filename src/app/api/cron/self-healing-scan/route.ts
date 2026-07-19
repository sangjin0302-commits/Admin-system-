/**
 * Vercel Cron — 15분마다 최근 에러 스캔 후 알려진 안전 복구 자동 적용.
 */

import { NextResponse } from "next/server";

import { scanAndHeal } from "@/lib/services/self-healing-service";
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

  const enabled = await isFeatureEnabled("self_healing");
  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feature disabled" });
  }

  try {
    const result = await scanAndHeal();
    logger.debug("[cron:self-healing-scan]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.debug("[cron:self-healing-scan] failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "scan failed" }, { status: 500 });
  }
}
