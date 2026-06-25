"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CHANNELS } from "@/lib/constants/channels";

const STORAGE_KEY = "ethos.exitIntentShown";
const HIDDEN_PATHS = ["/intake", "/portal", "/admin", "/links", "/consult"];

export function ExitIntent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = window.location.pathname;
    if (HIDDEN_PATHS.some((h) => p.startsWith(h))) return;

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {}

    function onMouseOut(e: MouseEvent) {
      if (e.clientY <= 0 && !e.relatedTarget) {
        setOpen(true);
        try {
          sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {}
        document.removeEventListener("mouseout", onMouseOut);
      }
    }

    const t = window.setTimeout(() => {
      document.addEventListener("mouseout", onMouseOut);
    }, 8000);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ethos-grain relative w-full max-w-md overflow-hidden rounded-[24px] border border-gold/30 bg-surface shadow-floating"
      >
        <div className="bg-gradient-to-b from-primary via-primary to-text-strong px-7 py-7 text-center text-white">
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-soft">
            Before you go
          </p>
          <h2 id="exit-intent-title" className="ethos-display mt-3 text-2xl text-white">
            한 줄만 남겨주세요
          </h2>
          <p className="mt-2 text-sm leading-7 text-white/80">
            검토는 무료입니다.<br />
            상황만 알려주시면 영업일 24시간 내 가능 여부 회신드립니다.
          </p>
        </div>

        <div className="space-y-2 p-6">
          <a
            href={CHANNELS.naverTalk.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl bg-[#03C75A] px-4 py-3 font-serif text-sm font-bold text-white transition hover:brightness-95"
          >
            <span>네이버 톡톡으로 검토 요청</span>
            <span>→</span>
          </a>
          <a
            href={CHANNELS.kakao.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl bg-[#FEE500] px-4 py-3 font-serif text-sm font-bold text-[#3C1E1E] transition hover:brightness-95"
          >
            <span>카카오로 검토 요청</span>
            <span>→</span>
          </a>
          <Link
            href="/intake"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-xl border border-gold/40 bg-surface px-4 py-3 font-serif text-sm font-bold text-primary transition hover:bg-gold-soft/30"
          >
            <span>웹폼으로 상황 남기기 (1분)</span>
            <span>→</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="block w-full border-t border-line py-3 text-xs text-text-muted transition hover:bg-surface-muted"
        >
          나중에 다시 보기
        </button>
      </div>
    </div>
  );
}
