"use client";

import { useState } from "react";

export function RunNowButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/scheduled-jobs/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(`성공 (${data.durationMs}ms)`);
      } else {
        setResult(`실패: ${data.error ?? "unknown"}`);
      }
    } catch (error) {
      setResult(`오류: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        className="rounded-md border border-line bg-surface px-3 py-1 text-xs font-medium text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
      >
        {loading ? "실행 중..." : "지금 실행"}
      </button>
      {result && <span className="text-xs text-text-muted">{result}</span>}
    </div>
  );
}
