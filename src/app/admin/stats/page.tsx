import { Card } from "@/components/ui/card";
import {
  buildAccountingSummary,
  buildCategoryStats,
  buildMonthlyStats
} from "@/lib/services/admin-stats";

export const dynamic = "force-dynamic";

const KRW = new Intl.NumberFormat("ko-KR");

export default async function AdminStatsPage() {
  const [monthly, byCategory, accounting] = await Promise.all([
    buildMonthlyStats(),
    buildCategoryStats(),
    buildAccountingSummary()
  ]);

  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenueWon));
  const maxCases = Math.max(1, ...monthly.map((m) => Math.max(m.newCases, m.newInquiries)));
  const totalCategory = Math.max(1, byCategory.reduce((s, c) => s + c.total, 0));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Analytics</p>
        <h2 className="mt-2 ui-page-title">사무소 통계 / 재무</h2>
        <p className="mt-2 text-sm text-text-muted">최근 12개월 추이와 카테고리·결제 현황 요약.</p>
      </Card>

      {/* 회계 요약 */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat title="견적 합계" value={`${KRW.format(accounting.feeTotal)}원`} />
        <Stat title="입금 합계" value={`${KRW.format(accounting.paidTotal)}원`} />
        <Stat title="미수 건수" value={accounting.unpaidCount} />
        <Stat title="완납 건수" value={accounting.paidCount} />
      </div>

      {/* 월별 매출 막대 차트 */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-text-strong">월별 매출 (₩)</h3>
        <div className="mt-5 space-y-2">
          {monthly.map((m) => (
            <div key={m.month} className="grid grid-cols-[80px_1fr_100px] items-center gap-3">
              <span className="text-xs font-semibold text-text-muted">{m.month}</span>
              <div className="h-5 overflow-hidden rounded bg-surface-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round((m.revenueWon / maxRevenue) * 100)}%` }}
                />
              </div>
              <span className="text-right text-xs font-medium text-text">
                {KRW.format(m.revenueWon)}원
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 월별 문의 + 사건 */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-text-strong">월별 문의 / 사건</h3>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">월</th>
                <th className="px-3 py-2 font-semibold">문의</th>
                <th className="px-3 py-2 font-semibold">신규 사건</th>
                <th className="px-3 py-2 font-semibold">종결 사건</th>
                <th className="px-3 py-2 font-semibold">매출 (₩)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {monthly.map((m) => (
                <tr key={m.month}>
                  <td className="px-3 py-2 font-medium text-text-strong">{m.month}</td>
                  <td className="px-3 py-2">{m.newInquiries}</td>
                  <td className="px-3 py-2">{m.newCases}</td>
                  <td className="px-3 py-2">{m.closedCases}</td>
                  <td className="px-3 py-2">{KRW.format(m.revenueWon)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          ※ 막대 비교 기준 — 최대값 = {KRW.format(maxRevenue)}원, 사건 최대 = {maxCases}
        </p>
      </Card>

      {/* 카테고리 분포 */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-text-strong">카테고리 분포</h3>
        <div className="mt-5 space-y-3">
          {byCategory.map((c) => {
            const pct = Math.round((c.total / totalCategory) * 100);
            return (
              <div key={c.category}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-text-strong">{c.label}</p>
                  <p className="text-xs text-text-muted">
                    총 {c.total} (진행 {c.active} / 종결 {c.closed}) · {pct}%
                  </p>
                </div>
                <div className="mt-1 flex h-3 overflow-hidden rounded bg-surface-muted">
                  <div className="bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold text-text-muted">{title}</p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </Card>
  );
}
