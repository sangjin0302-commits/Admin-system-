"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/about", label: "사무소 소개" },
  { href: "/services", label: "업무 분야" },
  { href: "/quick-check", label: "AI 사전 진단" },
  { href: "/cases", label: "처리 사례" },
  { href: "/blog", label: "칼럼" },
  { href: "/track", label: "진행상황" }
] as const;

function LangToggle({ pathname }: { pathname: string }) {
  const sp = useSearchParams();
  const lang = sp.get("lang") === "en" ? "en" : "ko";
  return (
    <div className="hidden items-center gap-1 border-r border-gold/30 pr-3 lg:flex">
      <Link
        href={`${pathname}?lang=ko`}
        className={`px-2 font-serif text-xs font-bold ${
          lang === "ko" ? "text-primary" : "text-text-muted hover:text-primary"
        }`}
      >
        KO
      </Link>
      <span className="text-gold/40">|</span>
      <Link
        href={`${pathname}?lang=en`}
        className={`px-2 font-serif text-xs font-bold ${
          lang === "en" ? "text-primary" : "text-text-muted hover:text-primary"
        }`}
      >
        EN
      </Link>
    </div>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? "border-b border-gold/30 bg-surface/95 shadow-panel backdrop-blur"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-3">
          <MiniLogo />
          <div className="hidden sm:block">
            <p className="font-serif text-lg font-bold tracking-[0.2em] text-primary">ETHOS</p>
            <p className="-mt-1 font-serif text-[10px] tracking-wide text-text-muted">
              Administrative Attorney Office
            </p>
          </div>
        </Link>

        {/* 데스크탑 네비 */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-4 py-2 font-serif text-sm font-semibold transition ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-text-muted hover:text-primary"
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute inset-x-4 -bottom-0.5 h-0.5 bg-gold" />
              )}
            </Link>
          ))}
        </nav>

        {/* 언어 토글 */}
        <Suspense fallback={<div className="hidden lg:flex" />}>
          <LangToggle pathname={pathname} />
        </Suspense>

        {/* CTA */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/portal"
            className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
          >
            의뢰인 포털
          </Link>
          <Link
            href="/intake"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-text-strong"
          >
            상담 신청
          </Link>
        </div>

        {/* 모바일 햄버거 */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-primary lg:hidden"
          aria-label="메뉴"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 6l12 12M18 6l-12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 모바일 드롭다운 */}
      {mobileOpen && (
        <nav className="border-t border-gold/30 bg-surface/98 backdrop-blur lg:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-4 py-3 font-serif text-base font-semibold transition ${
                  isActive(item.href)
                    ? "bg-gold-soft/40 text-primary"
                    : "text-text hover:bg-surface-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/intake"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white"
            >
              상담 신청
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function MiniLogo() {
  return (
    <svg viewBox="0 0 48 48" width={40} height={40} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="24" cy="24" r="21" fill="none" stroke="rgb(26 60 95)" strokeWidth="1.5" />
      <g transform="translate(24 14)">
        <path
          d="M0 -5 L1 -1 L5 0 L1 1 L0 5 L-1 1 L-5 0 L-1 -1 Z"
          fill="rgb(201 169 97)"
        />
      </g>
      <g transform="translate(24 22)">
        <path d="M -6 0 Q -7 -1 -6 -2 L 6 -2 Q 7 -1 6 0 Z" fill="rgb(26 60 95)" />
        <rect x="-4" y="0" width="8" height="13" fill="rgb(26 60 95)" />
        <rect x="-5" y="13" width="10" height="1.5" fill="rgb(26 60 95)" />
      </g>
      <path
        d="M 14 38 Q 17 33 22 35 Q 24 36 24 36 Q 24 36 26 35 Q 31 33 34 38 Q 28 41 24 41 Q 20 41 14 38 Z"
        fill="rgb(201 169 97)"
      />
    </svg>
  );
}
