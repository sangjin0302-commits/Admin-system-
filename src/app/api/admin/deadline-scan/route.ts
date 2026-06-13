import { createAdminRequestContext } from "@/lib/http/admin-api";
import { scanAndCreateDeadlineAlerts } from "@/lib/services/deadline-alert-generator";

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.deadline-scan.run");
  const url = new URL(request.url);
  const warnDaysRaw = url.searchParams.get("warnDays");
  const warnDays = warnDaysRaw ? Math.max(1, Math.min(180, Number(warnDaysRaw))) : undefined;

  try {
    const result = await scanAndCreateDeadlineAlerts({ warnDays });
    return api.ok({ ok: true, ...result });
  } catch (error) {
    api.logError(error);
    return api.error(500, "기한 스캔 실패", { code: "DEADLINE_SCAN_FAILED" });
  }
}
