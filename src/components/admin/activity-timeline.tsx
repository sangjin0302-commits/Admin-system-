"use client";

const EVENT_META: Record<string, { label: string; dot: string }> = {
  lawbot_analysis: { label: "AI 분석", dot: "bg-violet-500" },
  quote_generated: { label: "견적서", dot: "bg-amber-500" },
  case_status_changed: { label: "상태변경", dot: "bg-sky-500" },
  document_uploaded: { label: "서류", dot: "bg-teal-500" },
  submission_sent: { label: "접수", dot: "bg-indigo-500" },
  supplement_received: { label: "보완", dot: "bg-rose-500" },
  message: { label: "메시지", dot: "bg-emerald-500" },
};

export interface TimelineEvent {
  id: string;
  eventType: string;
  actorName: string | null;
  message: string;
  createdAt: string;
  caseTitle?: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}개월 전`;
  return `${Math.floor(diffMonth / 12)}년 전`;
}

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        기록된 활동이 없습니다.
      </p>
    );
  }

  return (
    <div className="max-h-[720px] overflow-y-auto pr-1">
      <ol className="relative">
        {events.map((ev, idx) => {
          const meta = EVENT_META[ev.eventType] ?? {
            label: ev.eventType,
            dot: "bg-slate-400",
          };
          const isLast = idx === events.length - 1;

          return (
            <li key={ev.id} className="flex gap-4">
              {/* Left: relative time */}
              <div className="w-20 flex-shrink-0 pt-1 text-right">
                <span className="text-[11px] leading-none text-text-muted">
                  {relativeTime(ev.createdAt)}
                </span>
              </div>

              {/* Center: vertical line + dot */}
              <div className="relative flex flex-col items-center">
                <span
                  className={`z-10 mt-1.5 h-3 w-3 flex-shrink-0 rounded-full border-2 border-surface ${meta.dot}`}
                />
                {!isLast && (
                  <span className="w-px flex-1 bg-line" />
                )}
              </div>

              {/* Right: event card */}
              <div className={`flex-1 pb-6 ${isLast ? "" : ""}`}>
                <div className="rounded-xl border border-line bg-surface p-3 shadow-sm transition-colors hover:border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {meta.label}
                    </span>
                    {ev.actorName && (
                      <span className="text-xs font-medium text-text-strong">
                        {ev.actorName}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-strong">{ev.message}</p>
                  {ev.caseTitle && (
                    <p className="mt-1 truncate text-xs text-text-muted">
                      사건: {ev.caseTitle}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
