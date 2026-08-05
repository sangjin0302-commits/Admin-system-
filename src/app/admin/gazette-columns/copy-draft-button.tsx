"use client";

import { useState } from "react";

/** 칼럼 초안 마크다운을 클립보드로 복사(블로그 에디터에 붙여넣기용). */
export function CopyDraftButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 클립보드 불가 환경 무시 */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-gold/40 bg-gold-soft/20 px-2.5 py-1 text-[11px] font-bold text-gold-deep transition hover:bg-gold-soft/40"
    >
      {copied ? "복사됨 ✓" : "초안 복사"}
    </button>
  );
}
