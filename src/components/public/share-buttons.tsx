"use client";

import { useState } from "react";

/**
 * 블로그 글 공유 버튼.
 * - 모바일: Web Share API (navigator.share)
 * - 데스크탑: 링크 복사 + X(트위터) + 네이버 공유
 */
export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function currentUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  async function nativeShare() {
    const url = currentUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* 사용자가 취소 */
      }
    } else {
      copyLink();
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard 차단 환경 */
    }
  }

  const url = currentUrl();
  const enc = encodeURIComponent;

  return (
    <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-gold/20 pt-8">
      <span className="mr-1 font-serif text-sm font-semibold text-text-muted">이 글 공유하기</span>

      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gold/40 bg-surface px-3 text-xs font-semibold text-primary transition hover:bg-gold-soft/30 sm:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7">
          <path d="M4 12v8h16v-8M12 16V4M8 8l4-4 4 4" />
        </svg>
        공유
      </button>

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gold/40 bg-surface px-3 text-xs font-semibold text-primary transition hover:bg-gold-soft/30"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7">
          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </svg>
        {copied ? "복사됨!" : "링크 복사"}
      </button>

      <a
        href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gold/40 bg-surface px-3 text-xs font-semibold text-primary transition hover:bg-gold-soft/30"
      >
        X
      </a>

      <a
        href={`https://share.naver.com/web/shareView?url=${enc(url)}&title=${enc(title)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#03C75A]/40 bg-[#03C75A]/10 px-3 text-xs font-bold text-[#03A94C] transition hover:bg-[#03C75A]/20"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded bg-[#03C75A] text-[9px] font-black text-white">
          N
        </span>
        네이버
      </a>

      <a
        href={`https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#0088CC]/40 bg-[#0088CC]/10 px-3 text-xs font-bold text-[#0088CC] transition hover:bg-[#0088CC]/20"
      >
        Telegram
      </a>

      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#0A66C2]/40 bg-[#0A66C2]/10 px-3 text-xs font-bold text-[#0A66C2] transition hover:bg-[#0A66C2]/20"
      >
        LinkedIn
      </a>
    </div>
  );
}
