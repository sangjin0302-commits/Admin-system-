import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { computeJourneyReport } from "@/lib/services/customer-journey-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const api = createAdminRequestContext("admin.insights.journey.get");
  if (!(await isFeatureEnabled("customer_journey"))) {
    return api.error(403, "기능이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  try {
    const url = new URL(request.url);
    const fromRaw = url.searchParams.get("from");
    const toRaw = url.searchParams.get("to");
    const category = url.searchParams.get("category") ?? undefined;
    const fromDate = fromRaw ? new Date(fromRaw) : undefined;
    const toDate = toRaw ? new Date(toRaw) : undefined;
    const report = await computeJourneyReport({ fromDate, toDate, category });
    return api.ok({ ok: true, report });
  } catch (err) {
    api.logError(err);
    return api.error(500, "여정 리포트 실패", { code: "JOURNEY_REPORT_FAILED" });
  }
}
