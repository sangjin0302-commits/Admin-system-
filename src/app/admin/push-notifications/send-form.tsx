"use client";

import { useState, useTransition } from "react";

export function SendPushForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetTokens, setTargetTokens] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const tokens = targetTokens
          .split(/[\s,]+/)
          .map((t) => t.trim())
          .filter(Boolean);
        const res = await fetch("/api/admin/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            body,
            targetTokens: tokens.length ? tokens : undefined,
          }),
        });
        const data = await res.json();
        setMessage(
          data.success
            ? `발송 ${data.data?.sent ?? 0}건, 실패 ${data.data?.failed ?? 0}건`
            : `오류: ${data.error ?? "알 수 없음"}`
        );
      } catch (err) {
        setMessage(`오류: ${(err as Error).message}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          제목
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">내용</label>
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full border rounded px-3 py-1.5 text-sm"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          대상 토큰 (쉼표 또는 공백으로 구분, 비워 두면 전체 기기로 발송)
        </label>
        <textarea
          value={targetTokens}
          onChange={(e) => setTargetTokens(e.target.value)}
          className="w-full border rounded px-3 py-1.5 text-sm font-mono"
          rows={2}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="text-sm px-3 py-1.5 border rounded"
        >
          {isPending ? "발송하는 중…" : "푸시 알림 발송"}
        </button>
        {message ? (
          <span className="text-xs text-muted-foreground">{message}</span>
        ) : null}
      </div>
    </form>
  );
}
