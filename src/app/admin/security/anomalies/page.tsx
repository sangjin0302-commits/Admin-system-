import { getRecentAnomalies, sortBySeverity, type Severity } from "@/lib/services/audit-anomaly-detector";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

const SEVERITY_LABEL: Record<Severity, { text: string; className: string }> = {
  critical: { text: "심각", className: "border-red-300 bg-red-100 text-red-800" },
  high: { text: "높음", className: "border-orange-300 bg-orange-100 text-orange-800" },
  medium: { text: "보통", className: "border-amber-300 bg-amber-100 text-amber-800" },
  low: { text: "낮음", className: "border-gray-300 bg-gray-100 text-gray-700" },
};

const TYPE_LABEL: Record<string, string> = {
  off_hours: "비정상 시각 접근",
  bulk_export: "대량 내보내기",
  privilege_escalation: "권한 상승",
  failed_login_spike: "실패 로그인 급증",
  rate_spike: "액션 빈도 급증",
};

async function getMarks(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ids.map((i) => `audit_anomaly.marks.${i}`) } },
    select: { key: true, value: true },
  });
  const out: Record<string, string> = {};
  for (const r of rows) {
    const id = r.key.slice("audit_anomaly.marks.".length);
    out[id] = r.value;
  }
  return out;
}

export default async function AuditAnomaliesPage() {
  const [items, flagOn] = await Promise.all([
    getRecentAnomalies(80),
    isFeatureEnabled("audit_anomaly_ai"),
  ]);
  const sorted = items.slice().sort(sortBySeverity);
  const marks = await getMarks(sorted.map((a) => a.id));

  return (
    <div className="space-y-6">
      <div>
        <p className="ui-kicker">Security</p>
        <h1 className="ui-page-title">AI 감사 로그 이상행동</h1>
        <p className="mt-2 text-sm text-text-muted">
          기준선(중앙값) 대비 이상행동 자동 탐지 (플래그: {flagOn ? "ON" : "OFF"}) · 정렬: 심각도 우선
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-text-muted">감지된 이상행동이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((a) => {
            const sev = SEVERITY_LABEL[a.severity];
            const mark = marks[a.id];
            return (
              <li key={a.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-strong">{TYPE_LABEL[a.type] ?? a.type}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {a.actor} · {a.action} · {new Date(a.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${sev.className}`}>
                    {sev.text}
                  </span>
                </div>
                <p className="mt-3 text-xs text-text-muted">기준선 편차: {a.deviation}</p>
                <p className="mt-2 text-sm text-text-strong">{a.aiExplanation}</p>
                <div className="mt-3 flex gap-2">
                  <form action={`/api/admin/security/anomalies/${a.id}/mark`} method="post">
                    <input type="hidden" name="mark" value="normal" />
                    <button
                      type="submit"
                      className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition ${
                        mark === "normal"
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                          : "border-line bg-surface text-text-muted hover:bg-surface-muted"
                      }`}
                    >
                      정상
                    </button>
                  </form>
                  <form action={`/api/admin/security/anomalies/${a.id}/mark`} method="post">
                    <input type="hidden" name="mark" value="investigate" />
                    <button
                      type="submit"
                      className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition ${
                        mark === "investigate"
                          ? "border-red-300 bg-red-100 text-red-800"
                          : "border-line bg-surface text-text-muted hover:bg-surface-muted"
                      }`}
                    >
                      조사 필요
                    </button>
                  </form>
                </div>
                {a.eventIds.length > 0 && (
                  <p className="mt-2 text-xs text-text-muted">이벤트 {a.eventIds.length}개 · 최신: {a.eventIds[0]}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
