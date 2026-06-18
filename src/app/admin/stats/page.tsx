import { Card } from "@/components/ui/card";
import { RevenueChart, CasesChart, CategoryPieChart } from "@/components/admin/stats-charts";
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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Analytics</p>
        <h2 className="mt-2 ui-page-title">사무소 통계 / 재무</h2>
        <p className="mt-2 text-sm text-text-muted">최근 12개월 추이와 카테고리·결제 현황 요약.</p>
      </Card>

      {/* 회계 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="견적 합계" value={`${KRW.format(accounting.feeTotal)}원`} accent="primary" />
        <StatCard title="입금 합계" value={`${KRW.format(accounting.paidTotal)}원`} accent="success" />
        <StatCard title="미수 건수" value={accounting.unpaidCount} accent="warning" />
        <StatCard title="완납 건수" value={accounting.paidCount} accent="success" />
      </div>

      {/* 매출 추이 — Area Chart */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-text-strong">월별 매출 추이 (₩)</h3>
        <div className="mt-4">
          <RevenueChart data={monthly} />
        </div>
      </Card>

      {/* 문의/사건 — Bar Chart */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-text-strong">월별 문의 / 사건</h3>
        <div className="mt-4">
          <CasesChart data={monthly} />
        </div>
      </Card>

      {/* 카테고리 분포 — Donut Chart */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-text-strong">카테고리 분포</h3>
        <div className="mt-4">
          <CategoryPieChart data={byCategory} />
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent
}: {
  title: string;
  value: string | number;
  accent: "primary" | "success" | "warning";
}) {
  const accentColors = {
    primary: "border-l-primary",
    success: "border-l-success",
    warning: "border-l-warning"
  };
  return (
    <Card className={`border-l-4 ${accentColors[accent]} p-5`}>
      <p className="text-xs font-semibold text-text-muted">{title}</p>
      <p className="mt-2 text-2xl font-bold text-text-strong">{value}</p>
    </Card>
  );
}
