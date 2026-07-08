"use client";

import { useState } from "react";

export default function DocumentCritiqueClient() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/mentor/document-critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({} as { critique?: string; error?: string }));
      setResult(data.critique ?? data.error ?? "응답 없음");
    } catch (err) {
      setResult(`오류: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="본인 서면 초안을 붙여넣기하세요..."
        className="w-full min-h-[240px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text"
      />
      <button
        onClick={submit}
        disabled={loading || !text.trim()}
        className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "채점 중…" : "5개 축 채점"}
      </button>
      {result ? (
        <pre className="whitespace-pre-wrap rounded-xl border border-line bg-surface-muted p-4 text-sm text-text">
          {result}
        </pre>
      ) : null}
    </div>
  );
}
