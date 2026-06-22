"use client";

import { useState } from "react";

export function LawbotRerunButton({ caseId }: { caseId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rerun() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/lawbot-analyze`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "재분석 요청 실패");
        return;
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={rerun}
        disabled={busy}
        className="rounded border border-line bg-white px-2.5 py-1 text-xs hover:bg-surface-muted disabled:opacity-50"
      >
        {busy ? "분석중…" : "재분석"}
      </button>
      {error && <p className="mt-1 text-xs text-rose-700">{error}</p>}
    </div>
  );
}
