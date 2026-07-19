"use client";

import { useState } from "react";

export default function DocumentCritiqueClient() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      // 예전에는 존재하지 않는 /api/admin/mentor/document-critique 로 보내
      // 항상 404 HTML 을 받았고, 파싱 실패를 삼켜 화면엔 늘 "응답 없음"만 떴다.
      // 실제 라우트는 critique-draft 이고 본문 키는 draft 다.
      const res = await fetch("/api/admin/mentor/critique-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        critique?: unknown;
        error?: string;
      };
      if (!res.ok) {
        setResult(data.error ?? `채점 실패 (${res.status})`);
        return;
      }
      if (!data.critique) {
        setResult("채점 결과를 해석하지 못했습니다. 초안을 조금 더 길게 넣어 보세요.");
        return;
      }
      setResult(JSON.stringify(data.critique, null, 2));
    } catch (err) {
      setResult(`오류: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="본인 서면 초안을 붙여넣기하세요..."
        className="w-full min-h-[240px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text"
      />
      <button
        onClick={submit}
        disabled={loading || !text.trim()}
        className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "채점 중…" : "5개 축 채점"}
      </button>
      {result ? (
        <pre className="whitespace-pre-wrap rounded-xl border border-line bg-surface-muted p-4 text-sm text-text">
          {result}
        </pre>
      ) : null}
    </div>
  );
}
