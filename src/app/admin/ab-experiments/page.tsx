import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getTestResults, listTests } from "@/lib/services/ab-test-service";
import {
  getDefaultVariant,
  listPromotionHistory,
} from "@/lib/services/ab-auto-promote-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

export default async function ABExperimentsPage() {
  const tests = listTests();
  const [history, autoOn] = await Promise.all([
    listPromotionHistory(),
    isFeatureEnabled("ab_auto_promote"),
  ]);
  const rows = await Promise.all(
    tests.map(async (t) => ({
      test: t,
      result: getTestResults(t.key),
      currentDefault: await getDefaultVariant(t.key),
    }))
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Learning"
        title="A/B 실험 자동 승격"
        description="7일 이상·변형당 100+ 샘플·카이제곱(α=0.05) 통과 시 매주 일요일 자동 승격됩니다."
        action={
          <span
            className={`rounded px-3 py-1 text-xs ${autoOn ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}
          >
            자동 승격: {autoOn ? "ON" : "OFF (feature flag)"}
          </span>
        }
      />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">활성 실험 · 현재 통계</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">등록된 실험이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {rows.map(({ test, result, currentDefault }) => (
              <div key={test.key} className="rounded border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{test.name}</h3>
                    <p className="text-xs text-text-muted">
                      <code>{test.key}</code> · {test.active ? "active" : "inactive"} · 기본값:{" "}
                      <b>{currentDefault ?? test.variants[0]}</b>
                    </p>
                  </div>
                  {result.winner && (
                    <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                      승자 후보: {result.winner}
                    </span>
                  )}
                </div>
                <table className="mt-3 w-full text-xs">
                  <thead className="text-text-muted">
                    <tr className="text-left">
                      <th className="py-1">Variant</th>
                      <th className="py-1">Views</th>
                      <th className="py-1">Conversions</th>
                      <th className="py-1">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.variants.map((v) => (
                      <tr key={v.name} className="border-t border-line">
                        <td className="py-1">{v.name}</td>
                        <td className="py-1">{v.views}</td>
                        <td className="py-1">{v.conversions}</td>
                        <td className="py-1">{(v.rate * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">자동 승격 이력</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">승격 이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {history.slice(0, 30).map((h) => (
              <li key={h.id} className="rounded border border-line p-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                  <span>{new Date(h.timestamp).toLocaleString()}</span>
                  <code>{h.testKey}</code>
                </div>
                <p className="mt-1">
                  <b>{h.winner}</b>을(를) 기본 변형으로 승격 (vs {h.loserVariants.join(", ")}) —
                  χ²={h.chiSquare}, 총 {h.totalSamples} 샘플
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
