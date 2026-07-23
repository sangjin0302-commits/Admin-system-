import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

import { CHANNELS, CONSULT_TAGLINE } from "@/lib/constants/channels";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "모든 채널 — 에토스 행정사사무소(ETHOS) 지상진",
  description:
    "네이버 톡톡, 카카오, 이메일, 텔레그램, 네이버 엑스퍼트, 링크드인 — 한 곳에서 연결하세요.",
  openGraph: {
    title: "ETHOS · 행정사 지상진 — 모든 채널",
    description: "한·영·아랍어 응대 · 무료 검토 · 수임 시 상담료 차감"
  }
};

type Link = {
  url: string;
  label: string;
  sub: string;
  bg: string;
  fg: string;
  icon: React.ReactNode;
  primary?: boolean;
  external?: boolean;
};

const LINKS: Link[] = [
  {
    url: CHANNELS.naverTalk.url,
    label: "네이버 톡톡",
    sub: "가장 빠른 무료 검토 · 한국어",
    bg: "bg-[#03C75A]",
    fg: "text-white",
    icon: <NaverIcon />,
    primary: true,
    external: true
  },
  {
    url: CHANNELS.kakao.url,
    label: "카카오 채팅",
    sub: "카카오로 검토 요청",
    bg: "bg-[#FEE500]",
    fg: "text-[#3C1E1E]",
    icon: <KakaoIcon />,
    external: true
  },
  {
    url: CHANNELS.telegram.url,
    label: "Telegram",
    sub: `${CHANNELS.telegram.value} · English`,
    bg: "bg-[#0088CC]",
    fg: "text-white",
    icon: <TelegramIcon />,
    external: true
  },
  {
    url: CHANNELS.email.url,
    label: "Email",
    sub: CHANNELS.email.value,
    bg: "bg-primary",
    fg: "text-white",
    icon: <MailIcon />
  },
  {
    url: CHANNELS.naverExpert.url,
    label: "네이버 엑스퍼트 (유료 상담)",
    sub: "33,000 ~ 55,000원 · 수임 시 차감",
    bg: "bg-surface border-2 border-gold/50",
    fg: "text-primary",
    icon: <ExpertIcon />,
    external: true
  },
  {
    url: "https://www.linkedin.com/in/kareem-sangjin-ji-052419212",
    label: "LinkedIn",
    sub: "Kareem Sangjin Ji · Professional profile",
    bg: "bg-[#0A66C2]",
    fg: "text-white",
    icon: <LinkedInIcon />,
    external: true
  }
];

const SECONDARY = [
  { url: "/about", label: "사무소 · 대표 소개" },
  { url: "/services", label: "5대 업무 분야" },
  { url: "/consult", label: "상담 안내 (무료 vs 유료)" },
  { url: "/blog", label: "법률 칼럼" },
  { url: "/intake", label: "상담 신청서" }
];

export default async function LinksPage() {
  const photoRow = await prisma.siteSetting
    .findUnique({ where: { key: "image.aboutPhoto" } })
    .catch(() => null);
  const photo = photoRow?.value || null;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="ethos-aurora ethos-aurora-animated" aria-hidden />

      <main className="mx-auto max-w-md px-5 py-12 sm:py-16">
        {/* 프로필 헤더 */}
        <section className="text-center">
          <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-gold/40 bg-gradient-to-br from-primary/10 to-gold/10 shadow-floating">
            {photo ? (
              <Image src={photo} alt="Jean" fill className="object-cover" unoptimized sizes="96px" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="ethos-display text-3xl text-primary">J</span>
              </div>
            )}
          </div>
          <p className="mt-5 font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-deep">
            ETHOS 행정사사무소
          </p>
          <h1 className="ethos-display mt-2 text-3xl">행정사 지상진</h1>
          <p className="mt-2 text-sm text-text-muted">
            비자 · 행정심판 · 계약 · 인허가 · 법인설립
          </p>

          {/* 다국어 배지 */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">🇰🇷 한국어</span>
            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">🇬🇧 English</span>
          </div>

          <p className="mt-4 inline-block rounded-full bg-gold-soft/40 px-3 py-1 text-xs font-bold text-gold-deep">
            {CONSULT_TAGLINE}
          </p>
        </section>

        {/* 채널 링크 — primary first */}
        <section className="mt-10 space-y-3">
          {LINKS.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noreferrer" : undefined}
              className={`flex items-center gap-3 rounded-2xl ${l.bg} px-5 py-4 ${l.fg} shadow-panel transition-all hover:shadow-floating hover:brightness-95 ${l.primary ? "ring-2 ring-gold/40 ring-offset-2 ring-offset-canvas" : ""}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                {l.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-base font-bold">{l.label}</span>
                <span className="block truncate text-xs opacity-90">{l.sub}</span>
              </span>
              <span className="text-lg opacity-70">↗</span>
            </a>
          ))}
        </section>

        {/* 사이트 내 링크 */}
        <section className="mt-8 space-y-2">
          <p className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">
            사이트 둘러보기
          </p>
          {SECONDARY.map((s) => (
            <Link
              key={s.url}
              href={s.url}
              className="flex items-center justify-between rounded-xl border border-gold/30 bg-surface px-4 py-3 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
            >
              {s.label}
              <span className="text-text-muted">→</span>
            </Link>
          ))}
        </section>

        {/* 권위 신호 */}
        <section className="mt-10 rounded-2xl border border-gold/30 bg-surface p-5">
          <p className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">
            Authority
          </p>
          <ul className="mt-3 space-y-1.5 text-xs leading-6 text-text-muted">
            <li>· 주한 대사관 비자·출입국 실무 3년</li>
            <li>· 법무부 난민 판결문 공식 번역인</li>
            <li>· 법원행정처 법정 통번역인 등록</li>
            <li>· 한국외대 통번역대학원 한국어–아랍어 전공</li>
            <li>· OASIS 4 외국인 창업지원 강의 이력</li>
            <li>· AI 법률 자동화 시스템 개발·운영</li>
          </ul>
        </section>

        {/* 푸터 */}
        <footer className="mt-10 text-center">
          <p className="ethos-quote text-xs text-gold-deep">
            절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.
          </p>
          <p className="mt-3 text-[11px] text-text-muted">© ETHOS 행정사사무소 · 서울 동대문구</p>
        </footer>
      </main>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.78 1.79 5.22 4.5 6.66l-.94 3.45c-.08.29.23.52.49.36L10 19.5c.65.07 1.32.11 2 .11 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  );
}
function NaverIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727z" />
    </svg>
  );
}
function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M21.5 4.5 2.3 12c-1.3.5-1.3 1.3-.2 1.6l5 1.5 1.9 6.1c.2.6.4.8.8.8.3 0 .5-.1.8-.4L13 19l5.2 3.8c.9.5 1.6.3 1.9-.9L23 6c.3-1.4-.4-2-1.5-1.5z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}
function ExpertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM2.4 21V9.5h5.2V21H2.4zM9.5 9.5h5v1.6c.7-1.2 2.4-1.8 4-1.8 4.2 0 5 2.7 5 6.3V21h-5.2v-4.7c0-1.1-.4-2.3-1.9-2.3s-2.2 1.1-2.2 2.3V21H9.5V9.5z" />
    </svg>
  );
}
