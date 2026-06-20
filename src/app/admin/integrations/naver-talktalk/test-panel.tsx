"use client";

import { useState } from "react";

export function NaverTalkTalkTestPanel() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("테스트 메시지입니다.");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSend() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/admin/naver-talktalk/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        className="rounded border border-line px-3 py-2 text-sm"
        placeholder="대상 userId"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <textarea
        className="rounded border border-line px-3 py-2 text-sm"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={onSend}
        disabled={loading || !userId}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "전송 중..." : "테스트 전송"}
      </button>
      {result && (
        <pre className="rounded bg-surface-muted p-2 text-xs">{result}</pre>
      )}
    </div>
  );
}
