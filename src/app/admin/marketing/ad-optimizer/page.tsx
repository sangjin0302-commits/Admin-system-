import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { generateReport, getCampaignSpend } from "@/lib/services/ad-optimizer-service";
import { normalizeDateRange } from "@/lib/services/utm-tracking-service";
import { AdOptimizerClient } from "./ad-optimizer-client";

export const dynamic = "force-dynamic";

export default async function AdOptimizerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rangeParam = typeof params.range === "string" ? params.range : undefined;
  const range = normalizeDateRange(rangeParam);
  const report = await generateReport(range);

  // Load recent spend cells for each campaign (last 8 weeks).
  const now = new Date();
  const mondays: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    // snap to Monday (UTC-safe rough)
    const day = d.getUTCDay(); // 0=Sun,1=Mon
    const diff = (day + 6) % 7;
    d.setUTCDate(d.getUTCDate() - diff);
    d.setUTCHours(0, 0, 0, 0);
    mondays.push(d.toISOString().slice(0, 10));
  }

  const spendMap: Record<string, Record<string, number>> = {};
  await Promise.all(
    report.rows.map(async (r) => {
      const entries = await getCampaignSpend(r.campaign);
      const byWeek: Record<string, number> = {};
      for (const e of entries) byWeek[e.weekStart.slice(0, 10)] = e.amount;
      spendMap[r.campaign] = byWeek;
    }),
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing"
        title="광고 자동 최적화"
        description="UTM 데이터와 수동 입력 광고비를 기반으로 CPA·전환율·ROAS 를 계산하고 캠페인별 조정 권장을 제시합니다."
      />

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <div className="text-text-muted">기간 (일)</div>
            <div className="mt-1 text-lg font-semibold text-text-strong">{report.rangeDays}</div>
          </div>
          <div>
            <div className="text-text-muted">총 의뢰</div>
            <div className="mt-1 text-lg font-semibold text-text-strong">
              {report.totals.inquiries}
            </div>
          </div>
          <div>
            <div className="text-text-muted">총 지출 (₩)</div>
            <div className="mt-1 text-lg font-semibold text-text-strong">
              {report.totals.spend.toLocaleString("ko-KR")}
            </div>
          </div>
          <div>
            <div className="text-text-muted">평균 CPA (₩)</div>
            <div className="mt-1 text-lg font-semibold text-text-strong">
              {report.totals.avgCpa.toLocaleString("ko-KR")}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-text-strong">AI 추천 (Top 5)</h3>
        {report.recommendations.length === 0 ? (
          <p className="mt-2 text-xs text-text-muted">캠페인 데이터가 부족합니다.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-xs">
            {report.recommendations.map((rec, i) => (
              <li
                key={`${rec.campaign}-${i}`}
                className="flex items-start gap-2 rounded border border-border bg-white p-3"
              >
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
                    rec.action === "increase"
                      ? "bg-success/10 text-success"
                      : rec.action === "decrease"
                        ? "bg-red-100 text-red-700"
                        : rec.action === "test"
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-muted text-text-muted"
                  }`}
                >
                  {rec.action === "increase"
                    ? "증액"
                    : rec.action === "decrease"
                      ? "감액"
                      : rec.action === "test"
                        ? "테스트"
                        : "유지"}
                </span>
                <span className="text-text-strong">{rec.message}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AdOptimizerClient report={report} spendMap={spendMap} weeks={mondays} />
    </div>
  );
}
