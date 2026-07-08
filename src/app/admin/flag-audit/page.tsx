import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getFeatureRegistry, getAllFlags, isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FILTER_OPTIONS = [
  { key: "all", label: "전체" },
  { key: "on", label: "활성만" },
  { key: "off", label: "비활성만" },
  { key: "diverged", label: "기본값과 다름" },
  { key: "public", label: "공개" },
] as const;
type FilterKey = (typeof FILTER_OPTIONS)[number]["key"];

export default async function FlagAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
  if (!(await isFeatureEnabled("flag_usage_audit"))) notFound();

  const registry = getFeatureRegistry();
  const active = await getAllFlags();
  const sp = (await searchParams) ?? {};
  const filter = (FILTER_OPTIONS.find((f) => f.key === sp.filter)?.key ?? "all") as FilterKey;
  const q = (sp.q ?? "").trim().toLowerCase();

  const passesFilter = (f: (typeof registry)[number]): boolean => {
    const actual = active[f.key] ?? f.default;
    const divergedFlag = active[f.key] !== undefined && active[f.key] !== f.default;
    if (filter === "on" && !actual) return false;
    if (filter === "off" && actual) return false;
    if (filter === "diverged" && !divergedFlag) return false;
    if (filter === "public" && !f.public) return false;
    if (q && !`${f.key} ${f.label} ${f.description ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  };
  const filteredRegistry = registry.filter(passesFilter);

  const byCategory = new Map<string, typeof registry[number][]>();
  for (const f of filteredRegistry) {
    const arr = byCategory.get(f.category) ?? [];
    arr.push(f);
    byCategory.set(f.category, arr);
  }

  const total = registry.length;
  const enabled = registry.filter((f) => active[f.key] ?? f.default).length;
  const diverged = registry.filter((f) => {
    const actual = active[f.key];
    return actual !== undefined && actual !== f.default;
  }).length;
  const publicCount = registry.filter((f) => f.public).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Ops"
        title="Flag 사용 감사"
        description="138개 feature flag 카테고리별 현황 + default vs stored 대조."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">전체</p>
          <p className="mt-2 text-3xl font-bold text-primary">{total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">활성</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{enabled}</p>
          <p className="mt-1 text-[11px] text-text-muted">{((enabled / total) * 100).toFixed(0)}%</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">기본값과 다름</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{diverged}</p>
          <p className="mt-1 text-[11px] text-text-muted">관리자가 명시 토글</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">공개 노출</p>
          <p className="mt-2 text-3xl font-bold text-primary">{publicCount}</p>
          <p className="mt-1 text-[11px] text-text-muted">public API 화이트리스트</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted mr-2">필터:</span>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.key;
            const params = new URLSearchParams();
            if (opt.key !== "all") params.set("filter", opt.key);
            if (q) params.set("q", q);
            const href = params.toString() ? `?${params.toString()}` : "";
            return (
              <Link
                key={opt.key}
                href={`/admin/flag-audit${href}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  isActive ? "bg-black text-white" : "border border-line bg-surface text-text-muted hover:bg-surface-muted"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
          <form className="ml-auto flex items-center gap-1">
            <input type="hidden" name="filter" value={filter} />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="키/라벨/설명 검색..."
              className="rounded-lg border border-line bg-surface px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" className="rounded-full bg-primary px-3 py-1 text-xs text-white">검색</button>
          </form>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          현재 필터 조건: {filteredRegistry.length}개 / 전체 {registry.length}개
        </p>
      </Card>

      {byCategory.size === 0 ? (
        <Card className="p-8 text-center text-sm text-text-muted">조건에 맞는 flag 없음. 필터를 조정하세요.</Card>
      ) : null}

      {Array.from(byCategory.entries()).map(([category, flags]) => (
        <Card key={category} className="p-5">
          <div className="flex items-center justify-between">
            <p className="ui-kicker">{category} ({flags.length})</p>
            <span className="text-xs text-text-muted">
              활성 {flags.filter((f) => active[f.key] ?? f.default).length} / 전체 {flags.length}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/20 text-left">
                  <th className="pb-2 font-bold text-text-strong">키</th>
                  <th className="pb-2 font-bold text-text-strong">라벨</th>
                  <th className="pb-2 text-center font-bold text-text-strong">기본</th>
                  <th className="pb-2 text-center font-bold text-text-strong">현재</th>
                  <th className="pb-2 text-center font-bold text-text-strong">공개</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f) => {
                  const stored = active[f.key];
                  const actual = stored ?? f.default;
                  const divergedFlag = stored !== undefined && stored !== f.default;
                  return (
                    <tr key={f.key} className="border-b border-gold/10">
                      <td className="py-2 font-mono text-[11px] text-text-muted">{f.key}</td>
                      <td className="py-2 text-text-strong">{f.label}</td>
                      <td className="py-2 text-center">
                        <span className={f.default ? "text-emerald-600" : "text-text-muted"}>
                          {f.default ? "ON" : "OFF"}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`font-bold ${actual ? "text-emerald-600" : "text-text-muted"} ${divergedFlag ? "underline decoration-amber-500" : ""}`}>
                          {actual ? "ON" : "OFF"}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        {f.public ? <span className="text-primary">✓</span> : <span className="text-text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <Card className="p-5">
        <p className="ui-kicker">정리 팁</p>
        <ul className="mt-3 space-y-2 text-sm text-text-muted">
          <li>• <strong>underline amber</strong>: 관리자가 기본값과 다르게 명시 토글 → 의도 확인 후 유지/정리</li>
          <li>• 실제 사용 여부는 코드 grep 필요: <code>isFeatureEnabled("key")</code> 호출 확인</li>
          <li>• 3개월+ 활성화 안 된 default:false flag → 제거 후보</li>
          <li>• <Link href="/admin/features" className="text-gold-deep hover:underline">/admin/features</Link>에서 개별 토글</li>
        </ul>
      </Card>
    </div>
  );
}
