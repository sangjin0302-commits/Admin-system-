"use client";

import { useState } from "react";

export function InquiryLawbotRerunButton({ inquiryId }: { inquiryId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function rerun() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/admin/inquiries/${inquiryId}/lawbot-analysis`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.error ?? "재분석 실패");
        return;
      }
      setMsg("재분석 완료 — 페이지를 새로고침합니다.");
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={rerun}
        disabled={busy}
        className="rounded border border-line bg-white px-3 py-1.5 text-xs hover:bg-surface-muted disabled:opacity-50"
      >
        {busy ? "AI 분석중…" : "Lawbot 재분석"}
      </button>
      {msg && <p className="text-xs text-text-muted">{msg}</p>}
    </div>
  );
}
