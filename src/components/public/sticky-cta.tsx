"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CHANNELS } from "@/lib/constants/channels";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flag";
import { trackKakaoClick, trackPhoneClick } from "@/lib/utils/ga4-events";

const FALLBACK_PHONE = "02-0000-0000";

/**
 * 모바일 전용 sticky CTA.
 * - 화면 하단 (FloatingContact 모바일 바 위) 고정 표시
 * - 두 버튼: 전화 상담 / 온라인 신청
 * - /admin, /portal 경로에서는 숨김
 */
export function StickyCta() {
  const pathname = usePathname();
  const [phone, setPhone] = useState(FALLBACK_PHONE);
  const [langEn, setLangEn] = useState(false);
  const ga4Enabled = useFeatureFlag("ga4_conversion_tracking") !== false;

  useEffect(() => {
    setLangEn(pathname.startsWith("/en") || document.documentElement.lang === "en");
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/site-contact")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.ok && d.phone) {
          setPhone(d.phone);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) {
    return null;
  }

  const tel = `tel:${phone.replace(/[^0-9]/g, "")}`;

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-30 px-3 pb-2 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="mx-auto max-w-md rounded-2xl border border-gold/40 bg-surface/95 p-2 shadow-floating backdrop-blur">
        <div className="flex gap-2">
          <a
            href={tel}
            onClick={() => {
              if (ga4Enabled) trackPhoneClick("sticky_cta");
            }}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-surface px-2.5 py-2.5 font-serif text-sm font-bold text-primary transition hover:bg-gold-soft/30"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {langEn ? "Call" : "전화"}
          </a>
          <a
            href={CHANNELS.naverTalk.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              if (ga4Enabled) trackKakaoClick("sticky_cta");
            }}
            className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-2.5 font-serif text-sm font-bold text-primary transition hover:bg-primary/20"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {langEn ? "Chat" : "톡톡 상담"}
          </a>
          <Link
            href={langEn ? "/intake?lang=en" : "/intake"}
            className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-2.5 py-2.5 font-serif text-sm font-bold transition hover:bg-text-strong"
            style={{ color: "rgb(232 208 145)" }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M8 13h8M8 17h5" />
            </svg>
            {langEn ? "Apply" : "온라인 신청"}
          </Link>
        </div>
        <p className="mt-1.5 text-center text-[11px] font-medium text-text-muted">
          {langEn ? "Reply within 4 business hours · No cost" : "영업시간 내 4시간 안에 답변 · 비용 발생 없음"}
        </p>
      </div>
    </div>
  );
}
