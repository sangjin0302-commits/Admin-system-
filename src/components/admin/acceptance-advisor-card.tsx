"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

type Decision = "accept" | "decline" | "conditional";

interface Advice {
  recommend: Decision;
  confidence: number;
  reasoning: string;
  conditions?: string[];
  alternatives?: string[];
  scores: {
    complexityFit: number;
    financial: number;
    successChance: number;
    risk: number;
  };
  source: "ai" | "heuristic";
  adjudicatedAt: string;
}

const DECISION_STYLE: Record<Decision, { label: string; className: string }> = {
  accept: { label: "수락 권장", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  decline: { label: "거절 권장", className: "bg-red-100 text-red-700 border-red-200" },
  conditional: { label: "조건부", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

function ScoreBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const goodHigh = !invert;
  const color =
    (goodHigh && value >= 65) || (invert && value < 35)
      ? "bg-emerald-500"
      : (goodHigh && value >= 40) || (invert && value < 65)
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="mt-0.5 h-1.5 w-full rounded bg-gray-200">
        <div className={`h-1.5 rounded ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

export function AcceptanceAdvisorCard({ inquiryId, status }: { inquiryId: string; status?: string }) {
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/acceptance-advice`);
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "조회 실패");
      else setAdvice(json.advice);
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  const compute = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/acceptance-advice`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "실행 실패");
      else setAdvice(json.advice);
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    load();
  }, [load]);

  const emphasize = status === "NEW";
  const style = advice ? DECISION_STYLE[advice.recommend] : null;

  return (
    <Card className={`p-5 ${emphasize ? "border-2 border-primary" : ""}`}>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="ui-kicker">수임 여부 AI 조언</p>
          <p className="text-xs text-text-muted">복잡도·경제성·성공가능성·리스크 종합 판단</p>
        </div>
        <button className="rounded border px-2 py-1 text-xs" onClick={compute} disabled={loading}>
          {loading ? "실행중..." : "재실행"}
        </button>
      </div>

      {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}

      {advice ? (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${style?.className ?? ""}`}>
              {style?.label ?? "판단 없음"}
            </span>
            <span className="text-xs text-text-muted">신뢰도 {Math.round(advice.confidence * 100)}%</span>
          </div>

          <p className="text-xs">{advice.reasoning}</p>

          <div className="grid grid-cols-2 gap-2">
            <ScoreBar label="실무 적합성" value={advice.scores.complexityFit} />
            <ScoreBar label="경제성" value={advice.scores.financial} />
            <ScoreBar label="성공 가능성" value={advice.scores.successChance} />
            <ScoreBar label="리스크" value={advice.scores.risk} invert />
          </div>

          {advice.conditions?.length ? (
            <div className="rounded bg-amber-50 p-2 text-xs">
              <p className="font-medium">조건</p>
              <ul className="list-disc pl-4">
                {advice.conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {advice.alternatives?.length ? (
            <div className="rounded bg-blue-50 p-2 text-xs">
              <p className="font-medium">대안</p>
              <ul className="list-disc pl-4">
                {advice.alternatives.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
              onClick={() => window.dispatchEvent(new CustomEvent("inquiry:decision", { detail: { inquiryId, decision: "accept" } }))}
            >
              수락
            </button>
            <button
              type="button"
              className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
              onClick={() => window.dispatchEvent(new CustomEvent("inquiry:decision", { detail: { inquiryId, decision: "decline" } }))}
            >
              거절
            </button>
            <button
              type="button"
              className="rounded bg-amber-500 px-3 py-1.5 text-xs font-medium text-white"
              onClick={() => window.dispatchEvent(new CustomEvent("inquiry:decision", { detail: { inquiryId, decision: "conditional" } }))}
            >
              조건부
            </button>
          </div>

          <p className="text-[10px] text-text-muted">{advice.source === "ai" ? "AI 판단" : "휴리스틱 판단"}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-text-muted">아직 조언이 없습니다. "재실행"을 눌러 시작하세요.</p>
      )}
    </Card>
  );
}
