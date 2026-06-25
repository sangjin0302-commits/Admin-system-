"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

type ChatMsg =
  | { role: "user"; text: string }
  | { role: "bot"; text: string; matched?: string[]; mustVerify?: string[]; riskFlags?: string[] };

const WELCOME: ChatMsg = {
  role: "bot",
  text:
    "안녕하세요. ETHOS lawbot입니다. 사안 내용을 자유롭게 입력해 주세요. 분야 분류, 확인 사항, 위험 신호를 안내드립니다."
};

export function LawbotChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (text.length < 5) return;

    const userMsg: ChatMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 직전 대화 내역까지 함께 보내 lawbot이 컨텍스트 활용 가능하게 함
      const contextHistory = messages
        .filter((m) => m.role === "user")
        .map((m) => m.text)
        .slice(-3)
        .join("\n");
      const factWithContext = contextHistory
        ? `[이전 대화]\n${contextHistory}\n[새 질문]\n${text}`
        : text;

      const res = await fetch("/api/public/quick-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fact: factWithContext })
      });
      const data = await res.json();
      if (!data.ok) {
        setMessages((prev) => [...prev, { role: "bot", text: data.error ?? "분석에 실패했습니다." }]);
        return;
      }

      const summary =
        typeof data.summary === "object" && data.summary && "primary_topic" in data.summary
          ? String((data.summary as Record<string, unknown>).primary_topic)
          : "사안을 분석했습니다. 아래 사항을 확인해 주세요.";

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: summary,
          matched: data.matchedSubtypes,
          mustVerify: data.mustVerify,
          riskFlags: data.riskFlags
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "통신 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-40 hidden h-14 items-center gap-2 rounded-full bg-gold px-5 font-serif text-sm font-bold text-primary shadow-floating transition hover:bg-gold-soft lg:inline-flex"
          aria-label="lawbot 챗봇 열기"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          AI 사전 진단
        </button>
      )}

      {open && (
        <div className="fixed bottom-24 right-6 z-40 hidden w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-gold/40 bg-surface shadow-floating lg:flex">
          {/* 헤더 */}
          <div className="flex items-center justify-between bg-primary px-5 py-3 text-white">
            <div>
              <p className="font-serif text-xs uppercase tracking-wider text-gold-soft">ETHOS</p>
              <p className="font-serif text-sm font-bold">AI 사전 진단 챗봇</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white"
              aria-label="닫기"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </div>

          {/* 메시지 영역 */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-canvas/40 p-4" style={{ maxHeight: 360 }}>
            {messages.map((m, i) => (
              <MessageBubble key={i} m={m} />
            ))}
            {loading && (
              <div className="text-xs italic text-text-muted">분석 중...</div>
            )}
          </div>

          {/* 입력 */}
          <form onSubmit={send} className="border-t border-gold/30 bg-surface p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="사안을 입력하세요 (5자 이상)"
                maxLength={500}
                className="h-10 flex-1 rounded-lg border border-gold/30 px-3 text-sm focus:border-gold focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || input.trim().length < 5}
                className="h-10 rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-text-strong disabled:opacity-50"
              >
                전송
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-text-muted">대화 기록은 저장되지 않습니다</p>
              <Link href="/intake" className="text-[11px] font-bold text-primary hover:underline">
                상담 신청 →
              </Link>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ m }: { m: ChatMsg }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-white">
          {m.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-3 py-2 text-sm text-text-strong shadow-panel">
        <p>{m.text}</p>
        {m.matched && m.matched.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {m.matched.slice(0, 4).map((s) => (
              <span key={s} className="rounded-full bg-gold-soft/60 px-2 py-0.5 text-[11px] font-bold text-gold-deep">
                {s}
              </span>
            ))}
          </div>
        )}
        {m.mustVerify && m.mustVerify.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">확인 필요</p>
            <ul className="mt-1 space-y-1 text-xs text-text-muted">
              {m.mustVerify.slice(0, 3).map((v, i) => (
                <li key={i}>· {v}</li>
              ))}
            </ul>
          </div>
        )}
        {m.riskFlags && m.riskFlags.length > 0 && (
          <div className="mt-2 rounded-md bg-amber-50 p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">주의</p>
            <ul className="mt-1 space-y-1 text-xs text-amber-900">
              {m.riskFlags.slice(0, 2).map((v, i) => (
                <li key={i}>· {v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
