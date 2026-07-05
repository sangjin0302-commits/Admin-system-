import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getHistory, getSuite } from "@/lib/services/ai-regression-test-service";

export const dynamic = "force-dynamic";

export default async function AIRegressionPage() {
  const [suite, history] = await Promise.all([getSuite(), getHistory()]);
  const latest = history[history.length - 1];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI 품질"
        title="AI 응답 품질 회귀 테스트"
        description="테스트 스위트를 정의하고 Claude Haiku 로 기대 개념 포함 여부를 판정합니다."
      />

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">스위트 ({suite.length} 개)</h2>
          <form action="/api/admin/ai-regression" method="post">
            <input type="hidden" name="action" value="run" />
            <button
              type="submit"
              className="rounded bg-indigo-600 px-3 py-1 text-sm text-white"
            >
              전체 실행
            </button>
          </form>
        </div>
        <table className="mt-3 w-full text-xs">
          <thead className="text-text-muted">
            <tr className="text-left">
              <th className="py-1">서비스</th>
              <th className="py-1">입력</th>
              <th className="py-1">기대 키워드</th>
              <th className="py-1">최소 점수</th>
            </tr>
          </thead>
          <tbody>
            {suite.length === 0 ? (
              <tr>
                <td className="py-3 text-text-muted" colSpan={4}>
                  등록된 테스트가 없습니다. POST /api/admin/ai-regression &#123; action:&quot;upsert&quot;, test: &#123;...&#125; &#125; 로 추가.
                </td>
              </tr>
            ) : (
              suite.map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="py-1 font-mono">{t.service}</td>
                  <td className="py-1">{t.input.slice(0, 80)}</td>
                  <td className="py-1">{t.expectedKeywords.join(", ")}</td>
                  <td className="py-1">{t.minScore.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">최근 실행 결과</h2>
        {!latest ? (
          <p className="mt-3 text-sm text-text-muted">실행 이력이 없습니다.</p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <KPI label="합격률" value={`${(latest.passRate * 100).toFixed(1)}%`} />
              <KPI label="합격" value={String(latest.pass)} />
              <KPI label="실패" value={String(latest.fail)} />
            </div>
            <table className="mt-3 w-full text-xs">
              <thead className="text-text-muted">
                <tr className="text-left">
                  <th className="py-1">서비스</th>
                  <th className="py-1">결과</th>
                  <th className="py-1">점수</th>
                  <th className="py-1">누락</th>
                </tr>
              </thead>
              <tbody>
                {latest.results.map((r) => (
                  <tr key={r.testId} className="border-t border-line">
                    <td className="py-1 font-mono">{r.service}</td>
                    <td className="py-1">
                      {r.pass ? (
                        <span className="text-emerald-600">PASS</span>
                      ) : (
                        <span className="text-rose-600">FAIL</span>
                      )}
                    </td>
                    <td className="py-1">{r.score.toFixed(2)}</td>
                    <td className="py-1 text-text-muted">{r.missingKeywords.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">실행 이력</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">이력 없음.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-xs">
            {history
              .slice()
              .reverse()
              .slice(0, 20)
              .map((run) => (
                <li key={run.id} className="flex justify-between border-t border-line pt-1">
                  <span className="font-mono text-text-muted">{run.ranAt}</span>
                  <span>
                    {run.pass}/{run.pass + run.fail} · {(run.passRate * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
          </ul>
        )}
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
