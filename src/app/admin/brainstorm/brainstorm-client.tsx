"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "3가지 접근법 제시" | "예상 반박 나열" | "단계별 실행 계획" | "자유";

const MODES: Mode[] = ["자유", "3가지 접근법 제시", "예상 반박 나열", "단계별 실행 계획"];

export function BrainstormClient({ cases }: { cases: { id: string; label: string }[] }) {
  const [caseId, setCaseId] = useState<string>(cases[0]?.id ?? "");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("자유");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    fetch(`/api/admin/brainstorm?caseId=${encodeURIComponent(caseId)}`)
      .then((r) => r.json())
      .then((d) => setMessages((d.messages ?? []).map((m: Msg) => ({ role: m.role, content: m.content }))))
      .catch(() => setMessages([]));
  }, [caseId]);

  async function send() {
    if (!caseId || !input.trim() || loading) return;
    const question = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, message: question, mode })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "(응답 없음)" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap gap-2 items-center">
        <select
          className="rounded border border-line px-2 py-1 text-sm"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
        >
          {cases.length === 0 && <option value="">사건 없음</option>}
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-line px-2 py-1 text-sm"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <a
          href={caseId ? `/api/admin/brainstorm?caseId=${encodeURIComponent(caseId)}&export=1` : "#"}
          className="ml-auto text-sm text-primary underline"
        >
          세션 내보내기
        </a>
      </Card>

      <Card className="p-4 space-y-3 min-h-[300px]">
        {messages.length === 0 && <p className="text-sm text-text-muted">아직 대화가 없습니다.</p>}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-12 rounded-lg bg-gold-soft/40 p-3 text-sm"
                : "mr-12 rounded-lg bg-surface-muted p-3 text-sm whitespace-pre-wrap"
            }
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="text-xs text-text-muted">생각 중...</p>}
      </Card>

      <Card className="p-4">
        <div className="flex gap-2">
          <textarea
            className="flex-1 rounded border border-line p-2 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문 또는 상황을 입력하세요"
          />
          <Button onClick={send} disabled={loading || !caseId}>
            전송
          </Button>
        </div>
      </Card>
    </div>
  );
}
