"use client";

import { useState } from "react";

export function FloatingContact() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* 우하단 floating - 데스크탑 */}
      <div className="fixed bottom-6 right-6 z-50 hidden flex-col items-end gap-3 lg:flex">
        {expanded && (
          <div className="flex flex-col gap-2 rounded-2xl border border-gold/40 bg-surface p-3 shadow-floating">
            <a
              href="http://pf.kakao.com/_xXxXxXx"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-bold text-[#3C1E1E] transition hover:brightness-95"
            >
              <KakaoIcon />
              카카오톡 상담
            </a>
            <a
              href="tel:020000000"
              className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-text-strong"
            >
              <PhoneIcon />
              02-0000-0000
            </a>
            <a
              href="/intake"
              className="flex items-center gap-3 rounded-xl border-2 border-gold/50 bg-surface px-4 py-3 text-sm font-bold text-primary transition hover:bg-gold-soft/40"
            >
              <FormIcon />
              상담 신청서
            </a>
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-floating transition hover:bg-text-strong"
          aria-label="상담 연결"
        >
          {expanded ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          ) : (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.97 9.97 0 0 1-4.156-.9L3 21l1.9-4.844A8 8 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>

      {/* 모바일 sticky bar (하단) */}
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-gold/30 bg-surface/95 backdrop-blur lg:hidden">
        <a
          href="tel:020000000"
          className="flex flex-col items-center justify-center gap-1 border-r border-gold/20 py-3 text-primary"
        >
          <PhoneIcon className="h-5 w-5" />
          <span className="text-[11px] font-bold">전화</span>
        </a>
        <a
          href="http://pf.kakao.com/_xXxXxXx"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-1 border-r border-gold/20 bg-[#FEE500]/90 py-3 text-[#3C1E1E]"
        >
          <KakaoIcon className="h-5 w-5" />
          <span className="text-[11px] font-bold">카카오톡</span>
        </a>
        <a
          href="/intake"
          className="flex flex-col items-center justify-center gap-1 bg-primary py-3 text-white"
        >
          <FormIcon className="h-5 w-5" />
          <span className="text-[11px] font-bold">상담 신청</span>
        </a>
      </div>

      {/* 모바일 하단 패딩 보장 */}
      <div className="h-16 lg:hidden" aria-hidden />
    </>
  );
}

function KakaoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.78 1.79 5.22 4.5 6.66l-.94 3.45c-.08.29.23.52.49.36L10 19.5c.65.07 1.32.11 2 .11 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  );
}

function PhoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function FormIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  );
}
