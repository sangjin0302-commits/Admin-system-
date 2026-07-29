"use client";

/**
 * 마케팅: 블로그 글 50% 스크롤 도달 시 슬라이드인 CTA.
 * 글 읽는 중간 지점 = 관심 확인된 순간 → 무료 검토 유도.
 * 세션당 1회 (sessionStorage), 닫기 가능.
 *
 * Feature flag: `blog_mid_cta` (public) — /api/public/features
 */

import { useEffect, useState } from "react";
import Link from "next/link";

const SS_KEY = "blog.mid_cta.shown";

export function BlogMidCta({ category, lang = "ko" }: { category?: string; lang?: "ko" | "en" }) {
  const en = lang === "en";
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/public/features")
      .then((r) => r.json())
      .then((d: { flags?: Record<string, boolean> } | Record<string, boolean>) => {
        const flags = (d as { flags?: Record<string, boolean> }).flags ?? (d as Record<string, boolean>);
        if (flags?.blog_mid_cta) setEnabled(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (sessionStorage.getItem(SS_KEY)) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const d = document.documentElement;
        const max = d.scrollHeight - window.innerHeight;
        if (max > 0 && window.scrollY / max >= 0.5) {
          setVisible(true);
          try { sessionStorage.setItem(SS_KEY, "1"); } catch { /* ignore */ }
          window.removeEventListener("scroll", onScroll);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled || !visible || dismissed) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] animate-[slideIn_.35s_ease-out] rounded-2xl border border-gold/40 bg-surface p-4 shadow-floating sm:right-6">
      <style>{`@keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-text-strong">
          {en ? "Sounds like your situation?" : "이 글이 내 상황과 비슷하다면?"}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-sm text-text-muted hover:text-text"
          aria-label={en ? "Close" : "닫기"}
        >
          ×
        </button>
      </div>
      <p className="mt-1 text-xs leading-5 text-text-muted">
        {en
          ? `${category ? `${category} — ` : ""}Get a free review of your options and likely cost. Reply within 24 business hours.`
          : `${category ? `${category} 사안, ` : ""}무료 검토로 가능성과 예상 비용을 먼저 확인하세요. 영업일 24시간 내 회신.`}
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href={en ? "/intake?lang=en" : "/intake"}
          className="flex-1 rounded-full bg-primary px-4 py-2 text-center text-xs font-bold text-white hover:brightness-110"
        >
          {en ? "Free review" : "무료 검토 신청"}
        </Link>
        <Link
          href={en ? "/quick-check?lang=en" : "/quick-check"}
          className="rounded-full border border-gold/50 px-4 py-2 text-xs font-medium text-primary hover:bg-gold-soft/30"
        >
          {en ? "30-sec check" : "30초 진단"}
        </Link>
      </div>
    </div>
  );
}
