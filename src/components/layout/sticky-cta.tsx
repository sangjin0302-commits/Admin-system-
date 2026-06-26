"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function getResponseHint(): string {
  // KST 기준 시간대 메시지
  const now = new Date();
  const utcHour = now.getUTCHours();
  const kstHour = (utcHour + 9) % 24;
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6;
  if (isWeekend) return "다음 영업일 회신";
  if (kstHour >= 9 && kstHour < 18) return "오늘 회신 가능";
  if (kstHour >= 18 || kstHour < 9) return "내일 영업시간 회신";
  return "24h 이내 회신";
}

/**
 * 데스크탑 전용 스크롤 후 등장 CTA 바.
 * - 일정 스크롤(500px) 후 우하단에 "무료 검토 요청" 표시
 * - intake/portal/admin 페이지에서는 숨김 (이미 그 맥락)
 * - 모바일은 MobileBottomNav가 담당 → lg 이상에서만
 */
export function StickyCta() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    setHint(getResponseHint());
  }, []);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 500);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hidden = pathname.startsWith("/intake") || pathname.startsWith("/portal") || pathname.startsWith("/admin");
  if (hidden) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 z-40 hidden transition-all duration-500 lg:block ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <Link
        href="/intake"
        className="ethos-cta-shine ethos-cta-pulse group flex items-center gap-3 rounded-full bg-primary py-3 pl-5 pr-4 text-white shadow-floating transition hover:bg-text-strong"
      >
        <span className="flex flex-col leading-tight">
          <span className="font-serif text-[11px] tracking-wide text-gold-soft">
            {hint || "무료 검토 · 수임 시 차감"}
          </span>
          <span className="text-sm font-bold">검토 요청하기</span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-primary transition-transform group-hover:translate-x-0.5">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
