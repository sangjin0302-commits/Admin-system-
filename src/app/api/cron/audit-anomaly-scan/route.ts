import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { runAuditAnomalyScan } from "@/lib/services/audit-anomaly-detector";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  // CRON_SECRET 이 비어 있으면 위 템플릿이 "Bearer undefined" 로 굳어져
  // 그 문자열을 보낸 아무나 통과한다. 미설정이면 무조건 거부한다.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const enabled = await isFeatureEnabled("audit_anomaly_ai");
  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }
  try {
    const result = await runAuditAnomalyScan();
    logger.info("[cron/audit-anomaly-scan] done", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("[cron/audit-anomaly-scan] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
