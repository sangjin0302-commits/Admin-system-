/**
 * BBB3: 사건 진행 timeline.
 * CaseEvent 테이블 최근 20개 표시.
 *
 * Feature flag: `case_event_timeline`
 */

import { prisma } from "@/lib/prisma/client";
import { Card } from "@/components/ui/card";

const EVENT_ICONS: Record<string, string> = {
  STATUS_CHANGED: "🔄",
  DOCUMENT_ADDED: "📎",
  DOCUMENT_REMOVED: "❌",
  SUBMISSION: "📤",
  SUPPLEMENT: "📥",
  COMMENT: "💬",
  ASSIGNMENT: "👤",
  DUE_DATE_SET: "📅",
  CLOSED: "✅",
};

function timeAgo(when: Date): string {
  const ms = Date.now() - when.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return when.toLocaleDateString("ko-KR");
}

export async function CaseEventTimeline({ caseId }: { caseId: string }) {
  const events = await prisma.caseEvent.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch(() => []);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold">📋 진행 timeline</h3>
      {events.length === 0 ? (
        <p className="mt-3 text-xs text-text-muted">이벤트 기록 없음</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {events.map((e) => (
            <li key={e.id} className="relative flex gap-3">
              <span className="mt-0.5 text-base">{EVENT_ICONS[e.eventType] ?? "•"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text line-clamp-2">{e.message}</p>
                <p className="text-[10px] text-text-muted">
                  {e.eventType} · {e.actorName ?? "system"} · {timeAgo(e.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
