import { getAutopilotConfig, getAutopilotLog, previewUpcomingActions } from "@/lib/services/deadline-autopilot";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

const INTERVAL_LABEL: Record<string, string> = {
  "D-7": "7일 전",
  "D-3": "3일 전",
  "D-0": "당일",
  POST_ESCALATE: "마감 후 에스컬레이션",
};

export default async function DeadlineAutopilotAdminPage() {
  const [cfg, log, upcoming, flagOn] = await Promise.all([
    getAutopilotConfig(),
    getAutopilotLog(60),
    previewUpcomingActions(),
    isFeatureEnabled("deadline_autopilot"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="ui-kicker">Automation</p>
        <h1 className="ui-page-title">자동 마감 캘린더 봇</h1>
        <p className="mt-2 text-sm text-text-muted">
          활성 사건 마감 D-7 / D-3 / 당일 자동 리마인더 · 마감 후 {cfg.escalateAfterDays}일 뒤 에스컬레이션 (플래그: {flagOn ? "ON" : "OFF"})
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-strong">채널 · 템플릿</h2>
        <p className="mt-2 text-xs text-text-muted">
          채널: 이메일 {cfg.channels.email ? "ON" : "OFF"} · 카카오 {cfg.channels.kakao ? "ON" : "OFF"} · 관리자 로그 {cfg.channels.admin ? "ON" : "OFF"}
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {(Object.keys(cfg.templates) as Array<keyof typeof cfg.templates>).map((k) => (
            <li key={k} className="rounded-lg border border-line bg-surface-muted p-3">
              <p className="text-xs font-semibold text-text-strong">{INTERVAL_LABEL[k]} · {cfg.templates[k].subject}</p>
              <p className="mt-1 text-xs text-text-muted whitespace-pre-line">{cfg.templates[k].body}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-strong">예정된 자동 액션 ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">향후 7일 이내 예정된 자동 액션이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcoming.map((u) => (
              <li key={`${u.caseId}-${u.interval}`} className="flex items-center justify-between rounded-lg border border-line bg-surface-muted p-3 text-sm">
                <div>
                  <p className="font-semibold text-text-strong">{u.caseTitle}</p>
                  <p className="text-xs text-text-muted">마감: {new Date(u.dueDate).toLocaleDateString()}</p>
                </div>
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  {INTERVAL_LABEL[u.interval]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-strong">최근 자동 발송 로그 ({log.length})</h2>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">아직 발송 기록이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {log.map((entry, i) => (
              <li key={`${entry.caseId}-${entry.sentAt}-${i}`} className="rounded-lg border border-line bg-surface-muted p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-strong">{entry.caseTitle}</span>
                  <span
                    className={
                      entry.status === "sent"
                        ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                        : entry.status === "error"
                          ? "rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700"
                          : "rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
                    }
                  >
                    {entry.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {INTERVAL_LABEL[entry.interval]} · 채널: {entry.channels.join(", ") || "없음"} · {new Date(entry.sentAt).toLocaleString()}
                </p>
                {entry.message && <p className="mt-1 text-xs text-red-600">{entry.message}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
