"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReplyForm({ caseId }: { caseId?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "전송에 실패했습니다.");
      }
      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="메시지를 입력해 주세요…"
        className="w-full rounded-lg border border-line bg-surface p-3 text-sm focus:border-primary focus:outline-none"
        disabled={sending}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-50"
        >
          {sending ? "전송 중…" : "보내기"}
        </button>
      </div>
    </form>
  );
}
