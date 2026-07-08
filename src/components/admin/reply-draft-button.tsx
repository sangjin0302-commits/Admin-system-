"use client";

/**
 * VV1: 답장 초안 자동 생성 버튼.
 * 클릭 시 /api/admin/inquiries/{id}/reply-draft POST → 초안 표시 + 복사.
 *
 * Feature flag: `reply_draft_auto`
 */

import { useState } from "react";
import toast from "react-hot-toast";

export function ReplyDraftButton({ inquiryId, enabled = true }: { inquiryId: string; enabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);

  if (!enabled) return null;

  const run = async () => {
    setLoading(true);
    setDraft(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/reply-draft`, { method: "POST" });
      const data = (await res.json()) as { data?: { draft?: string; model?: string }; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "초안 생성 실패");
        return;
      }
      const d = data.data?.draft ?? "";
      setDraft(d);
      setModel(data.data?.model ?? null);
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
      <div className="flex items-center gap-2">
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-full bg-gold text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {loading ? "생성 중…" : "🤖 답장 초안 자동생성"}
        </button>
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
