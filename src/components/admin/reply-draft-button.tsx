"use client";

/**
 * VV1: 답장 초안 자동 생성 버튼.
 * 클릭 시 /api/admin/inquiries/{id}/reply-draft POST → 초안 표시 + 복사.
 *
 * Feature flag: `reply_draft_auto`
 */

import { useState } from "react";
import toast from "react-hot-toast";

type Variants = { friendly: string; formal: string; practical: string };
const VARIANT_LABELS: Array<{ key: keyof Variants; label: string }> = [
  { key: "friendly", label: "😊 친근" },
  { key: "formal", label: "🎩 공식" },
  { key: "practical", label: "⚡ 실무" },
];

export function ReplyDraftButton({ inquiryId, enabled = true, variantsEnabled = false }: { inquiryId: string; enabled?: boolean; variantsEnabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variants | null>(null);
  const [activeVariant, setActiveVariant] = useState<keyof Variants>("friendly");

  if (!enabled) return null;

  const run = async (asVariants: boolean) => {
    setLoading(true);
    setDraft(null);
    setVariants(null);
    try {
      const qs = asVariants ? "?variants=3" : "";
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/reply-draft${qs}`, { method: "POST" });
      // api.ok() 는 payload 를 그대로 내보낸다 — data 래퍼가 없다.
      // 예전에는 data.data 를 읽어 초안이 항상 빈 문자열이었고, 그런데도
      // "답장 초안 생성됨" 토스트가 떠서 아무것도 안 나오는 이유를 알 수 없었다.
      const data = (await res.json()) as {
        draft?: string;
        model?: string;
        variants?: Variants;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "초안 생성 실패");
        return;
      }
      if (data.variants) {
        setVariants(data.variants);
        setActiveVariant("friendly");
        setDraft(data.variants.friendly || data.variants.formal || data.variants.practical);
      } else {
        const draftText = data.draft ?? "";
        if (!draftText) {
          toast.error("초안이 비어 있습니다.");
          return;
        }
        setDraft(draftText);
      }
      setModel(data.model ?? null);
      toast.success("답장 초안 생성됨");
    } catch (err) {
      toast.error(`오류: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!draft) return;
    try {
      void navigator.clipboard.writeText(draft);
      toast.success("복사됨");
    } catch { toast.error("복사 실패"); }
  };

  return (
    <div className="rounded-xl border border-line bg-surface-muted p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => run(false)}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-full bg-gold text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {loading ? "생성 중…" : "🤖 답장 초안 자동생성"}
        </button>
        {variantsEnabled ? (
          <button
            onClick={() => run(true)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-gold bg-surface px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-50"
          >
            🎭 3버전 생성
          </button>
        ) : null}
        {variants ? (
          <div className="inline-flex gap-1">
            {VARIANT_LABELS.map((v) => (
              <button
                key={v.key}
                onClick={() => { setActiveVariant(v.key); setDraft(variants[v.key]); }}
                className={`rounded-full px-2 py-1 text-[11px] ${activeVariant === v.key ? "bg-black text-white" : "border border-line bg-surface"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        ) : null}
        {draft ? (
          <button
            onClick={copy}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs"
          >
            📋 복사
          </button>
        ) : null}
        {model ? <span className="text-[10px] text-text-muted">model: {model}</span> : null}
      </div>
      {draft ? (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-line bg-surface p-3 text-xs text-text">
          {draft}
        </pre>
      ) : null}
    </div>
  );
}
