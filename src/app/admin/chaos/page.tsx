import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getChaosLog,
  isProdChaosAllowed,
  listExperiments,
} from "@/lib/services/chaos-engineering-service";

export const dynamic = "force-dynamic";

export default async function ChaosPage() {
  const [experiments, log] = await Promise.all([listExperiments(), getChaosLog()]);
  const isProd = process.env.NODE_ENV === "production";
  const prodAllowed = isProdChaosAllowed();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="안정성"
        title="혼돈 공학 실험"
        description="지연·오류를 의도적으로 주입하여 시스템 회복력을 검증합니다."
      />

      <Card
        className={`p-4 text-sm ${
          isProd && !prodAllowed
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : isProd
            ? "border-rose-300 bg-rose-50 text-rose-900"
            : "border-amber-300 bg-amber-50 text-amber-900"
        }`}
      >
        {isProd && !prodAllowed && (
          <p>프로덕션 환경 · CHAOS_ALLOW_PROD 미설정 → 모든 주입 무시됩니다.</p>
        )}
        {isProd && prodAllowed && (
          <p>⚠ 프로덕션 환경에 CHAOS_ALLOW_PROD=1 이 설정되어 있습니다. 실 사용자에게 영향이 있을 수 있습니다.</p>
        )}
        {!isProd && <p>개발/스테이징 환경 · 실험 활성화 가능.</p>}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">실험 목록 ({experiments.length})</h2>
        <table className="mt-3 w-full text-xs">
          <thead className="text-text-muted">
            <tr className="text-left">
              <th className="py-1">타겟</th>
              <th className="py-1">액션</th>
              <th className="py-1">강도</th>
              <th className="py-1">확률</th>
              <th className="py-1">스케줄</th>
              <th className="py-1">상태</th>
            </tr>
          </thead>
          <tbody>
            {experiments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 text-text-muted">
                  등록된 실험 없음. POST /api/admin/chaos 로 등록.
                </td>
              </tr>
            ) : (
              experiments.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="py-1 font-mono">{e.target}</td>
                  <td className="py-1">{e.action}</td>
                  <td className="py-1">{e.intensity}</td>
                  <td className="py-1">{(e.probability * 100).toFixed(0)}%</td>
                  <td className="py-1">{e.schedule ?? "always"}</td>
                  <td className="py-1">
                    {e.enabled ? (
                      <span className="text-emerald-600">활성</span>
                    ) : (
                      <span className="text-text-muted">중지</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">최근 주입 로그</h2>
        {log.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">로그 없음.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-xs">
            {log
              .slice()
              .reverse()
              .slice(0, 30)
              .map((l) => (
                <li key={l.id} className="flex justify-between border-t border-line pt-1">
                  <span className="font-mono text-text-muted">{l.at}</span>
                  <span className="font-mono">{l.target}</span>
                  <span>
                    {l.action} · {l.detail}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
