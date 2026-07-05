"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Prediction {
  suggestions: string[];
  reasoning: string;
  confidence: number;
  source: string;
  predictedAt: string;
}

export function NeedsPredictionCard({ caseId }: { caseId: string }) {
  const [pred, setPred] = useState<Prediction | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/needs-prediction`);
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

  async function makeDraft() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/needs-prediction`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "초안 실패");
      else {
        setDraft(json.draft);
        setSent(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setSent(true);
    } catch {
      /* noop */
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="ui-kicker">니즈 예측</p>
          <p className="text-xs text-text-muted">고객의 다음 요청/서류를 미리 안내하세요.</p>
        </div>
        <button className="rounded border px-2 py-1 text-xs" onClick={load} disabled={loading}>
          다시 예측
        </button>
      </div>

      {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}

      {pred ? (
        <div className="mt-3 space-y-2 text-sm">
          <ol className="list-decimal space-y-1 pl-5">
            {pred.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p className="text-xs text-text-muted">
            신뢰도 {Math.round(pred.confidence * 100)}% · {pred.source} · {pred.reasoning}
          </p>
          <button
            className="rounded bg-primary px-3 py-1.5 text-xs text-white"
            onClick={makeDraft}
            disabled={loading}
          >
            고객에게 제안 (초안 생성)
          </button>
        </div>
      ) : null}

      {draft ? (
        <div className="mt-3 rounded border bg-surface-muted p-3 text-xs">
          <pre className="whitespace-pre-wrap break-words">{draft}</pre>
          <button className="mt-2 rounded border px-2 py-1" onClick={copy}>
            {sent ? "복사됨 ✓" : "메시지 복사"}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
