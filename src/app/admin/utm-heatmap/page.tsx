import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import { InquiryStatus } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";

type Cell = { source: string; medium: string; total: number; won: number; rate: number };

export default async function UtmHeatmapPage() {
  if (!(await isFeatureEnabled("utm_conversion_heatmap"))) notFound();

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const rows = await prisma.inquiry
    .findMany({
      where: { createdAt: { gte: since } },
      select: { intakeUtmSource: true, intakeUtmMedium: true, status: true },
    })
    .catch(() => []);

  const buckets = new Map<string, { total: number; won: number; source: string; medium: string }>();
  for (const r of rows) {
    const source = (r.intakeUtmSource ?? "direct").toLowerCase();
    const medium = (r.intakeUtmMedium ?? "none").toLowerCase();
    const key = `${source}||${medium}`;
    const b = buckets.get(key) ?? { total: 0, won: 0, source, medium };
    b.total += 1;
    if (r.status === InquiryStatus.WON) b.won += 1;
    buckets.set(key, b);
  }

  const cells: Cell[] = Array.from(buckets.values())
    .filter((b) => b.total >= 3)
    .map((b) => ({ ...b, rate: b.won / b.total }))
    .sort((a, b) => b.total - a.total);

  const sources = Array.from(new Set(cells.map((c) => c.source)));
  const mediums = Array.from(new Set(cells.map((c) => c.medium)));

  const bgFor = (rate: number, total: number) => {
    if (total < 3) return "bg-neutral-100";
    if (rate >= 0.3) return "bg-green-600 text-white";
    if (rate >= 0.15) return "bg-green-300";
    if (rate >= 0.05) return "bg-yellow-200";
    return "bg-red-200";
  };

  const cellFor = (source: string, medium: string) => cells.find((c) => c.source === source && c.medium === medium);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="UTM Heatmap"
        title="UTM 전환 heatmap"
        description="최근 90일 UTM source×medium 매트릭스 → WON 전환율 (최소 3건 이상 셀)"
      />

      <Card className="p-5 overflow-x-auto">
        {cells.length === 0 ? (
          <p className="text-sm text-text-muted">UTM 데이터 없음 (3건 이상 조합 없음).</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2">source \ medium</th>
                {mediums.map((m) => (
                  <th key={m} className="text-center p-2 font-mono">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s}>
                  <td className="p-2 font-mono font-medium">{s}</td>
                  {mediums.map((m) => {
                    const c = cellFor(s, m);
                    if (!c) return <td key={m} className="p-2 bg-neutral-50 text-center text-text-muted">-</td>;
                    return (
                      <td key={m} className={`p-2 text-center ${bgFor(c.rate, c.total)}`}>
                        <div className="font-bold">{(c.rate * 100).toFixed(0)}%</div>
                        <div className="text-[10px] opacity-75">{c.won}/{c.total}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker mb-3">상위 조합 (전체 총합순)</p>
        <table className="w-full text-sm">
          <thead className="text-xs text-text-muted">
            <tr>
              <th className="text-left py-2">Source</th>
              <th className="text-left py-2">Medium</th>
              <th className="text-right py-2">문의</th>
              <th className="text-right py-2">WON</th>
              <th className="text-right py-2">전환율</th>
            </tr>
          </thead>
          <tbody>
            {cells.slice(0, 20).map((c) => (
              <tr key={`${c.source}||${c.medium}`} className="border-t border-line">
                <td className="py-2 font-mono">{c.source}</td>
                <td className="py-2 font-mono">{c.medium}</td>
                <td className="text-right">{c.total}</td>
                <td className="text-right">{c.won}</td>
                <td className="text-right font-medium">{(c.rate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
