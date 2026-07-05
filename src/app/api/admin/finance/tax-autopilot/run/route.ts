import { NextResponse } from "next/server";
import { generateTaxReportForMonth, setReportApproval } from "@/lib/services/tax-report-autopilot";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const ct = req.headers.get("content-type") ?? "";
    let year: number | undefined;
    let month: number | undefined;
    let reportId: string | undefined;
    let action: string | undefined;
    if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as { year?: number; month?: number; reportId?: string; action?: string };
      year = typeof body.year === "number" ? body.year : undefined;
      month = typeof body.month === "number" ? body.month : undefined;
      reportId = typeof body.reportId === "string" ? body.reportId : undefined;
      action = typeof body.action === "string" ? body.action : undefined;
    } else {
      const form = await req.formData();
      const y = form.get("year");
      const m = form.get("month");
      year = typeof y === "string" && y ? Number(y) : undefined;
      month = typeof m === "string" && m ? Number(m) : undefined;
      const rid = form.get("reportId");
      reportId = typeof rid === "string" ? rid : undefined;
      const act = form.get("action");
      action = typeof act === "string" ? act : undefined;
    }

    if (reportId && (action === "approve" || action === "reject")) {
      const updated = await setReportApproval(reportId, action === "approve" ? "approved" : "rejected");
      if (!ct.includes("application/json")) {
        return NextResponse.redirect(new URL("/admin/finance/tax-autopilot", req.url), 303);
      }
      return NextResponse.json({ ok: true, report: updated });
    }

    const report = await generateTaxReportForMonth(year, month);
    if (!ct.includes("application/json")) {
      return NextResponse.redirect(new URL("/admin/finance/tax-autopilot", req.url), 303);
    }
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    logger.error("[api/admin/finance/tax-autopilot/run] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
