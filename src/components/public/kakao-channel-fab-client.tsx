"use client";

import { useEffect, useState } from "react";

/**
 * 카카오 상담 FAB — 현재 언어(document.lang)에 맞춰 라벨/aria 렌더.
 * 서버는 lang 을 모르므로(루트 레이아웃 고정 ko) 클라이언트에서 판정한다.
 */
export function KakaoChannelFabClient({ url }: { url: string }) {
  const [en, setEn] = useState(false);

  useEffect(() => {
    try {
      setEn((document.documentElement.lang || "ko").startsWith("en"));
    } catch {
      /* ignore */
    }
  }, []);

  const label = en ? "KakaoTalk consult" : "카톡 상담";
  const aria = en ? "Consult via KakaoTalk channel" : "카카오톡 채널로 상담하기";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={aria}
      className="fixed bottom-24 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-[#FEE500] px-4 shadow-lg transition hover:scale-105 sm:bottom-28 sm:right-6"
    >
      {/* 카카오 말풍선 아이콘 */}
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="#3C1E1E">
        <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.77 1.86 5.2 4.66 6.58-.15.53-.96 3.3-.99 3.52 0 0-.02.17.09.23.11.07.24.02.24.02.32-.04 3.7-2.42 4.28-2.83.56.08 1.14.13 1.72.13 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
      </svg>
      <span className="text-sm font-bold text-[#3C1E1E]">{label}</span>
    </a>
  );
}
