"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "홈", labelEn: "Home" },
  { href: "/about", label: "사무소 소개", labelEn: "About" },
  { href: "/services", label: "업무 분야", labelEn: "Practice" },
  { href: "/quick-check", label: "AI 사전 진단", labelEn: "AI Check" },
  { href: "/cases", label: "처리 사례", labelEn: "Cases" },
  { href: "/blog", label: "칼럼", labelEn: "Insights" },
  { href: "/track", label: "진행상황", labelEn: "Track" }
] as const;

function LangToggle({ pathname }: { pathname: string }) {
  const sp = useSearchParams();
  const lang = sp.get("lang") === "en" ? "en" : "ko";
  return (
    <div className="hidden items-center gap-1 border-r border-gold/30 pr-3 lg:flex">
      <Link
        href={pathname}
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

function HeaderInner() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const lang = sp.get("lang") === "en" ? "en" : "ko";
  const qs = lang === "en" ? "?lang=en" : "";
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
      <div className={`mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 transition-all duration-300 ${scrolled ? "py-2" : "py-3"}`}>
        {/* 로고 */}
        <Link href={`/${qs}`} className="flex items-center gap-3">
          <div className={`transition-all duration-300 ${scrolled ? "scale-90" : "scale-100"}`}>
            <MiniLogo />
          </div>
          <div className="hidden sm:block">
            <p className={`font-serif font-bold tracking-[0.2em] text-primary transition-all duration-300 ${scrolled ? "text-base" : "text-lg"}`}>ETHOS</p>
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
              href={`${item.href}${qs}`}
              className={`relative px-4 py-2 font-serif text-sm font-semibold transition ${
                isActive(item.href) ? "text-primary" : "text-text-muted hover:text-primary"
              }`}
            >
              {lang === "en" ? item.labelEn : item.label}
              {isActive(item.href) && <span className="absolute inset-x-4 -bottom-0.5 h-0.5 bg-gold" />}
            </Link>
          ))}
        </nav>

        {/* 언어 토글 */}
        <LangToggle pathname={pathname} />

        {/* CTA */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/portal"
            className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
          >
            {lang === "en" ? "Client Portal" : "의뢰인 포털"}
          </Link>
          <Link
            href={`/intake${qs}`}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-text-strong"
          >
            {lang === "en" ? "Consult" : "상담 신청"}
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
            {mobileOpen ? <path d="M6 6l12 12M18 6l-12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
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
                href={`${item.href}${qs}`}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-4 py-3 font-serif text-base font-semibold transition ${
                  isActive(item.href) ? "bg-gold-soft/40 text-primary" : "text-text hover:bg-surface-muted"
                }`}
              >
                {lang === "en" ? item.labelEn : item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link
                href="/portal"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-gold/40 px-4 py-3 text-center font-semibold text-primary"
              >
                {lang === "en" ? "Portal" : "포털"}
              </Link>
              <Link
                href={`/intake${qs}`}
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white"
              >
                {lang === "en" ? "Consult" : "상담 신청"}
              </Link>
              <Link
                href={lang === "en" ? pathname : `${pathname}?lang=en`}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-gold/40 px-4 py-3 text-center font-serif text-sm font-bold text-primary"
              >
                {lang === "en" ? "KO" : "EN"}
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

export function PublicHeader() {
  return (
    <Suspense fallback={<div className="h-16" />}>
      <HeaderInner />
    </Suspense>
  );
}

function MiniLogo() {
  const [src, setSrc] = useState("/logo.png");

  useEffect(() => {
    fetch("/api/public/site-images")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.images?.["image.logo"]) setSrc(d.images["image.logo"]);
      })
      .catch(() => {});
  }, []);

  return (
    <Image src={src} alt="" width={40} height={40} aria-hidden priority unoptimized={src.startsWith("http")} />
  );
}
