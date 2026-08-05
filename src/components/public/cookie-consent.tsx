"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "ethos.cookieConsent";

/**
 * 쿠키/분석 동의 배너 (PIPA/개인정보). GA4는 Consent Mode 로 동의 전까지 저장 거부(analytics.tsx).
 * 동의 시 localStorage 저장 + gtag consent update(granted). 거부 시 denied 유지.
 * 한 번 선택하면 다시 안 뜸.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [en, setEn] = useState(false);

  useEffect(() => {
    try {
      setEn((document.documentElement.lang || "ko").startsWith("en"));
    } catch {
      /* ignore */
    }
    try {
      const v = localStorage.getItem(KEY);
      if (!v) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  function decide(granted: boolean) {
    try {
      localStorage.setItem(KEY, granted ? "granted" : "denied");
    } catch {
      /* ignore */
    }
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    if (w.gtag) {
      w.gtag("consent", "update", {
        analytics_storage: granted ? "granted" : "denied"
      });
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-floating sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-text-muted">
          {en ? (
            <>
              We use cookies for site analytics (Google Analytics). If you agree, we use them to collect
              visit statistics. See our <Link href="/privacy?lang=en" className="text-primary underline">Privacy Policy</Link> for details.
            </>
          ) : (
            <>
              사이트 이용 분석(Google Analytics)을 위해 쿠키를 사용합니다. 동의하시면 방문 통계 수집에 활용됩니다.
              자세한 내용은 <Link href="/privacy" className="text-primary underline">개인정보처리방침</Link>을 확인하세요.
            </>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide(false)}
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-text-muted transition hover:bg-surface-muted"
          >
            {en ? "Decline" : "거부"}
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white transition hover:bg-text-strong"
          >
            {en ? "Accept" : "동의"}
          </button>
        </div>
      </div>
    </div>
  );
}
