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
            ? `Sent: ${data.data?.sent ?? 0}, Failed: ${data.data?.failed ?? 0}`
            : `Error: ${data.error ?? "unknown"}`
        );
      } catch (err) {
        setMessage(`Error: ${(err as Error).message}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          Title
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
        <label className="block text-xs text-muted-foreground mb-1">Body</label>
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
          Target Tokens (comma/space separated; leave empty for all devices)
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
          {isPending ? "Sending..." : "Send Push"}
        </button>
        {message ? (
          <span className="text-xs text-muted-foreground">{message}</span>
        ) : null}
      </div>
    </form>
  );
}
