"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTED = ["다음 단계는?", "위험 요소는?", "유사 판례는?"];

export function CaseCopilotDrawer({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "(응답 없음)" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "오류가 발생했습니다." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90"
      >
        AI 코파일럿
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpen(false)}>
          <aside
            className="flex h-full w-full max-w-md flex-col bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-base font-semibold">AI 코파일럿</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-text-muted">
                닫기
              </button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
              {messages.length === 0 && (
                <div>
                  <p className="text-text-muted">추천 질문:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SUGGESTED.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-line px-3 py-1 text-xs hover:bg-surface-muted"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-8 rounded-lg bg-gold-soft/40 p-3"
                      : "mr-8 rounded-lg bg-surface-muted p-3 whitespace-pre-wrap"
                  }
                >
                  {m.content}
                </div>
              ))}
              {loading && <p className="text-xs text-text-muted">생각 중...</p>}
            </div>
            <footer className="border-t border-line p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex gap-2"
              >
                <input
                  className="flex-1 rounded border border-line px-2 py-1 text-sm"
                  placeholder="질문 입력"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={loading}>
                  전송
                </Button>
              </form>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
