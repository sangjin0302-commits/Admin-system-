"use client";

import { useState } from "react";
import toast from "react-hot-toast";

type Message = { role: "user" | "bot"; content: string };

export function MarketBotChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/admin/market-bot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg.content }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "분석 실패");
        return;
      }
      setMessages((m) => [...m, { role: "bot", content: data.answer }]);
    } catch {
      toast.error("오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-h-[500px] min-h-[300px] space-y-3 overflow-y-auto rounded-lg border border-line bg-surface-muted p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-text-muted">
            업종·시장·경쟁사 관련 질문을 입력하세요.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "rounded-lg bg-primary px-4 py-2.5 text-sm text-white"
                  : "rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-text-strong whitespace-pre-wrap"
              }
            >
              {m.content}
            </div>
          ))
        )}
        {loading && (
          <div className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-text-muted">
            분석 중...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="예: 행정사 시장의 경쟁 강도와 진입 장벽은?"
          className="flex-1 rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
