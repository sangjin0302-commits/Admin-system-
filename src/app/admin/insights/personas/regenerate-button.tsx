"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegeneratePersonasButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/insights/personas", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white disabled:opacity-50 hover:bg-text-strong"
      >
        {busy ? "분석 중..." : "재분석"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
