import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { generateTaxReportForMonth } from "@/lib/services/tax-report-autopilot";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const enabled = await isFeatureEnabled("tax_report_autopilot");
  if (!enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }
  try {
    const report = await generateTaxReportForMonth();
    logger.info("[cron/tax-report-autopilot] generated", { id: report.id, year: report.year, month: report.month });
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    logger.error("[cron/tax-report-autopilot] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
