import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { listVersions, type PromptVersion } from "@/lib/services/prompt-optimizer-service";

export const dynamic = "force-dynamic";

const KNOWN_SERVICES = [
  { key: "auto-reply", label: "자동 회신" },
  { key: "drafting", label: "서면 초안" },
  { key: "consultation-script", label: "상담 스크립트" },
  { key: "classification", label: "문의 분류" },
];

export default async function AIPromptsPage({
  searchParams,
}: {
  searchParams?: Promise<{ service?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const service = sp.service ?? KNOWN_SERVICES[0].key;
  const versions = await listVersions(service);
  const active = versions.find((v) => v.active);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Learning"
        title="자동 프롬프트 최적화"
        description="프롬프트 버전 관리 · A/B 통계 · 자동 승격 (사용자 피드백 기반)."
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">서비스:</span>
          {KNOWN_SERVICES.map((s) => (
            <a
              key={s.key}
              href={`/admin/ai-prompts?service=${s.key}`}
              className={`rounded px-2 py-1 text-xs ${service === s.key ? "bg-slate-900 text-white" : "bg-slate-100"}`}
            >
              {s.label}
            </a>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">활성 버전</h2>
        {!active ? (
          <p className="mt-3 text-sm text-text-muted">활성 버전이 없습니다. 새 버전을 저장하세요.</p>
        ) : (
          <VersionRow v={active} highlight />
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">모든 버전 ({versions.length})</h2>
        {versions.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">저장된 버전이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {versions
              .slice()
              .sort((a, b) => b.version - a.version)
              .map((v) => (
                <li key={v.id}>
                  <VersionRow v={v} />
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">사용법</h2>
        <p className="mt-2 text-xs text-text-muted">
          이 페이지는 저장/조회용입니다. 편집·자동 승격은 API로:
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
{`# 새 버전 저장
POST /api/admin/ai-prompts
{ "action":"save", "service":"${service}", "prompt":"...", "activate": true }

# 활성 전환
POST /api/admin/ai-prompts
{ "action":"activate", "service":"${service}", "versionId":"..." }

# 롤백
POST /api/admin/ai-prompts
{ "action":"rollback", "service":"${service}" }

# 자동 승격 검사
POST /api/admin/ai-prompts
{ "action":"auto-promote", "service":"${service}" }`}
        </pre>
      </Card>
    </div>
  );
}

function VersionRow({ v, highlight }: { v: PromptVersion; highlight?: boolean }) {
  const total = v.stats.satisfied + v.stats.dissatisfied;
  const satRate = total > 0 ? (v.stats.satisfied / total) * 100 : 0;
  const succTotal = v.stats.successes + v.stats.failures;
  const succRate = succTotal > 0 ? (v.stats.successes / succTotal) * 100 : 0;
  return (
    <div
      className={`rounded border p-3 ${highlight ? "border-emerald-400 bg-emerald-50/40" : "border-line"}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <span className="rounded bg-slate-100 px-2 py-0.5">v{v.version}</span>
        {v.active && <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800">ACTIVE</span>}
        {v.pinned && <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">PINNED</span>}
        <span>{new Date(v.createdAt).toLocaleString()}</span>
        {v.createdBy && <span>· {v.createdBy}</span>}
      </div>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs">
        {v.prompt}
      </pre>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <span>사용 {v.stats.usage.toLocaleString()}</span>
        <span>만족도 {satRate.toFixed(1)}% ({total})</span>
        <span>성공률 {succRate.toFixed(1)}% ({succTotal})</span>
        <span className="font-mono text-text-muted">{v.id}</span>
      </div>
    </div>
  );
}
