"use client";

import { useState } from "react";

export function BriefingButton() {
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/advisor/briefing", { method: "POST" });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `briefing-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="inline-flex h-9 items-center rounded-lg border border-primary bg-surface px-4 text-xs font-semibold text-primary transition hover:bg-gold-soft/30 disabled:opacity-50"
    >
      {busy ? "생성 중…" : "브리핑 PDF 내려받기"}
    </button>
  );
}
