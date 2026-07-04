import { createAdminRequestContext } from "@/lib/http/admin-api";
import { getMonthlyReport, getLast12MonthsTrend } from "@/lib/services/financial-report-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const api = createAdminRequestContext("admin.finance.report");
  const url = new URL(request.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year") ?? now.getUTCFullYear());
  const month = Number(url.searchParams.get("month") ?? now.getUTCMonth() + 1);
  const withTrend = url.searchParams.get("trend") === "1";

  if (!Number.isFinite(year) || year < 2000 || year > 3000) {
    return api.error(400, "year 형식 오류", { code: "BAD_YEAR" });
  }
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return api.error(400, "month 형식 오류", { code: "BAD_MONTH" });
  }

  try {
    const report = await getMonthlyReport(year, month);
    const trend = withTrend ? await getLast12MonthsTrend() : null;
    return api.ok({ ok: true, report, trend });
  } catch (error) {
    api.logError(error);
    return api.error(500, "재무 리포트 실패", { code: "FINANCE_REPORT_FAILED" });
  }
}
