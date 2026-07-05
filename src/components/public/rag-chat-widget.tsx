"use client";

import { useRef, useState } from "react";

type Source = {
  type: string;
  id: string;
  title: string;
  snippet: string;
  url?: string;
  score: number;
};

type Turn = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  logId?: string;
  confidence?: string;
  feedback?: "up" | "down";
};

const SOURCE_LABEL: Record<string, string> = {
  blog: "블로그",
  case_study: "사례",
  precedent: "판례",
  faq: "FAQ",
};

export function RagChatWidget() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    setError("");
    setBusy(true);
    setTurns((t) => [...t, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setQ("");

    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/public/rag-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let sources: Source[] = [];
      let assistantText = "";
      let logId = "";
      let confidence = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const nameMatch = ev.match(/^event:\s*(\S+)/m);
          const dataMatch = ev.match(/^data:\s*(.+)$/m);
          if (!nameMatch || !dataMatch) continue;
          const name = nameMatch[1];
          const data = JSON.parse(dataMatch[1]);
          if (name === "sources") sources = data as Source[];
          else if (name === "token") {
            assistantText += (data as { text: string }).text;
            setTurns((t) => {
              const copy = [...t];
              const last = copy[copy.length - 1];
              if (last.role === "assistant") {
                copy[copy.length - 1] = { ...last, content: assistantText, sources };
              }
              return copy;
            });
          } else if (name === "done") {
            logId = (data as { logId: string; confidence: string }).logId;
            confidence = (data as { logId: string; confidence: string }).confidence;
          }
        }
      }
      setTurns((t) => {
        const copy = [...t];
        const last = copy[copy.length - 1];
        if (last.role === "assistant") {
          copy[copy.length - 1] = { ...last, content: assistantText, sources, logId, confidence };
        }
        return copy;
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  async function sendFeedback(idx: number, feedback: "up" | "down") {
    const turn = turns[idx];
    if (!turn.logId || turn.feedback) return;
    setTurns((t) => {
      const copy = [...t];
      copy[idx] = { ...copy[idx], feedback };
      return copy;
    });
    await fetch("/api/public/rag-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "feedback", logId: turn.logId, feedback }),
    }).catch(() => undefined);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {turns.length === 0 && (
          <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-text-muted">
            궁금한 점을 입력하면 사무소의 블로그·판례·사례에서 답변을 찾아드립니다.
          </p>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={`rounded-lg p-4 ${
              t.role === "user" ? "bg-primary/10" : "border border-line bg-surface"
            }`}
          >
            <p className="mb-1 text-xs font-semibold text-text-muted">
              {t.role === "user" ? "질문" : "답변"}
              {t.confidence && (
                <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-[10px]">확신도 {t.confidence}</span>
              )}
            </p>
            <p className="whitespace-pre-wrap text-sm text-text-strong">
              {t.content || (busy && i === turns.length - 1 ? "생각 중..." : "")}
            </p>
            {t.sources && t.sources.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-text-muted">참고 출처</p>
                <ol className="list-decimal space-y-1 pl-5 text-xs">
                  {t.sources.map((s, j) => (
                    <li key={j}>
                      <span className="rounded bg-primary/10 px-1 text-[10px] font-semibold text-primary">
                        {SOURCE_LABEL[s.type] ?? s.type}
                      </span>{" "}
                      {s.url ? (
                        <a href={s.url} className="text-primary underline" target="_blank" rel="noreferrer">
                          {s.title}
                        </a>
                      ) : (
                        <span>{s.title}</span>
                      )}
                      <p className="mt-0.5 text-text-muted">{s.snippet}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {t.role === "assistant" && t.logId && (
              <div className="mt-3 flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => sendFeedback(i, "up")}
                  disabled={!!t.feedback}
                  className={`rounded border px-2 py-1 ${t.feedback === "up" ? "bg-emerald-100 border-emerald-300" : "border-line"}`}
                >
                  👍 도움됨
                </button>
                <button
                  type="button"
                  onClick={() => sendFeedback(i, "down")}
                  disabled={!!t.feedback}
                  className={`rounded border px-2 py-1 ${t.feedback === "down" ? "bg-red-100 border-red-300" : "border-line"}`}
                >
                  👎 아쉬움
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={ask} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 행정심판 청구 기간이 얼마인가요?"
          className="h-11 flex-1 rounded-lg border border-line bg-white px-3 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !q.trim()}
          className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "답변 중..." : "질문"}
        </button>
      </form>
    </div>
  );
}
