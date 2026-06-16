import Link from "next/link";

import { prisma } from "@/lib/prisma/client";
import { formatDateTime } from "@/lib/utils";

const EVENT_META: Record<string, { label: string; dot: string }> = {
  lawbot_analysis: { label: "AI 분석", dot: "bg-violet-500" },
  quote_generated: { label: "견적서", dot: "bg-amber-500" },
  case_status_changed: { label: "상태변경", dot: "bg-sky-500" },
  message: { label: "메시지", dot: "bg-emerald-500" }
};

/** 대시보드 최근 활동 — 전 사건 CaseEvent 최근 12건. */
export async function RecentActivityCard() {
  let events: { id: string; caseId: string; eventType: string; message: string; createdAt: Date }[] = [];
  try {
    events = await prisma.caseEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, caseId: true, eventType: true, message: true, createdAt: true }
    });
  } catch {
    events = [];
  }

  return (
    <div className="rounded-[20px] border border-line bg-surface p-5 shadow-panel sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="ui-kicker">Activity</p>
          <h2 className="mt-1 text-lg font-semibold text-text-strong">최근 활동</h2>
        </div>
        <Link href="/admin/cases" className="text-xs font-semibold text-primary hover:underline">
          사건 목록 →
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">아직 기록된 활동이 없습니다.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {events.map((e) => {
            const meta = EVENT_META[e.eventType] ?? { label: e.eventType, dot: "bg-slate-400" };
            return (
              <li key={e.id} className="flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${meta.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/cases/${e.caseId}`}
                      className="truncate text-sm font-medium text-text-strong hover:text-primary"
                    >
                      <span className="text-xs font-bold text-gold-deep">[{meta.label}]</span> {e.message}
                    </Link>
                    <span className="flex-shrink-0 text-[11px] text-text-muted">{formatDateTime(e.createdAt)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
