"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Prediction {
  successProbability: number;
  confidence: number;
  keyFactors: string[];
  riskFactors: string[];
  similarPastCases: Array<{ slug: string; title: string; outcome: string }>;
  recommendation: string;
  reasoning: string;
  source: "ai" | "heuristic";
  predictedAt: string;
}

function Gauge({ value }: { value: number }) {
  // value: 0-1
  const pct = Math.max(0, Math.min(1, value));
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const color = pct >= 0.7 ? "#10b981" : pct >= 0.5 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" role="img" aria-label={`승소 예상 ${Math.round(pct * 100)}%`}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={c * 0.25}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="60" textAnchor="middle" fontSize="20" fontWeight="700" fill={color}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

export function CaseOutcomeCard({ caseId }: { caseId: string }) {
  const [pred, setPred] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/outcome-predict`);
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "조회 실패");
      else setPred(json.prediction);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const compute = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/outcome-predict`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "예측 실패");
      else setPred(json.prediction);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="ui-kicker">예상 결과 분석</p>
          <p className="text-xs text-text-muted">사건 조건·판례·증거 기반 승소 예측</p>
        </div>
        <button className="rounded border px-2 py-1 text-xs" onClick={compute} disabled={loading}>
          {loading ? "분석중..." : "재분석"}
        </button>
      </div>

      {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}

      {pred ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center">
            <Gauge value={pred.successProbability} />
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-emerald-700">긍정 요인</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                {pred.keyFactors.length ? pred.keyFactors.slice(0, 3).map((f, i) => <li key={i}>{f}</li>) : <li className="text-text-muted">정보 부족</li>}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-red-700">리스크 요인</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                {pred.riskFactors.length ? pred.riskFactors.slice(0, 3).map((f, i) => <li key={i}>{f}</li>) : <li className="text-text-muted">특이 리스크 없음</li>}
              </ul>
            </div>
            {pred.similarPastCases.length ? (
              <div>
                <p className="text-xs font-medium text-text-muted">유사 과거 사례</p>
                <ul className="mt-1 space-y-0.5 pl-5 text-xs">
                  {pred.similarPastCases.map((s) => (
                    <li key={s.slug} className="list-disc">
                      <span className="font-medium">{s.title}</span>
                      <span className="text-text-muted"> — {s.outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="rounded bg-surface-muted p-2 text-xs">
              <p className="font-medium">권장</p>
              <p>{pred.recommendation}</p>
              <p className="mt-1 text-text-muted">
                신뢰도 {Math.round(pred.confidence * 100)}% · {pred.source === "ai" ? "AI 판단" : "휴리스틱"} · {pred.reasoning}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-text-muted">아직 예측이 없습니다. "재분석"을 눌러 실행하세요.</p>
      )}
    </Card>
  );
}
