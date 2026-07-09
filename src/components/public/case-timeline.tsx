/**
 * 사건 진행 타임라인 — 의뢰인 사건 상세 페이지에 표시.
 * 현재 상태를 받아 단계 별 진행도를 시각화.
 *
 * III1: `liveEnabled` + `caseId` 주어지면 /api/portal/cases/{id}/timeline에서
 * 실제 이벤트를 fetch하여 단계 아래에 시간순 목록으로 표시. 실패/비활성 시 정적 단계만.
 */

"use client";

import { useEffect, useState } from "react";

type Phase = { key: string; label: string; duration: string; statuses: readonly string[] };

type LiveEvent = { step: string; status: string; date: string; description: string };

const PHASES: readonly Phase[] = [
  { key: "intake", label: "접수 / 상담", duration: "1~3일", statuses: ["INTAKE_REVIEW", "CONSULTING", "QUOTED", "CONTRACT_PENDING"] },
  { key: "prepare", label: "자료 준비", duration: "3~7일", statuses: ["OPEN", "DOCUMENT_COLLECTING", "DOCUMENT_REVIEWING"] },
  { key: "submit", label: "제출", duration: "1~2일", statuses: ["READY_TO_SUBMIT", "SUBMITTED", "SUPPLEMENT_REQUESTED"] },
  { key: "wait", label: "기관 처리", duration: "14~90일", statuses: ["WAITING_AGENCY", "RESULT_RECEIVED"] },
  { key: "close", label: "종결", duration: "1~3일", statuses: ["CLOSING", "CLOSED"] }
];

const STATUS_LABELS: Record<string, string> = {
  INTAKE_REVIEW: "접수 검토 중",
  CONSULTING: "상담 중",
  QUOTED: "견적 안내됨",
  CONTRACT_PENDING: "계약 준비 중",
  OPEN: "사건 개시",
  DOCUMENT_COLLECTING: "자료 수집 중",
  DOCUMENT_REVIEWING: "자료 검토 중",
  READY_TO_SUBMIT: "제출 준비 완료",
  SUBMITTED: "기관 제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청 받음",
  WAITING_AGENCY: "기관 처리 대기",
  RESULT_RECEIVED: "결과 통보 받음",
  CLOSING: "사건 마무리 중",
  CLOSED: "사건 종결",
  CANCELLED: "사건 취소",
  ON_HOLD: "보류"
};

function getActivePhaseIndex(status: string): number {
  for (let i = 0; i < PHASES.length; i += 1) {
    if (PHASES[i].statuses.includes(status)) return i;
  }
  if (status === "CANCELLED") return -1;
  if (status === "ON_HOLD") return 0;
  return 0;
}

const pulseKeyframes = `
@keyframes ethos-phase-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201, 169, 97, 0.45); }
  50% { box-shadow: 0 0 0 8px rgba(201, 169, 97, 0); }
}
`;

export function CaseTimeline({
  status,
  caseId,
  liveEnabled,
}: {
  status: string;
  caseId?: string;
  liveEnabled?: boolean;
}) {
  const activeIndex = getActivePhaseIndex(status);
  const statusLabel = STATUS_LABELS[status] ?? status;
  const [liveEvents, setLiveEvents] = useState<LiveEvent[] | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    if (!liveEnabled || !caseId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/portal/cases/${caseId}/timeline`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as { ok?: boolean; events?: LiveEvent[] };
        if (!cancelled && data.ok && Array.isArray(data.events)) {
          setLiveEvents(data.events);
        }
      } catch (err) {
        if (!cancelled) setLiveError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [liveEnabled, caseId]);

  return (
    <section aria-labelledby="case-timeline-heading" className="ethos-card p-7">
      <style dangerouslySetInnerHTML={{ __html: pulseKeyframes }} />
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="ethos-eyebrow">Progress</p>
          <h2 id="case-timeline-heading" className="ethos-display mt-2 text-xl">
            사건 진행 단계
          </h2>
        </div>
        <span className="rounded-full bg-gold-soft/60 px-3 py-1 font-serif text-xs font-bold text-gold-deep">
          현재: {statusLabel}
        </span>
      </div>

      {/* 데스크탑 가로 타임라인 */}
      <ol className="mt-10 hidden grid-cols-5 gap-2 md:grid">
        {PHASES.map((phase, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={phase.key} className="relative flex flex-col items-center text-center">
              {/* 연결선 */}
              {i < PHASES.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-1/2 top-4 h-0.5 w-full ${done ? "bg-gold" : "bg-gold/15"}`}
                />
              )}

              {/* 동그라미 */}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 font-serif text-xs font-bold transition ${
                  done
                    ? "border-gold bg-gold text-white"
                    : active
                    ? "border-gold bg-surface text-primary ring-4 ring-gold/30"
                    : "border-gold/30 bg-surface text-text-muted"
                }`}
                style={active ? { animation: "ethos-phase-pulse 2s ease-in-out infinite" } : undefined}
              >
                {done ? "✓" : i + 1}
              </span>

              <p
                className={`mt-3 font-serif text-xs font-bold ${
                  active ? "text-primary" : done ? "text-text" : "text-text-muted"
                }`}
              >
                {phase.label}
              </p>
              <p className="mt-0.5 text-[10px] text-text-muted">
                {phase.duration}
              </p>
            </li>
          );
        })}
      </ol>

      {/* 모바일 세로 타임라인 */}
      <ol className="mt-8 space-y-3 md:hidden">
        {PHASES.map((phase, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={phase.key} className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 font-serif text-xs font-bold ${
                  done
                    ? "border-gold bg-gold text-white"
                    : active
                    ? "border-gold bg-surface text-primary ring-4 ring-gold/30"
                    : "border-gold/30 bg-surface text-text-muted"
                }`}
                style={active ? { animation: "ethos-phase-pulse 2s ease-in-out infinite" } : undefined}
              >
                {done ? "✓" : i + 1}
              </span>
              <div>
                <p
                  className={`font-serif text-sm font-bold ${
                    active ? "text-primary" : done ? "text-text" : "text-text-muted"
                  }`}
                >
                  {phase.label}
                </p>
                <p className="text-[10px] text-text-muted">
                  {phase.duration}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 text-center text-xs text-text-muted">
        예상 소요 기간은 사안에 따라 달라질 수 있습니다.
      </p>

      {liveEnabled && liveEvents && liveEvents.length > 0 && (
        <div className="mt-8 border-t border-gold/20 pt-6">
          <p className="ethos-eyebrow">Live Events</p>
          <ol className="mt-4 space-y-3">
            {liveEvents.map((ev, i) => (
              <li key={`${ev.step}-${i}`} className="border-l-2 border-gold/40 pl-4">
                <p className="text-xs text-text-muted">
                  {new Date(ev.date).toLocaleString("ko-KR")} · {ev.status}
                </p>
                <p className="mt-1 text-sm text-text">{ev.description}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {liveEnabled && liveError && (
        <p className="mt-4 text-[10px] text-text-muted">
          실시간 타임라인을 불러오지 못했습니다.
        </p>
      )}

      {(status === "CANCELLED" || status === "ON_HOLD") && (
        <p className="mt-6 rounded-lg border-l-2 border-amber-400 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          현재 사건이 {status === "CANCELLED" ? "취소" : "보류"} 상태입니다. 자세한 사항은 담당자에게 문의해 주세요.
        </p>
      )}
    </section>
  );
}
