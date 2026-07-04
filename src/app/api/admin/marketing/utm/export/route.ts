import {
  getUtmDashboard,
  normalizeDateRange,
  utmDashboardToCsv
} from "@/lib/services/utm-tracking-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = normalizeDateRange(url.searchParams.get("range") ?? undefined);
  const dashboard = await getUtmDashboard(range);
  const csv = utmDashboardToCsv(dashboard);
  const filename = `utm-dashboard-${range}d-${dashboard.to.toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
