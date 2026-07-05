"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import type { CommunityQuestion, QuestionStatus } from "@/lib/services/community-service";

type Props = {
  pending: CommunityQuestion[];
  answered: CommunityQuestion[];
  spam: CommunityQuestion[];
};

type Tab = "pending" | "answered" | "spam";

export function CommunityAdminList({ pending, answered, spam }: Props) {
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<Record<Tab, CommunityQuestion[]>>({
    pending,
    answered,
    spam,
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  async function callApi(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json().catch(() => ({}));
  }

  function removeFrom(bucket: Tab, id: string) {
    setItems((prev) => ({ ...prev, [bucket]: prev[bucket].filter((q) => q.id !== id) }));
  }
  function addTo(bucket: Tab, q: CommunityQuestion) {
    setItems((prev) => ({ ...prev, [bucket]: [q, ...prev[bucket]] }));
  }

  async function submitAnswer(id: string, answer: string) {
    const data = await callApi({ action: "answer", id, answer });
    if (data?.ok && data.item) {
      removeFrom("pending", id);
      addTo("answered", data.item);
      setExpanded(null);
    } else {
      alert(data?.error ?? "답변 저장 실패");
    }
  }

  async function markSpam(id: string, from: Tab) {
    if (!confirm("스팸으로 처리할까요?")) return;
    const data = await callApi({ action: "moderate", id, status: "SPAM" });
    if (data?.ok && data.item) {
      removeFrom(from, id);
      addTo("spam", data.item);
    } else {
      alert(data?.error ?? "처리 실패");
    }
  }

  async function promote(id: string) {
    if (!confirm("블로그 초안(비공개)으로 승격합니다. 계속할까요?")) return;
    const data = await callApi({ action: "promote", id });
    if (data?.ok) {
      alert(`블로그 초안 생성됨: ${data.slug}`);
    } else {
      alert(data?.error ?? "승격 실패");
    }
  }

  const current = items[tab];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {(["pending", "answered", "spam"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-text-muted hover:text-text-strong"
            }`}
          >
            {t === "pending" ? "대기" : t === "answered" ? "답변됨" : "스팸"} ({items[t].length})
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-muted">항목이 없습니다.</Card>
      ) : (
        <div className="space-y-3">
          {current.map((q) => (
            <Card key={q.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="rounded bg-surface-muted px-2 py-0.5">{q.category}</span>
                    <span>{new Date(q.askedAt).toLocaleString("ko-KR")}</span>
                    {q.askerName && <span>· {q.askerName}</span>}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-text-strong">Q. {q.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => (prev === q.id ? null : q.id))}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                >
                  {expanded === q.id ? "닫기" : "펼치기"}
                </button>
              </div>

              {expanded === q.id && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  <div>
                    <div className="mb-1 text-xs font-semibold text-text-strong">질문 본문</div>
                    <p className="whitespace-pre-wrap rounded bg-surface-muted p-3 text-xs">
                      {q.body}
                    </p>
                  </div>

                  {tab === "pending" && (
                    <AnswerEditor onSubmit={(text) => submitAnswer(q.id, text)} />
                  )}

                  {tab === "answered" && q.answer && (
                    <>
                      <div>
                        <div className="mb-1 text-xs font-semibold text-text-strong">답변 (HTML)</div>
                        <div
                          className="prose prose-sm max-w-none rounded bg-white p-3 text-xs"
                          // eslint-disable-next-line react/no-danger
                          dangerouslySetInnerHTML={{ __html: q.answer }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => promote(q.id)}
                          className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white"
                        >
                          블로그로 승격
                        </button>
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {tab !== "spam" && (
                      <button
                        type="button"
                        onClick={() => markSpam(q.id, tab)}
                        className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        스팸 처리
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerEditor({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-text-strong">
        답변 작성 (HTML 지원 · &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt; 등)
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full rounded border border-border px-2 py-2 text-xs font-mono"
        placeholder="<p>답변 내용을 입력하세요...</p>"
      />
      <button
        type="button"
        onClick={() => {
          if (text.trim().length < 5) {
            alert("답변을 입력해주세요.");
            return;
          }
          onSubmit(text);
        }}
        className="mt-2 rounded bg-primary px-3 py-1 text-xs font-semibold text-white"
      >
        답변 저장 (공개)
      </button>
    </div>
  );
}
