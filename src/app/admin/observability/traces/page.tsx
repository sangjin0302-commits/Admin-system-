import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRecentTraces, type Span } from "@/lib/services/tracing-service";

export const dynamic = "force-dynamic";

type SearchParams = { [k: string]: string | string[] | undefined };

export default async function TracesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const nameFilter = typeof sp.name === "string" ? sp.name : undefined;
  const minMs = typeof sp.minMs === "string" ? Number(sp.minMs) : undefined;
  const traces = await getRecentTraces(200, { nameFilter, minDurationMs: minMs });

  // 트레이스별 그룹핑
  const byTrace = new Map<string, Span[]>();
  for (const s of traces) {
    const arr = byTrace.get(s.traceId) ?? [];
    arr.push(s);
    byTrace.set(s.traceId, arr);
  }
  const traceIds = Array.from(byTrace.keys()).slice(0, 40);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Observability"
        title="분산 트레이싱"
        description="최근 스팬 워터폴. distributed_tracing 플래그로 수집 여부 제어."
      />
      <Card className="p-4">
        <form className="flex flex-wrap gap-2 text-sm" method="get">
          <input
            name="name"
            defaultValue={nameFilter ?? ""}
            placeholder="스팬 이름 필터"
            className="rounded border border-line px-2 py-1"
          />
          <input
            name="minMs"
            defaultValue={minMs?.toString() ?? ""}
            placeholder="최소 지연 (ms)"
            type="number"
            className="rounded border border-line px-2 py-1"
          />
          <button
            type="submit"
            className="rounded bg-indigo-600 px-3 py-1 text-white"
          >
            적용
          </button>
        </form>
      </Card>

      {traceIds.length === 0 ? (
        <Card className="p-6 text-sm text-text-muted">수집된 트레이스가 없습니다.</Card>
      ) : (
        <div className="space-y-4">
          {traceIds.map((tid) => {
            const spans = (byTrace.get(tid) ?? []).slice().sort((a, b) => a.startedAt - b.startedAt);
            if (spans.length === 0) return null;
            const t0 = spans[0].startedAt;
            const tEnd = Math.max(...spans.map((s) => s.endedAt ?? s.startedAt));
            const width = Math.max(1, tEnd - t0);
            return (
              <Card key={tid} className="p-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="font-mono text-xs text-text-muted">{tid}</span>
                  <span className="text-xs text-text-muted">
                    {spans.length} spans · {width}ms 총
                  </span>
                </div>
                <svg viewBox={`0 0 800 ${spans.length * 20}`} className="w-full">
                  {spans.map((s, i) => {
                    const x = ((s.startedAt - t0) / width) * 780 + 10;
                    const w = Math.max(2, ((s.endedAt ?? s.startedAt) - s.startedAt) / width * 780);
                    const color = s.status === "error" ? "#dc2626" : "#4f46e5";
                    return (
                      <g key={s.id}>
                        <rect x={x} y={i * 20 + 4} width={w} height={12} fill={color} rx={2} />
                        <text
                          x={x + 4}
                          y={i * 20 + 13}
                          fontSize={10}
                          fill="white"
                        >
                          {s.name} · {s.durationMs ?? 0}ms
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
