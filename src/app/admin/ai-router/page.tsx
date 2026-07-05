import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  DEFAULT_RULES,
  estimateSavings,
  getRules,
  listDecisions,
} from "@/lib/services/model-router-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

export default async function AIRouterPage() {
  const [rules, decisions, savings, enabled] = await Promise.all([
    getRules(),
    listDecisions(50),
    estimateSavings(),
    isFeatureEnabled("smart_model_routing"),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Learning"
        title="AI 모델 자동 선택"
        description="태스크 종류·복잡도 신호에 따라 Haiku/Sonnet/Opus 자동 선택. 비용 절감을 추적합니다."
        action={
          <span
            className={`rounded px-3 py-1 text-xs ${enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100"}`}
          >
            상태: {enabled ? "ON" : "OFF (fallback: Sonnet)"}
          </span>
        }
      />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">비용 절감 추정</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <KPI label="실제 비용" value={`$${savings.actualCostUsd.toFixed(4)}`} />
          <KPI label="Opus만 사용 시" value={`$${savings.opusOnlyCostUsd.toFixed(4)}`} />
          <KPI label="절감액" value={`$${savings.savingsUsd.toFixed(4)}`} />
          <KPI label="절감률" value={`${savings.savingsPct.toFixed(1)}%`} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">라우팅 규칙</h2>
        <p className="mt-1 text-xs text-text-muted">
          SiteSetting <code>ai.router.rules</code> 로 오버라이드 가능. 아래는 현재 적용된 규칙:
        </p>
        <table className="mt-3 w-full text-xs">
          <thead className="text-text-muted">
            <tr className="text-left">
              <th className="py-1">Task</th>
              <th className="py-1">Default Model</th>
              <th className="py-1">긴 입력 시 에스컬레이션 (chars)</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.taskType} className="border-t border-line">
                <td className="py-1 font-mono">{r.taskType}</td>
                <td className="py-1">{r.defaultModel}</td>
                <td className="py-1">{r.escalateOnLongInput ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rules === DEFAULT_RULES && (
          <p className="mt-2 text-xs text-text-muted">기본 규칙 사용 중 (오버라이드 없음).</p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">최근 라우팅 결정</h2>
        {decisions.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">기록된 결정이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {decisions.map((d) => (
              <li key={d.id} className="rounded border border-line p-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-text-muted">
                  <span>{new Date(d.timestamp).toLocaleString()}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5">{d.taskType}</span>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-800">{d.model}</span>
                  {d.costUsd !== undefined && <span>· ${d.costUsd.toFixed(6)}</span>}
                  {d.success === false && <span className="text-rose-600">FAILED</span>}
                </div>
                <p className="mt-1">{d.reasoning}</p>
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
