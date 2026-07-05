"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  at?: string;
}

export function ConciergeClient() {
  const [clientId, setClientId] = useState<string>("");
  const [plan, setPlan] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [input, setInput] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [pending, setPending] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 이메일을 로컬스토리지에서 로드 (포털 세션 통합 전까지 임시)
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("portal.email") : null;
    if (stored) setClientId(stored);
  }, []);

  const loadThread = useCallback(async (email: string) => {
    if (!email) return;
    setErr(null);
    try {
      const res = await fetch(`/api/portal/concierge?clientId=${encodeURIComponent(email)}`);
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
    if (clientId) loadThread(clientId);
  }, [clientId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, pending]);

  async function send() {
    const message = input.trim();
    if (!message || !clientId) return;
    setThread((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setStreaming(true);
    setPending("");
    setErr(null);
    try {
      const res = await fetch("/api/portal/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message }),
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

  if (!clientId) {
    return (
      <div className="rounded border p-4 text-sm">
        <p>포털 로그인이 확인되지 않았습니다. 이메일을 입력하세요:</p>
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 rounded border px-2 py-1"
            placeholder="you@example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) {
                  window.localStorage.setItem("portal.email", v);
                  setClientId(v);
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plan ? (
        <p className="text-xs text-text-muted">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{plan.toUpperCase()}</span> · {clientId}
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
