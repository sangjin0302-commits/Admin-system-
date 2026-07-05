import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getSummary,
  type AggregatedMetric,
} from "@/lib/services/ai-metrics-service";

export const dynamic = "force-dynamic";

export default async function AIMetricsPage() {
  const [today, week] = await Promise.all([getSummary(24), getSummary(24 * 30)]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Learning"
        title="AI 모델 성능 대시보드"
        description="함수·모델별 호출 통계 (지연·비용·성공률). 최근 7일 시간당 버킷 유지."
      />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">오늘 (최근 24시간)</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <KPI label="총 호출" value={today.total.calls.toLocaleString()} />
          <KPI label="총 비용" value={`$${today.total.costUsd.toFixed(4)}`} />
          <KPI label="평균 지연" value={`${today.total.avgLatencyMs.toFixed(0)}ms`} />
          <KPI label="오류율" value={`${(today.total.errorRate * 100).toFixed(2)}%`} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">함수별 (24h)</h2>
        <Table metrics={today.byFunction} keyLabel="function" />
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">모델별 (24h)</h2>
        <Table metrics={today.byModel} keyLabel="model" />
        <div className="mt-4">
          <PieChart data={today.byModel} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">비용 추이 (최근 30일)</h2>
        <div className="mt-4 overflow-x-auto">
          <TrendChart byDay={week.byDay} />
        </div>
      </Card>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Table({
  metrics,
  keyLabel,
}: {
  metrics: Record<string, AggregatedMetric>;
  keyLabel: string;
}) {
  const rows = Object.entries(metrics).sort((a, b) => b[1].calls - a[1].calls);
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-text-muted">데이터가 없습니다.</p>;
  }
  return (
    <table className="mt-3 w-full text-xs">
      <thead className="text-text-muted">
        <tr className="text-left">
          <th className="py-1">{keyLabel}</th>
          <th className="py-1">호출</th>
          <th className="py-1">토큰 in/out</th>
          <th className="py-1">지연</th>
          <th className="py-1">비용</th>
          <th className="py-1">오류율</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([k, m]) => (
          <tr key={k} className="border-t border-line">
            <td className="py-1 font-mono">{k}</td>
            <td className="py-1">{m.calls.toLocaleString()}</td>
            <td className="py-1">
              {m.inputTokens.toLocaleString()} / {m.outputTokens.toLocaleString()}
            </td>
            <td className="py-1">{m.avgLatencyMs.toFixed(0)}ms</td>
            <td className="py-1">${m.costUsd.toFixed(4)}</td>
            <td className="py-1">{(m.errorRate * 100).toFixed(2)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TrendChart({
  byDay,
}: {
  byDay: Array<{ day: string; metric: AggregatedMetric }>;
}) {
  if (byDay.length === 0) return <p className="text-sm text-text-muted">데이터가 없습니다.</p>;
  const w = Math.max(400, byDay.length * 30);
  const h = 160;
  const pad = 24;
  const max = Math.max(...byDay.map((d) => d.metric.costUsd), 0.0001);
  const points = byDay
    .map((d, i) => {
      const x = pad + (i / Math.max(byDay.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (d.metric.costUsd / max) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="max-w-full">
      <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2" />
      {byDay.map((d, i) => {
        const x = pad + (i / Math.max(byDay.length - 1, 1)) * (w - pad * 2);
        const y = h - pad - (d.metric.costUsd / max) * (h - pad * 2);
        return <circle key={d.day} cx={x} cy={y} r="2" fill="#4f46e5" />;
      })}
      <text x={pad} y={h - 4} className="text-xs" fontSize="10" fill="#64748b">
        {byDay[0].day}
      </text>
      <text x={w - pad - 60} y={h - 4} fontSize="10" fill="#64748b">
        {byDay[byDay.length - 1].day}
      </text>
      <text x={4} y={12} fontSize="10" fill="#64748b">
        ${max.toFixed(4)}
      </text>
    </svg>
  );
}

function PieChart({ data }: { data: Record<string, AggregatedMetric> }) {
  const entries = Object.entries(data)
    .map(([k, v]) => ({ k, calls: v.calls }))
    .filter((e) => e.calls > 0);
  const total = entries.reduce((s, e) => s + e.calls, 0);
  if (total === 0) return null;
  const colors = ["#4f46e5", "#059669", "#ea580c", "#db2777", "#0891b2", "#7c3aed"];
  let acc = 0;
  const cx = 60;
  const cy = 60;
  const r = 50;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" width="120" height="120">
        {entries.map((e, i) => {
          const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
          acc += e.calls;
          const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + r * Math.cos(start);
          const y1 = cy + r * Math.sin(start);
          const x2 = cx + r * Math.cos(end);
          const y2 = cy + r * Math.sin(end);
          const large = end - start > Math.PI ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
          return <path key={e.k} d={d} fill={colors[i % colors.length]} />;
        })}
      </svg>
      <ul className="text-xs">
        {entries.map((e, i) => (
          <li key={e.k} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="font-mono">{e.k}</span>
            <span className="text-text-muted">{((e.calls / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
