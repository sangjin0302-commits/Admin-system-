"use client";

import { useState, useTransition } from "react";

import { Card } from "@/components/ui/card";

interface ProposedSlot {
  slotKey: string;
  date: string;
  time: string;
  label: string;
}

type SchedulingStatus =
  | "IDLE"
  | "EMAIL_DRAFTED"
  | "EMAIL_SENT"
  | "CLIENT_OPENED"
  | "AWAITING_REPLY"
  | "CONFIRMED"
  | "CANCELLED";

interface SchedulingSession {
  inquiryId: string;
  status: SchedulingStatus;
  proposedSlots: ProposedSlot[];
  emailSubject: string;
  emailBody: string;
  replyToken: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  lastFollowUpAt: string | null;
  confirmedSlotKey: string | null;
  history: Array<{ at: string; event: string; note?: string }>;
}

const STATUS_LABEL: Record<SchedulingStatus, string> = {
  IDLE: "대기",
  EMAIL_DRAFTED: "초안 준비",
  EMAIL_SENT: "발송됨",
  CLIENT_OPENED: "확인함",
  AWAITING_REPLY: "답변 대기",
  CONFIRMED: "확정",
  CANCELLED: "취소"
};

export function SchedulingBotClient({
  inquiryId,
  initialSession
}: {
  inquiryId: string;
  initialSession: SchedulingSession | null;
}) {
  const [session, setSession] = useState<SchedulingSession | null>(initialSession);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const call = (payload: Record<string, unknown>) => {
    setError(null);
    startBusy(async () => {
      try {
        const res = await fetch(`/api/admin/inquiries/${inquiryId}/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = (await res.json()) as { ok?: boolean; session?: SchedulingSession; message?: string };
        if (!res.ok || !data.ok) throw new Error(data.message ?? "요청 실패");
        if (data.session) setSession(data.session);
      } catch (e) {
        setError(e instanceof Error ? e.message : "요청 실패");
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          {!session && (
            <button
              type="button"
              onClick={() => call({ action: "draft" })}
              disabled={busy}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "생성 중…" : "AI 일정 조율 시작"}
            </button>
          )}
          {session && (
            <>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs">
                상태: <span className="font-semibold">{STATUS_LABEL[session.status]}</span>
              </span>
              {session.status === "EMAIL_DRAFTED" && (
                <button
                  type="button"
                  onClick={() => call({ action: "send" })}
                  disabled={busy}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "발송 중…" : "이메일 발송"}
                </button>
              )}
              <button
                type="button"
                onClick={() => call({ action: "draft" })}
                disabled={busy}
                className="rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
              >
                다시 초안 생성
              </button>
            </>
          )}
        </div>
        {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      </Card>

      {session && (
        <>
          <Card className="p-5">
            <p className="ui-kicker">이메일 미리보기</p>
            <p className="mt-2 text-sm font-semibold">제목: {session.emailSubject}</p>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-black/5 p-3 text-xs font-sans">{session.emailBody}</pre>
            <p className="mt-2 text-[11px] text-text-muted">참조 코드: [SCHED:{session.replyToken}]</p>
          </Card>

          <Card className="p-5">
            <p className="ui-kicker">제안된 시간대</p>
            <ol className="mt-2 space-y-1 text-sm">
              {session.proposedSlots.map((s, i) => (
                <li
                  key={s.slotKey}
                  className={`rounded-md border p-2 ${
                    session.confirmedSlotKey === s.slotKey
                      ? "border-emerald-400 bg-emerald-50/60"
                      : "border-border/60"
                  }`}
                >
                  {i + 1}. {s.label}
                  {session.confirmedSlotKey === s.slotKey && (
                    <span className="ml-2 text-xs text-emerald-700 font-medium">확정</span>
                  )}
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <p className="ui-kicker">이력</p>
            <ul className="mt-2 space-y-1 text-xs text-text-muted">
              {session.history.slice().reverse().map((h, i) => (
                <li key={i}>
                  <span className="font-mono">{new Date(h.at).toLocaleString()}</span> — {h.event}
                  {h.note ? ` (${h.note})` : ""}
                </li>
              ))}
            </ul>
            {session.sentAt && (
              <p className="mt-3 text-xs text-text-muted">
                발송: {new Date(session.sentAt).toLocaleString()}
                {session.lastFollowUpAt ? ` · 팔로우업: ${new Date(session.lastFollowUpAt).toLocaleString()}` : ""}
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
