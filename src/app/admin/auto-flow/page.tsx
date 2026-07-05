import { getFullAutoConfig, getRecentFlowLog } from "@/lib/services/full-auto-case-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

export default async function AutoFlowAdminPage() {
  const [cfg, flagOn, log] = await Promise.all([
    getFullAutoConfig(),
    isFeatureEnabled("full_auto_case_flow"),
    getRecentFlowLog(30),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="ui-kicker">Automation</p>
        <h1 className="ui-page-title">완전 자동 사건 진행</h1>
        <p className="mt-2 text-sm text-text-muted">
          신규 문의 → AI 스크리닝 → 우선순위 → 견적 → 계약 → 서명 → 사건 개설 (플래그: {flagOn ? "ON" : "OFF"})
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-strong">임계값 (confidence gate)</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-text-muted">스크리닝</dt>
            <dd className="font-semibold">{Math.round(cfg.thresholds.screen * 100)}%</dd>
          </div>
          <div>
            <dt className="text-text-muted">우선순위</dt>
            <dd className="font-semibold">{cfg.thresholds.score} / 100</dd>
          </div>
          <div>
            <dt className="text-text-muted">견적</dt>
            <dd className="font-semibold">{Math.round(cfg.thresholds.quote * 100)}%</dd>
          </div>
          <div>
            <dt className="text-text-muted">계약</dt>
            <dd className="font-semibold">{Math.round(cfg.thresholds.contract * 100)}%</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-text-muted">
          완전 자동 토글: <strong>{cfg.enabled ? "ON" : "OFF"}</strong> · 화이트리스트 카테고리: {cfg.categoryWhitelist.length === 0 ? "제한 없음" : cfg.categoryWhitelist.join(", ")}
        </p>
        <p className="mt-1 text-xs text-text-muted">설정 변경: PATCH /api/admin/auto-flow/run</p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-strong">최근 자동 흐름 로그 ({log.length})</h2>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">아직 자동 실행 기록이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {log.map((entry) => (
              <li key={`${entry.inquiryId}-${entry.startedAt}`} className="rounded-lg border border-line bg-surface-muted p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-text-muted">{entry.inquiryId}</span>
                  <span className={entry.fullyAutomated ? "text-emerald-600" : "text-amber-600"}>
                    {entry.fullyAutomated ? "완전 자동 완료" : "수동 개입 필요"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.steps.map((s, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${
                        s.status === "ok"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : s.status === "held_for_manual"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : s.status === "error"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                    >
                      {s.step}
                      {typeof s.confidence === "number" ? ` ${Math.round(s.confidence * 100)}%` : ""}
                    </span>
                  ))}
                </div>
                {entry.reason && <p className="mt-1 text-xs text-text-muted">사유: {entry.reason}</p>}
                <p className="mt-1 text-xs text-text-muted">시작 {new Date(entry.startedAt).toLocaleString()}</p>
                {!entry.fullyAutomated && (
                  <form action="/api/admin/auto-flow/run" method="post" className="mt-2">
                    <input type="hidden" name="inquiryId" value={entry.inquiryId} />
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center rounded-md border border-line bg-surface px-3 text-xs font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
                    >
                      수동 재시도
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
