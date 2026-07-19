import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getTestResults, listTests } from "@/lib/services/ab-test-service";

export const dynamic = "force-dynamic";

export default async function ABTestsPage() {
  const tests = listTests();
  const results = tests.map((t) => ({ test: t, result: getTestResults(t.key) }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="성장"
        title="A/B 테스트"
        description="실험을 관리하고 변형별 성과를 확인합니다."
      />

      {results.length === 0 ? (
        <Card className="p-5">
          <p className="text-sm text-text-muted">등록된 테스트가 없습니다.</p>
        </Card>
      ) : (
        results.map(({ test, result }) => (
          <Card key={test.key} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-strong">{test.name}</h2>
                <p className="text-xs text-text-muted">
                  키: <code>{test.key}</code> · {test.active ? "사용" : "미사용"}
                </p>
              </div>
              {result.winner && (
                <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                  우승 변형: {result.winner}
                </span>
              )}
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted">
                  <th className="py-2">변형</th>
                  <th className="py-2">노출 수</th>
                  <th className="py-2">전환 수</th>
                  <th className="py-2">전환율</th>
                </tr>
              </thead>
              <tbody>
                {result.variants.map((v) => (
                  <tr key={v.name} className="border-t border-line">
                    <td className="py-2">{v.name}</td>
                    <td className="py-2">{v.views}</td>
                    <td className="py-2">{v.conversions}</td>
                    <td className="py-2">{(v.rate * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))
      )}
    </div>
  );
}
