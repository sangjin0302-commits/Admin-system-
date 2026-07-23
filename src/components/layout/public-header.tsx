"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { BlogSearchTrigger } from "@/components/public/blog-search";
import { LangSwitcher } from "@/components/layout/lang-switcher";
import { usePublicFlags } from "@/lib/hooks/use-public-flags";

/**
 * 공개 메뉴 라벨.
 *
 * flagKey: /admin/features 에서 끌 수 있는 항목. 없으면 항상 노출(홈).
 *
 * 라벨을 다음 근거로 정리했다.
 *
 * 1) 정보 냄새(Pirolli & Card, 1999) — 라벨은 목적지를 예측하게 해야 한다.
 *    "AI 진단"과 "빠른 진단"은 서로 구별되지 않아 방문자가 찍어서 눌러야 했다.
 *    각각 무엇을 주는지가 드러나도록 "사전진단"·"자가진단"으로 갈랐다.
 *
 * 2) 야콥의 법칙(Nielsen) — 방문자는 다른 사이트에서 익힌 관습을 기대한다.
 *    법률·행정 분야의 관용 표기는 "분야"가 아니라 "업무분야"다.
 *
 * 3) 라벨-언어 일치 — 한국어와 영어가 서로 다른 것을 가리키고 있었다.
 *    활동↔Lectures(강연), 칼럼↔Insights(통찰). 언어를 바꾸면 목적지가
 *    달라 보인다. 같은 대상을 가리키도록 맞췄다.
 */
const NAV_ITEMS = [
  { href: "/", label: "홈", labelEn: "Home" },
  { href: "/about", label: "소개", labelEn: "About", flagKey: "nav_about" },
  { href: "/services", label: "업무분야", labelEn: "Practice Areas", flagKey: "nav_services" },
  { href: "/consult", label: "상담 안내", labelEn: "Consultation", flagKey: "nav_consult" },
  { href: "/quick-check", label: "사전진단", labelEn: "Pre-check", flagKey: "nav_quick_check" },
  { href: "/ai-screen", label: "자가진단", labelEn: "Self-check", flagKey: "nav_ai_screen" },
  { href: "/cases", label: "강연·활동", labelEn: "Lectures", flagKey: "nav_cases" },
  { href: "/blog", label: "법률 칼럼", labelEn: "Legal Columns", flagKey: "nav_blog" }
] as const;

function HeaderInner() {
  const pathname = usePathname();
  const sp = useSearchParams();
  // 로케일은 경로 우선(/en, /ar), 그 다음 ?lang= 쿼리. 헤더 라벨과 CTA 라벨 언어 불일치 방지.
  const pathLang: "ko" | "en" | "ar" = pathname.startsWith("/en")
    ? "en"
    : pathname.startsWith("/ar")
      ? "ar"
      : "ko";
  const lang: "ko" | "en" = pathLang === "en" || sp.get("lang") === "en" ? "en" : "ko";
  const qs = lang === "en" ? "?lang=en" : "";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const flags = usePublicFlags();

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

  // 기능 플래그로 꺼진 메뉴 숨김. 로딩 전(null)에는 전부 노출해 깜빡임 방지.
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !("flagKey" in item) || flags?.[item.flagKey] !== false
  );

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
            <p className="-mt-1 font-serif text-[11px] tracking-wide text-text-muted">
              Administrative Attorney Office
            </p>
          </div>
        </Link>

        {/* 데스크탑 네비 */}
        <nav className="hidden items-center gap-1 lg:flex">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={`${item.href}${qs}`}
              aria-current={isActive(item.href) ? "page" : undefined}
              data-tour-id={
                item.href === "/quick-check"
                  ? "nav-ai"
                  : item.href === "/blog"
                    ? "nav-blog"
                    : undefined
              }
              className={`relative whitespace-nowrap px-3 py-2 font-serif text-sm font-semibold transition ${
                isActive(item.href) ? "text-primary" : "text-text-muted hover:text-primary"
              }`}
            >
              <span className="relative inline-flex items-center gap-1.5">
                {isActive(item.href) && <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />}
                {lang === "en" ? item.labelEn : item.label}
              </span>
              {isActive(item.href) && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-gold" />}
            </Link>
          ))}
        </nav>

        {/* 검색 */}
        <div className="hidden lg:block"><BlogSearchTrigger /></div>

        {/* 언어 토글 */}
        <LangSwitcher />

        {/* CTA */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/portal"
            className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
          >
            {lang === "en" ? "Portal / Track" : "포털 · 진행조회"}
          </Link>
          <Link
            href={`/intake${qs}`}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-text-strong"
          >
            {lang === "en" ? "Consult" : "상담 신청"}
          </Link>
        </div>

        {/* 모바일 검색 */}
        <div className="lg:hidden">
          <BlogSearchTrigger />
        </div>

        {/* 모바일 햄버거 */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-primary lg:hidden"
          aria-label="메뉴"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? <path d="M6 6l12 12M18 6l-12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* 모바일 풀스크린 overlay */}
      <AnimatePresence>
        {mobileOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-50 lg:hidden"
          style={{ minHeight: "100dvh" }}
        >
          {/* 배경 (fade) */}
          <motion.div
            className="absolute inset-0 bg-surface/98 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden
          />
          <motion.div
            className="relative flex h-full flex-col"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
          {/* 헤더 (닫기 버튼) */}
          <div className="flex items-center justify-between border-b border-gold/30 px-4 py-3">
            <Link
              href={`/${qs}`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2"
            >
              <p className="font-serif text-lg font-bold tracking-[0.2em] text-primary">ETHOS</p>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-primary"
              aria-label="닫기"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </div>

          {/* 메뉴 항목 */}
          <nav className="flex-1 overflow-y-auto px-6 py-6">
            <ul className="space-y-1">
              {visibleNavItems.map((item, i) => (
                <li
                  key={item.href}
                  className="ethos-fadeUp"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Link
                    href={`${item.href}${qs}`}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex items-center justify-between rounded-2xl px-5 py-4 font-serif text-lg font-bold transition ${
                      isActive(item.href)
                        ? "bg-primary text-white shadow-panel"
                        : "text-text-strong hover:bg-gold-soft/40"
                    }`}
                  >
                    <span>{lang === "en" ? item.labelEn : item.label}</span>
                    <span className="text-text-muted">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* 언어 토글 */}
            <div className="mt-8 flex items-center gap-2">
              <p className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">
                Language
              </p>
              <span className="h-px flex-1 bg-gold/20" />
            </div>
            <div className="mt-3 flex gap-2">
              {[
                { code: "ko", label: "한국어", href: "/" },
                { code: "en", label: "English", href: "/en" }
              ].map((l) => (
                <Link
                  key={l.code}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-xl border border-gold/40 bg-surface px-3 py-2 text-center font-serif text-sm font-bold text-primary"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* 하단 CTA */}
          <div
            className="border-t border-gold/30 bg-surface px-4 py-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex gap-2">
              <Link
                href="/portal"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-gold/40 px-4 py-3 text-center text-sm font-semibold text-primary"
              >
                {lang === "en" ? "Portal" : "포털"}
              </Link>
              <Link
                href={`/intake${qs}`}
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white shadow-panel"
              >
                {lang === "en" ? "Free Review" : "무료 검토 요청"}
              </Link>
            </div>
          </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
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
    const ctrl = new AbortController();
    fetch("/api/public/site-images", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.images?.["image.logo"]) setSrc(d.images["image.logo"]);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  return (
    <Image src={src} alt="" width={40} height={40} aria-hidden priority unoptimized={src.startsWith("http")} />
  );
}
