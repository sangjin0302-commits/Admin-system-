"use client";

import { useState } from "react";

type SyncResult = {
  ok: boolean;
  imported: number;
  skipped: number;
  translated: number;
  errors: string[];
};

export function ImportControls() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/blog-import", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "요청 실패" }));
        throw new Error(err.error ?? "요청 실패");
      }
      const data = (await res.json()) as SyncResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong disabled:opacity-60"
      >
        {loading ? "동기화 중..." : "지금 동기화"}
      </button>
      {result && (
        <div className="rounded-lg border border-line bg-surface-muted/40 p-3 text-xs text-text">
          <p>
            가져옴: <strong>{result.imported}</strong> · 건너뜀:{" "}
            <strong>{result.skipped}</strong> · 번역됨:{" "}
            <strong>{result.translated}</strong>
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-danger">
              {result.errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-danger bg-danger/10 p-3 text-xs text-danger">
          {error}
        </div>
      )}
    </div>
  );
}
