"use client";

/**
 * <html lang> 을 실제 표시 언어와 맞춘다.
 *
 * 루트 레이아웃은 서버 컴포넌트라 pathname/searchParams를 읽을 수 없어
 * lang="ko" 가 하드코딩돼 있다. 그 결과 /en·/ar 및 ?lang=en 페이지도
 * 한국어로 선언되어:
 *   1) 크롬이 "번역하시겠습니까"를 잘못 띄우고 — 번역이 텍스트 노드를 갈아치우면
 *      React 재조정이 parentNode null 로 터진다(Sentry에 올라온 그 오류).
 *   2) 스크린리더가 영어 문장을 한국어 음성으로 읽는다.
 *   3) 검색엔진이 언어를 오인한다.
 *
 * 렌더는 하지 않고 documentElement.lang 만 갱신한다.
 */

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function resolveLang(pathname: string, langParam: string | null): string {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (langParam === "en") return "en";
  return "ko";
}

function HtmlLangSyncInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");

  useEffect(() => {
    const lang = resolveLang(pathname ?? "/", langParam);
    const el = document.documentElement;
    if (el.lang !== lang) {
      el.lang = lang;
    }
    el.dir = lang === "ar" ? "rtl" : "ltr";
  }, [pathname, langParam]);

  return null;
}

export function HtmlLangSync() {
  return (
    <Suspense fallback={null}>
      <HtmlLangSyncInner />
    </Suspense>
  );
}
