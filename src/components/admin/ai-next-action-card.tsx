"use client";

import { useEffect, useState } from "react";

type Recommendation = {
  action: string;
  confidence: number;
  reasoning: string;
  params: Record<string, string>;
};

type NextActionPayload = {
  caseId: string;
  top: Recommendation;
  alternates: Recommendation[];
  generatedAt: string;
};

const LABELS: Record<string, string> = {
  request_docs: "서류 요청",
  send_reminder: "리마인더 발송",
  schedule_meeting: "미팅 예약",
  draft_document: "서면 초안 작성",
  close_case: "사건 종결",
  escalate: "에스컬레이션",
};

export function AiNextActionCard({ caseId }: { caseId: string }) {
  const [data, setData] = useState<NextActionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/cases/${caseId}/next-action`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { result?: NextActionPayload };
        if (!cancelled) setData(json.result ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function submitFeedback(action: string, verdict: "accepted" | "rejected") {
    setBusy(true);
    try {
      await fetch(`/api/admin/cases/${caseId}/next-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, verdict }),
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 text-sm text-text-muted">AI 추천 액션 로딩 중…</div>
    );
  }
  if (error) {
    return <div className="rounded-xl border border-line bg-surface p-4 text-sm text-text-muted">AI 추천 실패: {error}</div>;
  }
  if (!data) {
    return null;
  }

  const all: Recommendation[] = [data.top, ...data.alternates].slice(0, 3);
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="ui-kicker">AI 의사결정 트리</p>
          <h3 className="text-sm font-semibold text-text-strong">AI 추천 액션</h3>
        </div>
        <span className="text-xs text-text-muted">{new Date(data.generatedAt).toLocaleTimeString()}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {all.map((rec, i) => (
          <li
            key={`${rec.action}-${i}`}
            className={`rounded-lg border p-3 ${
              i === 0 ? "border-emerald-200 bg-emerald-50/50" : "border-line bg-surface-muted"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-strong">
                {LABELS[rec.action] ?? rec.action}
              </span>
              <span className="text-xs text-text-muted">신뢰도 {Math.round(rec.confidence * 100)}%</span>
            </div>
            <p className="mt-1 text-xs text-text-muted">{rec.reasoning}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => submitFeedback(rec.action, "accepted")}
                className="inline-flex h-7 items-center rounded-md border border-emerald-300 bg-emerald-100 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
              >
                실행
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => submitFeedback(rec.action, "rejected")}
                className="inline-flex h-7 items-center rounded-md border border-line bg-surface px-3 text-xs font-medium text-text-muted transition hover:bg-surface-muted disabled:opacity-50"
              >
                거부
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
