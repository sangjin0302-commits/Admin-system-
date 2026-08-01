"use client";

import { useEffect, useState } from "react";

import { CHANNELS, CONSULT_TAGLINE } from "@/lib/constants/channels";

export function FloatingContact() {
  // 기본 펼침 — 상담 채널을 말풍선 안에 숨기지 않고 바로 노출.
  const [expanded, setExpanded] = useState(true);
  const [isEn, setIsEn] = useState(false);

  useEffect(() => {
    // 루트 init 스크립트가 경로/lang 에 따라 <html lang> 을 세팅함 → 영문 여부 판정.
    setIsEn(document.documentElement.lang === "en");
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const L = isEn
    ? {
        heading: "Talk to us",
        tagline: "Free review · Paid consultation · Credited on engagement",
        naver: ["Naver Talk", "Fastest free review"],
        kakao: ["KakaoTalk", "Request a review via Kakao"],
        telegram: ["Telegram", CHANNELS.telegram.value],
        email: ["Email", CHANNELS.email.value],
        expert: ["Naver Expert", "Paid consultation · ₩33,000–55,000"],
        linkedin: ["LinkedIn", "English columns & profile"]
      }
    : {
        heading: "검토 · 상담 연결",
        tagline: CONSULT_TAGLINE,
        naver: ["네이버 톡톡", "가장 빠른 무료 검토"],
        kakao: ["카카오 채팅", "카카오로 검토 요청"],
        telegram: ["텔레그램", CHANNELS.telegram.value],
        email: ["이메일", CHANNELS.email.value],
        expert: ["네이버 엑스퍼트", "유료 상담 · 33,000~55,000원"],
        linkedin: ["LinkedIn", "영문 칼럼 · 프로필"]
      };

  return (
    <>
      {/* 데스크탑 우하단 */}
      <div className="fixed bottom-6 right-6 z-50 hidden flex-col items-end gap-3 lg:flex">
        {expanded && (
          <div className="flex w-72 flex-col gap-2 rounded-2xl border border-gold/40 bg-surface p-4 shadow-floating">
            <div className="mb-1 border-b border-gold/20 pb-2">
              <p className="font-serif text-sm font-bold text-primary">{L.heading}</p>
              <p className="mt-0.5 text-[11px] text-text-muted">{L.tagline}</p>
            </div>
            <ChannelButton url={CHANNELS.naverTalk.url} bg="bg-[#03C75A]" fg="text-white" label={L.naver[0]} sub={L.naver[1]} icon={<NaverIcon />} />
            <ChannelButton url={CHANNELS.kakao.url} bg="bg-[#FEE500]" fg="text-[#3C1E1E]" label={L.kakao[0]} sub={L.kakao[1]} icon={<KakaoIcon />} />
            <ChannelButton url={CHANNELS.telegram.url} bg="bg-[#0088CC]" fg="text-white" label={L.telegram[0]} sub={L.telegram[1]} icon={<TelegramIcon />} />
            <ChannelButton url={CHANNELS.linkedin.url} bg="bg-[#0A66C2]" fg="text-white" label={L.linkedin[0]} sub={L.linkedin[1]} icon={<LinkedInIcon />} />
            <ChannelButton url={CHANNELS.email.url} bg="bg-primary" fg="text-white" label={L.email[0]} sub={L.email[1]} icon={<MailIcon />} />
            <ChannelButton url={CHANNELS.naverExpert.url} bg="bg-surface border border-gold/40" fg="text-primary" label={L.expert[0]} sub={L.expert[1]} icon={<ExpertIcon />} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-floating transition hover:bg-text-strong"
          aria-label="검토·상담 연결"
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

      {/* 모바일 sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-gold/30 bg-surface/95 backdrop-blur lg:hidden">
        <a
          href={CHANNELS.naverTalk.url}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-1 border-r border-gold/20 bg-[#03C75A]/90 py-3 text-white"
        >
          <NaverIcon className="h-5 w-5" />
          <span className="text-[11px] font-bold">톡톡</span>
        </a>
        <a
          href={CHANNELS.kakao.url}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-1 border-r border-gold/20 bg-[#FEE500]/90 py-3 text-[#3C1E1E]"
        >
          <KakaoIcon className="h-5 w-5" />
          <span className="text-[11px] font-bold">카카오</span>
        </a>
        <a
          href="/intake"
          className="flex flex-col items-center justify-center gap-1 bg-primary py-3 text-white"
        >
          <FormIcon className="h-5 w-5" />
          <span className="text-[11px] font-bold">검토 요청</span>
        </a>
      </div>

      <div className="h-16 lg:hidden" aria-hidden />
    </>
  );
}

function ChannelButton({ url, bg, fg, label, sub, icon }: { url: string; bg: string; fg: string; label: string; sub: string; icon: React.ReactNode }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 rounded-xl ${bg} px-3 py-2.5 ${fg} transition hover:brightness-95`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-sm font-bold">{label}</span>
        <span className="block truncate text-[11px] opacity-80">{sub}</span>
      </span>
    </a>
  );
}

function KakaoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.78 1.79 5.22 4.5 6.66l-.94 3.45c-.08.29.23.52.49.36L10 19.5c.65.07 1.32.11 2 .11 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  );
}
function NaverIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727z" />
    </svg>
  );
}
function TelegramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M21.5 4.5 2.3 12c-1.3.5-1.3 1.3-.2 1.6l5 1.5 1.9 6.1c.2.6.4.8.8.8.3 0 .5-.1.8-.4L13 19l5.2 3.8c.9.5 1.6.3 1.9-.9L23 6c.3-1.4-.4-2-1.5-1.5z" />
    </svg>
  );
}
function MailIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}
function ExpertIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z" />
    </svg>
  );
}
function LinkedInIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.3 8.65 21 10.9 21 14v7h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21H9z" />
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
