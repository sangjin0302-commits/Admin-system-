"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  at?: string;
}

// 이메일 입력칸은 제거됐다. 대화 주체는 언제나 로그인한 본인이며, 서버가 세션에서
// 신원을 읽는다. 예전에는 남의 이메일만 넣으면 그 사람의 VIP 상담 내역이 그대로 열렸다.
export function ConciergeClient() {
  const [plan, setPlan] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [input, setInput] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [pending, setPending] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadThread = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/portal/concierge");
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr(json.error === "NOT_VIP" ? "VIP 회원 전용 서비스입니다." : json.error ?? "조회 실패");
        setPlan(null);
        setThread([]);
      } else {
        setPlan(json.plan);
        setThread(Array.isArray(json.thread) ? json.thread : []);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    }
  }, []);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, pending]);

  async function send() {
    const message = input.trim();
    if (!message) return;
    setThread((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setStreaming(true);
    setPending("");
    setErr(null);
    try {
      const res = await fetch("/api/portal/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        setErr(json?.error ?? "응답 실패");
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const lines = part.split("\n");
          const evLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!evLine || !dataLine) continue;
          const ev = evLine.slice(6).trim();
          const data = dataLine.slice(5).trim();
          try {
            const parsed = JSON.parse(data);
            if (ev === "delta") {
              acc += parsed.text ?? "";
              setPending(acc);
            } else if (ev === "done") {
              setThread((prev) => [...prev, { role: "assistant", content: acc }]);
              setPending("");
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="space-y-3">
      {plan ? (
        <p className="text-xs text-text-muted">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{plan.toUpperCase()}</span>
        </p>
      ) : null}
      {err ? <p className="rounded bg-red-50 p-2 text-xs text-red-700">{err}</p> : null}
      <div className="h-96 space-y-2 overflow-y-auto rounded border p-3">
        {thread.length === 0 ? (
          <p className="text-sm text-text-muted">첫 질문을 입력하세요. 예: "제 사건 현재 상태 알려주세요"</p>
        ) : null}
        {thread.map((m, i) => (
          <div
            key={i}
            className={`rounded p-2 text-sm ${m.role === "user" ? "bg-primary/10 text-right" : "bg-surface-muted"}`}
          >
            <pre className="whitespace-pre-wrap break-words font-sans">{m.content}</pre>
          </div>
        ))}
        {pending ? (
          <div className="rounded bg-surface-muted p-2 text-sm">
            <pre className="whitespace-pre-wrap break-words font-sans">{pending}</pre>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2 text-sm"
          value={input}
          disabled={streaming}
          placeholder="메시지를 입력하세요"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          className="rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
          onClick={send}
          disabled={streaming || !input.trim()}
        >
          {streaming ? "응답 중..." : "전송"}
        </button>
      </div>
    </div>
  );
}
