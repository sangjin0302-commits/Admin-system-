import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getFeatureRegistry, getAllFlags, isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FlagAuditPage() {
  if (!(await isFeatureEnabled("flag_usage_audit"))) notFound();

  const registry = getFeatureRegistry();
  const active = await getAllFlags();

  const byCategory = new Map<string, typeof registry[number][]>();
  for (const f of registry) {
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
