import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getAllPricing, type OptimalPricing, type PricePoint } from "@/lib/services/pricing-optimizer-service";

export const dynamic = "force-dynamic";

function fmtWon(n: number): string {
  if (!n) return "-";
  const man = Math.round(n / 10000);
  return `${man.toLocaleString("ko-KR")}만원`;
}

function AcceptanceCurve({ curve }: { curve: PricePoint[] }) {
  if (curve.length < 2) {
    return <p className="text-xs text-text-muted">표본이 부족해 곡선을 그릴 수 없습니다.</p>;
  }
  const W = 320;
  const H = 100;
  const pad = 8;
  const minX = Math.min(...curve.map((c) => c.priceBand));
  const maxX = Math.max(...curve.map((c) => c.priceBand));
  const rangeX = Math.max(1, maxX - minX);
  const scaleX = (x: number) => pad + ((x - minX) / rangeX) * (W - pad * 2);
  const scaleY = (r: number) => H - pad - r * (H - pad * 2);

  const pathD = curve
    .map((p, i) => `${i === 0 ? "M" : "L"}${scaleX(p.priceBand).toFixed(1)},${scaleY(p.acceptanceRate).toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <path d={pathD} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-primary" />
      {curve.map((p, i) => (
        <circle
          key={i}
          cx={scaleX(p.priceBand)}
          cy={scaleY(p.acceptanceRate)}
          r={2.5}
          className="fill-primary"
        />
      ))}
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} className="stroke-line" strokeWidth={0.5} />
    </svg>
  );
}

function CategoryCard({ data }: { data: OptimalPricing }) {
  const delta = data.currentAvgQuote ? Math.round(((data.sweetSpot - data.currentAvgQuote) / data.currentAvgQuote) * 100) : 0;
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-text-strong">{data.category}</h3>
        <span className="text-xs text-text-muted">표본 {data.sampleSize}건</span>
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-xs text-text-muted">권장 견적</span>
        <span className="text-2xl font-bold text-gold-deep">{fmtWon(data.sweetSpot)}</span>
      </div>

      <p className="mt-1 text-xs text-text-muted">
        현재 평균 {fmtWon(data.currentAvgQuote)} 대비{" "}
        <span className={delta >= 0 ? "text-green-700" : "text-red-700"}>
          {delta >= 0 ? "+" : ""}
          {delta}%
        </span>
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-surface-muted/50 p-2">
          <p className="text-text-muted">최저</p>
          <p className="mt-0.5 font-semibold">{fmtWon(data.min)}</p>
        </div>
        <div className="rounded-md bg-gold/10 p-2">
          <p className="text-text-muted">Sweet Spot</p>
          <p className="mt-0.5 font-semibold">{fmtWon(data.sweetSpot)}</p>
        </div>
        <div className="rounded-md bg-surface-muted/50 p-2">
          <p className="text-text-muted">최고</p>
          <p className="mt-0.5 font-semibold">{fmtWon(data.max)}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-text-muted">수락률 곡선 (가격 → 수락률)</p>
        <div className="mt-1">
          <AcceptanceCurve curve={data.acceptanceCurve} />
        </div>
      </div>
    </Card>
  );
}

export default async function AdminPricingPage() {
  const env = await getAllPricing();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="인사이트 · 가격 최적화"
        title="가격 최적화 AI"
        description={`카테고리별 견적 수락률 히스토그램에서 기대 매출을 최대화하는 sweet spot 을 제안합니다. 갱신 ${new Date(env.updatedAt).toLocaleString("ko-KR")}`}
      />

      {env.perCategory.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-muted">
          분석 가능한 견적 이력이 부족합니다 (카테고리당 최소 5건 필요).
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {env.perCategory.map((d) => (
            <CategoryCard key={d.category} data={d} />
          ))}
        </div>
      )}
    </div>
  );
}
