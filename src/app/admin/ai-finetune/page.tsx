import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getStats,
  listEntries,
  previewRandom,
  type FinetuneService,
} from "@/lib/services/finetune-dataset-service";

export const dynamic = "force-dynamic";

const SERVICES: Array<{ key: FinetuneService; label: string }> = [
  { key: "auto-reply", label: "자동 회신" },
  { key: "drafting", label: "서면 초안" },
  { key: "consultation-script", label: "상담 스크립트" },
  { key: "other", label: "기타" },
];

export default async function AIFinetuneDatasetPage({
  searchParams,
}: {
  searchParams?: Promise<{ service?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const serviceFilter = SERVICES.find((s) => s.key === sp.service)?.key;
  const [stats, listing, preview] = await Promise.all([
    getStats(),
    listEntries({ service: serviceFilter, limit: 20 }),
    previewRandom(3),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Learning"
        title="파인튜닝 데이터셋"
        description="승인된 AI 응답이 파인튜닝용 데이터셋으로 자동 축적됩니다. 최대 5,000건 유지."
      />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">데이터셋 통계</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="총 건수" value={stats.total.toLocaleString()} />
          <StatCard label="서비스 종류" value={Object.keys(stats.byService).length.toString()} />
          <StatCard label="가장 오래된" value={stats.oldest?.slice(0, 10) ?? "-"} />
          <StatCard label="가장 최근" value={stats.newest?.slice(0, 10) ?? "-"} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          <Breakdown title="서비스별" data={stats.byService} />
          <Breakdown title="모델별" data={stats.byModel} />
          <Breakdown title="카테고리별" data={stats.byCategory} />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-text-strong">필터</h2>
          <a
            href="/admin/ai-finetune"
            className={`rounded px-2 py-1 text-xs ${!serviceFilter ? "bg-slate-900 text-white" : "bg-slate-100"}`}
          >
            전체
          </a>
          {SERVICES.map((s) => (
            <a
              key={s.key}
              href={`/admin/ai-finetune?service=${s.key}`}
              className={`rounded px-2 py-1 text-xs ${serviceFilter === s.key ? "bg-slate-900 text-white" : "bg-slate-100"}`}
            >
              {s.label}
            </a>
          ))}
          <span className="ml-auto flex gap-2">
            <a
              className="rounded bg-emerald-600 px-3 py-1 text-xs text-white"
              href={`/api/admin/ai-finetune?action=export&format=jsonl${serviceFilter ? `&service=${serviceFilter}` : ""}`}
            >
              JSONL 내보내기 (OpenAI)
            </a>
            <a
              className="rounded bg-indigo-600 px-3 py-1 text-xs text-white"
              href={`/api/admin/ai-finetune?action=export&format=anthropic${serviceFilter ? `&service=${serviceFilter}` : ""}`}
            >
              Anthropic 포맷 내보내기
            </a>
          </span>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">
          최근 항목 ({listing.total} 총)
        </h2>
        {listing.items.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">데이터가 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {listing.items.map((e) => (
              <li key={e.id} className="rounded border border-line p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className="rounded bg-slate-100 px-2 py-0.5">{e.service}</span>
                  {e.model && <span>{e.model}</span>}
                  {e.category && <span>· {e.category}</span>}
                  <span>· {new Date(e.timestamp).toLocaleString()}</span>
                  {e.approvedBy && <span>· 승인: {e.approvedBy}</span>}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-text-muted">Q: {e.input.slice(0, 200)}</p>
                <p className="mt-1 line-clamp-3 text-sm">A: {e.output.slice(0, 400)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">무작위 미리보기</h2>
        {preview.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">미리볼 항목이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {preview.map((e) => (
              <li key={e.id} className="rounded border border-line p-3 text-sm">
                <div className="text-xs text-text-muted">{e.service} · {e.model ?? "-"}</div>
                <p className="mt-1"><b>Q:</b> {e.input.slice(0, 300)}</p>
                <p className="mt-1"><b>A:</b> {e.output.slice(0, 500)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded border border-line p-3">
      <p className="text-xs font-semibold text-text-strong">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-xs text-text-muted">-</p>
      ) : (
        <ul className="mt-2 space-y-1 text-xs">
          {entries.slice(0, 8).map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span className="truncate">{k}</span>
              <span className="text-text-muted">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
