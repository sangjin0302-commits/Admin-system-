import { Card } from "@/components/ui/card";
import { getTestResults, listTests } from "@/lib/services/ab-test-service";

export const dynamic = "force-dynamic";

export default async function ABTestsPage() {
  const tests = listTests();
  const results = tests.map((t) => ({ test: t, result: getTestResults(t.key) }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Growth</p>
        <h1 className="mt-2 ui-page-title">A/B Tests</h1>
        <p className="mt-2 text-sm text-text-muted">
          Manage experiments and review variant performance.
        </p>
      </Card>

      {results.length === 0 ? (
        <Card className="p-5">
          <p className="text-sm text-text-muted">No tests defined.</p>
        </Card>
      ) : (
        results.map(({ test, result }) => (
          <Card key={test.key} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-strong">{test.name}</h2>
                <p className="text-xs text-text-muted">
                  key: <code>{test.key}</code> · {test.active ? "active" : "inactive"}
                </p>
              </div>
              {result.winner && (
                <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                  Winner: {result.winner}
                </span>
              )}
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted">
                  <th className="py-2">Variant</th>
                  <th className="py-2">Views</th>
                  <th className="py-2">Conversions</th>
                  <th className="py-2">Rate</th>
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
