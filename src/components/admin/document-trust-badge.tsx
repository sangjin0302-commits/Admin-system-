"use client";

import { useCallback, useEffect, useState } from "react";

interface TrustScore {
  trustScore: number;
  gaps: string[];
  concerns: string[];
  recommendations: string[];
  breakdown: {
    completeness: number;
    legibility: number;
    consistency: number;
    authenticity: number;
    recency: number;
  };
  source: "ai" | "heuristic";
  scoredAt: string;
}

function toneClass(score: number): { label: string; className: string } {
  if (score >= 0.75) return { label: "높음", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (score >= 0.5) return { label: "보통", className: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "낮음", className: "bg-red-100 text-red-700 border-red-200" };
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span>{label}</span>
      <span className="font-mono">{Math.round(value)}</span>
    </div>
  );
}

export function DocumentTrustBadge({ documentId }: { documentId: string }) {
  const [score, setScore] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}/trust-score`);
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "조회 실패");
      else setScore(json.score);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const compute = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}/trust-score`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "계산 실패");
      else setScore(json.score);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    load();
  }, [load]);

  const tone = score ? toneClass(score.trustScore) : null;

  return (
    <>
      <button
        type="button"
        onClick={score ? () => setOpen(true) : compute}
        disabled={loading}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
          tone?.className ?? "bg-gray-100 text-gray-600 border-gray-200"
        }`}
        title="신뢰도 상세 보기"
      >
        <span>신뢰도</span>
        <span>{score ? `${Math.round(score.trustScore * 100)}% · ${tone?.label}` : loading ? "…" : "미계산"}</span>
      </button>

      {open && score ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">서류 신뢰도 상세</p>
              <button className="text-xs text-text-muted" onClick={() => setOpen(false)}>
                닫기
              </button>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              총점 {Math.round(score.trustScore * 100)}% · {score.source === "ai" ? "AI 판단" : "휴리스틱"}
            </p>

            <div className="mt-3 space-y-1">
              <Row label="완결성" value={score.breakdown.completeness} />
              <Row label="가독성" value={score.breakdown.legibility} />
              <Row label="일관성" value={score.breakdown.consistency} />
              <Row label="진위 신호" value={score.breakdown.authenticity} />
              <Row label="최신성" value={score.breakdown.recency} />
            </div>

            {score.gaps.length ? (
              <div className="mt-3 rounded bg-amber-50 p-2 text-xs">
                <p className="font-medium">누락</p>
                <ul className="list-disc pl-4">
                  {score.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {score.concerns.length ? (
              <div className="mt-2 rounded bg-red-50 p-2 text-xs">
                <p className="font-medium">우려 사항</p>
                <ul className="list-disc pl-4">
                  {score.concerns.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {score.recommendations.length ? (
              <div className="mt-2 rounded bg-blue-50 p-2 text-xs">
                <p className="font-medium">권장 조치</p>
                <ul className="list-disc pl-4">
                  {score.recommendations.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-3 flex justify-end">
              <button className="rounded border px-3 py-1 text-xs" onClick={compute} disabled={loading}>
                재계산
              </button>
            </div>
            {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
