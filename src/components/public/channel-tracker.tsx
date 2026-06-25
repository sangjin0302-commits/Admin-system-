"use client";

import { useEffect } from "react";

/**
 * 채널 클릭 자동 추적.
 * data-channel 속성이 있는 a 태그 클릭 시 GA4 이벤트 발송.
 * GA4 미설치 환경에서는 no-op.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function ChannelTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest("a[data-channel], a[href]") as HTMLAnchorElement | null;
      if (!a) return;

      let channel = a.getAttribute("data-channel");
      const href = a.getAttribute("href") ?? "";

      // data-channel 없으면 href 패턴으로 자동 감지
      if (!channel) {
        if (href.includes("talk.naver.com")) channel = "naver_talk";
        else if (href.includes("pf.kakao.com")) channel = "kakao";
        else if (href.startsWith("mailto:")) channel = "email";
        else if (href.includes("t.me") || href.includes("@EthosAdmin")) channel = "telegram";
        else if (href.includes("expert.naver.com")) channel = "naver_expert";
        else if (href.includes("linkedin.com")) channel = "linkedin";
        else if (href.startsWith("tel:")) channel = "phone";
        else return;
      }

      // GA4
      if (typeof window.gtag === "function") {
        window.gtag("event", "channel_click", {
          channel,
          page_path: window.location.pathname
        });
      }
      // dataLayer fallback
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "channel_click", channel, page_path: window.location.pathname });
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
