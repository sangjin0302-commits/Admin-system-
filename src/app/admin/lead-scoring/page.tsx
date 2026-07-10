import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getLeadScores } from "@/lib/services/lead-scoring-service";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

export default async function LeadScoringPage() {
  const enabled = await isFeatureEnabled("lead_scoring_dashboard");
  if (!enabled) return notFound();

  const report = await getLeadScores();

  const avgDaysOverall =
    report.channels.reduce((s, c) => s + c.avgDaysToWon * c.wonCount, 0) /
    (report.channels.reduce((s, c) => s + c.wonCount, 0) || 1);

  const topChannel = report.channels[0]?.channel;

  return (
    <div className="space-y-6">
      <AdminPageHeader kicker="Analytics" title="리드 스코링" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "총 문의", value: report.overall.totalInquiries.toLocaleString("ko-KR") },
          { label: "전체 수임률", value: `${report.overall.wonRate}%` },
          { label: "평균 수임 소요일", value: `${Math.round(avgDaysOverall)}일` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Channel Table */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">채널별 수임률</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">채널</th>
                <th className="px-4 py-3 text-right font-medium">문의 수</th>
                <th className="px-4 py-3 text-right font-medium">수임 수</th>
                <th className="px-4 py-3 text-right font-medium">수임률</th>
                <th className="px-4 py-3 text-right font-medium">평균 소요일</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.channels.map((ch) => (
                <tr
                  key={ch.channel}
                  className={ch.channel === topChannel ? "bg-yellow-50 dark:bg-yellow-900/20" : "hover:bg-muted/30"}
                >
                  <td className="px-4 py-3 font-medium">
                    {ch.channel}
                    {ch.channel === topChannel && (
                      <span className="ml-2 inline-block rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                        TOP
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{ch.inquiries}</td>
                  <td className="px-4 py-3 text-right">{ch.wonCount}</td>
                  <td className="px-4 py-3 text-right font-semibold">{ch.wonRate}%</td>
                  <td className="px-4 py-3 text-right">{ch.avgDaysToWon}일</td>
                </tr>
              ))}
              {report.channels.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">데이터 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Category Table */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">카테고리별 수임률</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">카테고리</th>
                <th className="px-4 py-3 text-right font-medium">문의 수</th>
                <th className="px-4 py-3 text-right font-medium">수임 수</th>
                <th className="px-4 py-3 text-right font-medium">수임률</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.keywords.map((kw) => (
                <tr key={kw.keyword} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                  <td className="px-4 py-3 text-right">{kw.inquiries}</td>
                  <td className="px-4 py-3 text-right">{kw.wonCount}</td>
                  <td className="px-4 py-3 text-right font-semibold">{kw.wonRate}%</td>
                </tr>
              ))}
              {report.keywords.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">데이터 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
