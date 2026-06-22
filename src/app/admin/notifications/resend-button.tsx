"use client";

import { useState } from "react";

export function ResendButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function fire() {
    setBusy(true);
    setDone(null);
    try {
      const res = await fetch(`/api/admin/notifications/${id}/resend`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDone(data.error ?? "실패");
        return;
      }
      setDone(data.sent ? "재발송 OK" : "다시 실패");
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setDone("네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={fire}
      disabled={busy}
      className="rounded border border-line bg-white px-2 py-0.5 text-xs hover:bg-surface-muted disabled:opacity-50"
      title={done ?? "재발송"}
    >
      {busy ? "…" : done ?? "재발송"}
    </button>
  );
}
