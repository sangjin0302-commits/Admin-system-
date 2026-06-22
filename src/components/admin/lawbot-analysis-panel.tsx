import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { LawbotRerunButton } from "./lawbot-rerun-button";

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-slate-100 text-slate-700",
  FAILED: "bg-rose-100 text-rose-800",
  SKIPPED: "bg-amber-100 text-amber-800",
};

function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "text-text-muted";
  if (score >= 75) return "text-emerald-700";
  if (score >= 50) return "text-indigo-700";
  if (score >= 25) return "text-amber-700";
  return "text-rose-700";
}

export async function LawbotAnalysisPanel({ caseId }: { caseId: string }) {
  const runs = await prisma.caseAnalysisRun
    .findMany({
      where: { caseId },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
    .catch(() => []);

  const latest = runs[0];
  const history = runs.slice(1);

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-text-muted">Lawbot 분석</p>
          <h3 className="text-sm font-semibold text-text-strong">AI 사건 진단</h3>
        </div>
        <div className="flex items-center gap-2">
          {runs.length > 0 && (
            <a
              href={`/api/admin/cases/${caseId}/lawbot-analyze/export?format=csv`}
              className="rounded border border-line bg-white px-2.5 py-1 text-xs hover:bg-surface-muted"
              title="모든 분석 기록을 CSV로 내려받기"
            >
              CSV
            </a>
          )}
          <LawbotRerunButton caseId={caseId} />
        </div>
      </div>

      {!latest ? (
        <p className="text-sm text-text-muted">
          아직 분석된 적이 없습니다. 위 “재분석” 버튼을 누르거나 매일 02:00 cron을
          기다려주세요.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[latest.status] ?? ""}`}
            >
              {latest.status}
            </span>
            <span className="text-xs text-text-muted">
              {new Date(latest.createdAt).toLocaleString("ko-KR")}
            </span>
          </div>

          {latest.status === "COMPLETED" && (
            <>
              {latest.strengthScore !== null && latest.strengthScore !== undefined && (
                <div className="mt-3 flex items-baseline gap-3">
                  <span
                    className={`text-3xl font-semibold tabular-nums ${scoreColor(latest.strengthScore)}`}
                  >
                    {latest.strengthScore}
                  </span>
                  <span className="text-sm text-text-muted">/ 100</span>
                  {latest.strengthLabel && (
                    <span className="ml-2 text-sm font-medium">
                      {latest.strengthLabel}
                    </span>
                  )}
                </div>
              )}
              {latest.recommendation && (
                <div className="mt-3 rounded-md bg-surface-muted p-3 text-sm">
                  <p className="font-medium text-text-strong">권장 액션</p>
                  <p className="mt-1 text-text-muted">{latest.recommendation}</p>
                </div>
              )}
              {latest.resultSummary && (
                <p className="mt-2 text-sm text-text-muted">{latest.resultSummary}</p>
              )}
            </>
          )}

          {latest.status === "FAILED" && latest.errorMessage && (
            <p className="mt-2 text-sm text-rose-700">⚠ {latest.errorMessage}</p>
          )}

          {latest.status === "SKIPPED" && (
            <p className="mt-2 text-sm text-amber-700">
              Lawbot bridge 미설정 — 환경변수 LAWBOT_BRIDGE_BASE_URL 외 2개 필요
            </p>
          )}
        </>
      )}

      {history.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-text-muted">
            이전 분석 {history.length}건 보기
          </summary>
          <ul className="mt-2 space-y-1 text-xs">
            {history.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-1.5 py-0.5 ${STATUS_BADGE[r.status] ?? ""}`}
                >
                  {r.status}
                </span>
                <span className="text-text-muted">
                  {new Date(r.createdAt).toLocaleString("ko-KR")}
                </span>
                {r.strengthScore !== null && r.strengthScore !== undefined && (
                  <span className={`tabular-nums ${scoreColor(r.strengthScore)}`}>
                    {r.strengthScore}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
