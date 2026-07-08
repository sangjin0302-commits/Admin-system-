"use client";

/**
 * AAA4 (WW1): 톤 조정 패널.
 * 텍스트 입력 → 4개 톤 중 선택 → 재작성 결과 표시 + 복사.
 *
 * Feature flag: `message_tone_adjust`
 */

import { useState } from "react";
import toast from "react-hot-toast";

const TONES = [
  { key: "friendly", label: "😊 친근" },
  { key: "formal", label: "🎩 공식" },
  { key: "apology", label: "🙇 사과" },
  { key: "reassuring", label: "🤝 안심" },
] as const;

export function ToneAdjustPanel({ enabled = true }: { enabled?: boolean }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [tone, setTone] = useState<string>("friendly");
  const [loading, setLoading] = useState(false);

  if (!enabled) return null;

  const run = async () => {
    const trimmed = text.trim();
    if (!trimmed) return toast.error("텍스트 입력 필요");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/ai/tone-adjust`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed, tone }),
      });
      const data = (await res.json()) as { data?: { adjusted?: string }; error?: string };
      if (!res.ok) return toast.error(data.error ?? "실패");
      setResult(data.data?.adjusted ?? "");
      toast.success("톤 조정 완료");
    } catch (err) {
      toast.error(`오류: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    try {
      void navigator.clipboard.writeText(result);
      toast.success("복사됨");
    } catch { toast.error("복사 실패"); }
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="text-sm font-bold">✨ 답변 톤 조정</h3>
      <p className="mt-1 text-[11px] text-text-muted">원문 붙여넣기 → 톤 선택 → 재작성</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="원문 붙여넣기..."
        className="mt-3 w-full min-h-[100px] rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
        maxLength={2000}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {TONES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTone(t.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              tone === t.key ? "bg-black text-white" : "border border-line bg-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={run}
          disabled={loading || !text.trim()}
          className="ml-auto rounded-full bg-gold text-white px-4 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {loading ? "생성 중…" : "재작성"}
        </button>
      </div>

      {result ? (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">결과</span>
            <button onClick={copy} className="rounded-full border border-line bg-surface px-3 py-1 text-[11px]">📋 복사</button>
          </div>
          <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-line bg-surface-muted p-3 text-xs text-text">
            {result}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
