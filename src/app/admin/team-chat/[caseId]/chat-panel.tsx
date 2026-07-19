"use client";

import { useEffect, useRef, useState } from "react";

type SerializedMessage = {
  id: string;
  caseId: string;
  authorEmail: string;
  authorName: string;
  message: string;
  createdAt: string;
  mentions: string[];
};

export function ChatPanel({
  caseId,
  initialMessages,
}: {
  caseId: string;
  initialMessages: SerializedMessage[];
}) {
  const [messages, setMessages] = useState<SerializedMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [authorEmail, setAuthorEmail] = useState("admin@ethos.com");
  const [authorName, setAuthorName] = useState("Admin");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/team-chat?caseId=${encodeURIComponent(caseId)}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages ?? []);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [caseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/team-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, message: input, authorEmail, authorName }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setInput("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          className="rounded border px-2 py-1 text-sm"
          placeholder="이름"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
        <input
          className="rounded border px-2 py-1 text-sm"
          placeholder="이메일"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
        />
      </div>

      <div className="h-80 overflow-y-auto rounded border p-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-sm text-text-muted">아직 메시지가 없습니다.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="mb-2">
              <div className="text-xs text-text-muted">
                <span className="font-semibold">{m.authorName}</span> ·{" "}
                {new Date(m.createdAt).toLocaleString()}
              </div>
              <div className="text-sm">{m.message}</div>
              {m.mentions.length > 0 && (
                <div className="text-xs text-blue-600">
                  멘션: {m.mentions.map((u) => `@${u}`).join(", ")}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          className="flex-1 rounded border px-2 py-1 text-sm"
          placeholder="메시지를 입력하세요… (@이름 으로 멘션)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          발송
        </button>
      </form>
    </div>
  );
}
