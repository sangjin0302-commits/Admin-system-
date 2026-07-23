"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { extractIntakeFromChat } from "@/lib/utils/chat-to-intake";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type FeedbackState = {
  rating: "up" | "down";
  ack: boolean;
};

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SUGGESTED_QUESTIONS = [
  "D-8 비자 만료가 다가오는데 어떻게 해야 하나요?",
  "행정심판 기한이 지났는데 방법이 있나요?",
  "외국인 고용허가 보완 요청을 받았어요",
];

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function submitFeedback(msg: Message, rating: "up" | "down") {
    if (feedback[msg.id]) return;
    // Find preceding user question
    const idx = messages.findIndex((m) => m.id === msg.id);
    const question =
      idx > 0
        ? [...messages.slice(0, idx)].reverse().find((m) => m.role === "user")?.content ?? ""
        : "";
    setFeedback((prev) => ({ ...prev, [msg.id]: { rating, ack: true } }));
    try {
      await fetch("/api/public/ai-chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: msg.id,
          rating,
          question,
          answer: msg.content,
        }),
        keepalive: true,
      });
    } catch {
      // best-effort
    }
    setTimeout(() => {
      setFeedback((prev) => {
        const next = { ...prev };
        if (next[msg.id]) next[msg.id] = { ...next[msg.id], ack: false };
        return next;
      });
    }, 2000);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { id: makeId(), role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantId = makeId();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/public/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "오류 발생" }));
        setMessages([
          ...newMessages,
          { id: assistantId, role: "assistant", content: err.error || "응답 오류가 발생했습니다." },
        ]);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              accumulated += parsed.delta.text;
              setMessages([...newMessages, { id: assistantId, role: "assistant", content: accumulated }]);
            }
          } catch {
            // skip parse errors
          }
        }
      }

      if (!accumulated) {
        setMessages([
          ...newMessages,
          { id: assistantId, role: "assistant", content: "응답을 받지 못했습니다. 다시 시도해 주세요." },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { id: assistantId, role: "assistant", content: "네트워크 오류가 발생했습니다." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition hover:scale-105 sm:bottom-8 sm:right-8"
        aria-label="AI 상담 열기"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[32rem] w-full flex-col overflow-hidden rounded-t-2xl border border-gold/30 bg-surface shadow-2xl sm:bottom-8 sm:right-8 sm:h-[36rem] sm:w-96 sm:rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gold/20 bg-primary px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
            AI
          </div>
          <div>
            <p className="text-sm font-bold text-white">ETHOS AI 안내</p>
            <p className="text-[10px] text-white/70">사전 안내 · 법률자문 아님</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-center text-xs text-text-muted">
              궁금한 사항을 질문하세요. AI가 사전 안내를 도와드립니다.
            </p>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="w-full rounded-lg border border-gold/30 bg-gold-soft/20 px-3 py-2 text-left text-xs text-text transition hover:bg-gold-soft/40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const isStreamingThis = streaming && isLast && msg.role === "assistant";
          const showFeedback =
            msg.role === "assistant" && !isStreamingThis && msg.content.trim().length > 0;
          const fb = feedback[msg.id];
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-surface-muted text-text rounded-bl-md"
                }`}
              >
                {msg.content}
                {isStreamingThis && (
                  msg.content ? (
                    <span className="ethos-caret ml-0.5 inline-block" />
                  ) : (
                    <span className="inline-flex items-center gap-2" role="status">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold-deep" aria-hidden />
                      <span className="text-xs text-text-muted">답변 생성 중…</span>
                    </span>
                  )
                )}
                {showFeedback && (
                  <div className="mt-2 flex items-center justify-end gap-1.5">
                    {fb?.ack ? (
                      <span className="text-[10px] text-text-muted">감사합니다</span>
                    ) : fb ? (
                      <span className="text-[10px] text-text-muted">
                        {fb.rating === "up" ? "👍" : "👎"}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => submitFeedback(msg, "up")}
                          aria-label="도움이 되었습니다"
                          className="rounded-md px-1.5 py-0.5 text-xs leading-none text-text-muted transition hover:bg-gold-soft/40 hover:text-gold-deep"
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() => submitFeedback(msg, "down")}
                          aria-label="도움이 되지 않았습니다"
                          className="rounded-md px-1.5 py-0.5 text-xs leading-none text-text-muted transition hover:bg-gold-soft/40 hover:text-gold-deep"
                        >
                          👎
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Chat-to-Intake CTA */}
      {messages.filter(m => m.role === "user").length >= 2 && (
        <button
          onClick={() => {
            const { summary, category } = extractIntakeFromChat(messages);
            const params = new URLSearchParams({ from: "ai-chat", summary });
            if (category) params.set("cat", category);
            // 현재 경로 로케일 유지 — /en 사용자가 한국어 페이지로 튕겨나가지 않도록.
            const path = typeof window !== "undefined" ? window.location.pathname : "";
            const prefix = path.startsWith("/en") ? "/en" : "";
            window.location.href = `${prefix}/intake?${params.toString()}`;
          }}
          className="mx-3 mb-2 rounded-lg bg-gold-soft/50 px-3 py-2 text-xs font-bold text-gold-deep transition hover:bg-gold-soft"
          data-funnel="chat_to_intake"
        >
          이 내용으로 검토 요청하기 →
        </button>
      )}

      {/* Input */}
      <div className="border-t border-gold/20 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="질문을 입력하세요..."
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none rounded-xl border border-gold/30 bg-surface px-3 py-2 text-sm outline-none transition focus:ring-1 focus:ring-gold/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m22 2-7 20-4-9-9-4z" />
            </svg>
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-text-muted">
          일반적 안내이며 법률자문이 아닙니다
        </p>
      </div>
    </div>
  );
}
