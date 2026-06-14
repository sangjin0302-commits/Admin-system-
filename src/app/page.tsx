import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { EthosLogo } from "@/components/brand/ethos-logo";
import { TrustStats } from "@/components/public/trust-stats";
import { Testimonials } from "@/components/public/testimonials";
import { Reveal } from "@/components/public/reveal";
import { HOME_COPY, normalizeLang } from "@/lib/i18n-public";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";
import { getSiteSettings } from "@/lib/services/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ETHOS 행정사사무소 — 절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를",
  description:
    "에토스 행정사사무소. 비자/외국인 체류, 행정심판, 계약서·사실조사, 인허가 업무를 Logos·Pathos·Ethos 철학으로 함께합니다."
};

type PracticeArea = {
  no: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  bullets: readonly string[];
  icon: ReactNode;
};

const PRACTICE_AREAS: readonly PracticeArea[] = [
  {
    no: "01",
    title: "비자 / 외국인 체류",
    subtitle: "VISA & IMMIGRATION",
    description: "체류기간 연장, 자격 변경, 초청, 영주·국적, 강제퇴거 대응까지 한 흐름으로 정리합니다.",
    href: "/services/immigration",
    bullets: ["체류 자격 변경 / 연장", "사업·투자 비자", "강제퇴거 / 출국명령 대응"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  },
  {
    no: "02",
    title: "행정심판",
    subtitle: "ADMINISTRATIVE APPEAL",
    description: "처분 내용·통지일·청구기한을 확인하고 청구이유·증거자료를 정리해 심판을 준비합니다.",
    href: "/services/appeal",
    bullets: ["청구기한 검토 (90일)", "처분청·재결청 분리 관리", "재결까지 단계별 추적"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 3v18M6 8h12M5 13l7-3 7 3M5 13v3a7 7 0 0 0 14 0v-3" />
      </svg>
    )
  },
  {
    no: "03",
    title: "계약서 / 사실조사",
    subtitle: "CONTRACT & INVESTIGATION",
    description: "계약 검토·작성, 분쟁 사실관계 조사, 법적 근거 정리, 조사보고서 작성을 지원합니다.",
    href: "/services/contract",
    bullets: ["계약서 작성 / 검토", "분쟁 사실관계 조사", "조사보고서 작성"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6M8 13h8M8 17h5" />
      </svg>
    )
  },
  {
    no: "04",
    title: "인허가",
    subtitle: "LICENSE & PERMIT",
    description: "사업·건축·식품·의료·환경 등 인허가 신청, 보완 대응, 불복 절차를 함께 준비합니다.",
    href: "/services/license",
    bullets: ["사업·건축·식품 허가", "처리기한 / 보완 관리", "불허 시 불복 절차"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 3v4M16 3v4M4 11h16M9 15l2 2 4-4" />
      </svg>
    )
  }
];

const PHILOSOPHY = [
  {
    greek: "Logos",
    korean: "로고스 · 기둥",
    title: "이성",
    description: "이성, 질서, 절차. 행정 문제를 정확하고 논리적으로 풀어가는 태도를 담았습니다."
  },
  {
    greek: "Ethos",
    korean: "에토스 · 빛",
    title: "신뢰",
    description: "신뢰, 품격, 책임. 의뢰인에게 믿을 수 있는 기준과 방향을 제시하는 마음을 담았습니다."
  },
  {
    greek: "Pathos",
    korean: "파토스 · 손",
    title: "공감",
    description: "공감, 이해, 위로. 행정의 문제 뒤에 있는 사람의 사정과 마음을 함께 헤아립니다."
  }
] as const;

const PROCESS_STEPS = [
  { step: "01", title: "접수", desc: "업무 분야, 연락처, 기본 사실관계를 남깁니다." },
  { step: "02", title: "사실관계 확인", desc: "처분서, 통지일, 체류자격, 제출기관을 확인합니다." },
  { step: "03", title: "자료 요청", desc: "필요 자료와 보완 항목을 안내합니다." },
  { step: "04", title: "기한·서식 검토", desc: "공식 서식·제출기관 기준·기한을 확인합니다." },
  { step: "05", title: "제출 준비", desc: "관리자 검토 후 제출 준비와 보완 대응을 정리합니다." }
] as const;

const FAQ_ITEMS = [
  { q: "상담 신청 후 바로 진행되나요?", a: "사실관계와 자료를 확인한 뒤 가능한 범위와 다음 단계를 안내합니다." },
  { q: "행정심판 청구기한이 지나면 어떻게 되나요?", a: "처분일·통지일을 기준으로 청구기한을 확인합니다. 기한 경과 시 사안별 대응을 함께 검토합니다." },
  { q: "계약서 검토만 의뢰할 수 있나요?", a: "계약서 작성/검토 단독 의뢰 가능합니다. 분쟁 발생 시 사실조사를 추가로 진행할 수 있습니다." },
  { q: "인허가 보완 요청 대응도 도와주나요?", a: "신청부터 보완 대응, 불허 처분 시 불복 절차까지 단계별로 관리합니다." },
  { q: "진행상황은 어떻게 확인하나요?", a: "접수 후 받은 접수번호로 자료요청, 검토 상태, 다음 안내를 확인할 수 있습니다." },
  { q: "결과를 보장하나요?", a: "결과를 보장하지 않습니다. 자료 확인 후 안내하며, AI가 최종 판단하지 않습니다." }
] as const;

function PrimaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-text-strong hover:shadow-lg hover:shadow-primary/20"
    >
      {children}
      <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

function SecondaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-lg border border-gold/40 bg-surface/60 px-7 text-sm font-semibold text-primary backdrop-blur transition-all duration-300 hover:border-gold hover:bg-gold-soft/30"
    >
      {children}
    </Link>
  );
}

export default async function PublicMarketingHomePage({
  searchParams
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const lang = normalizeLang(params.lang);
  const t = HOME_COPY[lang];
  const intakeHref = buildWebsiteIntakeHref();

  // 관리자 운영란 컨텐츠 (한국어에서만 override, 영어는 기본 카피)
  const site = await getSiteSettings();
  const heroBadge = lang === "ko" && site["home.heroBadge"] ? site["home.heroBadge"] : t.heroTagBadge;
  const heroDescription =
    lang === "ko" && site["home.heroDescription"] ? site["home.heroDescription"] : t.heroDescription;
  const noticeBanner = site["home.noticeBanner"]?.trim();

  return (
    <div className="overflow-x-clip">
      {/* 공지 배너 (운영란에서 입력 시 표시) */}
      {noticeBanner && (
        <div className="border-b border-gold/30 bg-primary px-4 py-2.5 text-center text-sm text-white">
          <span className="font-serif text-gold-soft">공지</span> · {noticeBanner}
        </div>
      )}

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-soft/20 px-4 py-1.5 text-xs font-semibold text-gold-deep backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {heroBadge}
              </span>
            </Reveal>

            <Reveal delay={1}>
              <h1 className="ethos-display mt-7 text-[2.9rem] leading-[1.08] sm:text-[4.2rem]">
                {t.heroTitleA}
                <br />
                {t.heroTitleB}
                <br />
                <span className="ethos-underline-gold">{t.heroTitleC}</span>
                {t.heroTitleD}
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="mt-8 max-w-xl text-base leading-8 text-text">{heroDescription}</p>
            </Reveal>

            <Reveal delay={3}>
              <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryCta href="/quick-check">{t.ctaQuickCheck}</PrimaryCta>
                <SecondaryCta href={intakeHref}>{t.ctaIntake}</SecondaryCta>
                <SecondaryCta href="/track">{t.ctaTrack}</SecondaryCta>
              </div>
            </Reveal>

            <Reveal delay={4}>
              <p className="mt-7 text-xs leading-5 text-text-muted">{t.safetyNote}</p>
            </Reveal>
          </div>

          {/* 우: 로고 메달리온 */}
          <Reveal delay={2} className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-full bg-gold/8 blur-2xl" aria-hidden />
              <div className="ethos-card ethos-grain relative flex w-full max-w-sm flex-col items-center p-12 text-center">
                <div className="absolute inset-x-10 top-0 h-1 rounded-b bg-gradient-to-r from-transparent via-gold to-transparent" />
                <EthosLogo size={160} />
                <h2 className="ethos-display mt-7 text-3xl tracking-[0.24em]">ETHOS</h2>
                <p className="mt-1 font-serif text-[11px] tracking-[0.15em] text-text-muted">
                  ADMINISTRATIVE ATTORNEY OFFICE
                </p>
                <div className="ethos-divider my-6">
                  <span />
                </div>
                <p className="ethos-quote text-sm leading-7 text-gold-deep">
                  Reason in Process
                  <br />
                  Empathy for People
                  <br />
                  Trust in Every Step
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 신뢰 통계 (soft band) ═══════════════ */}
      <section className="ethos-band ethos-band-soft py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <TrustStats />
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 철학 — DARK 풀블리드 밴드 ═══════════════ */}
      <section className="ethos-band ethos-band-dark ethos-grain overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            {/* 좌: 카피 */}
            <Reveal>
              <div>
                <p className="ethos-eyebrow text-gold-soft">Brand Story</p>
                <h2 className="ethos-display mt-5 text-3xl leading-snug text-white sm:text-[2.6rem]">
                  행정 문제 뒤에 있는
                  <br />
                  사람의 마음까지
                  <br />
                  <span className="text-gold-soft">함께 헤아립니다.</span>
                </h2>
                <p className="mt-7 max-w-md text-sm leading-8 text-white/75">
                  행정 문제는 단순한 서류 작성이 아닙니다. 그 안에는 누군가의 생계, 체류, 권리,
                  가족, 사업, 그리고 앞으로의 삶이 함께 담겨 있습니다.
                </p>
                <p className="mt-4 max-w-md text-sm leading-8 text-white/75">
                  에토스 행정사사무소는 아리스토텔레스가 말한 설득의 세 요소,
                  <span className="ethos-quote mx-1 text-gold-soft">Logos · Pathos · Ethos</span>
                  를 바탕으로 가장 현실적인 방향을 함께 찾아갑니다.
                </p>
                <p className="ethos-quote mt-8 border-l-2 border-gold/60 pl-5 text-lg text-gold-soft">
                  절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.
                </p>
              </div>
            </Reveal>

            {/* 우: 3가치 스택 */}
            <div className="space-y-4">
              {PHILOSOPHY.map((p, i) => (
                <Reveal key={p.greek} delay={(i + 1) as 1 | 2 | 3}>
                  <div className="group flex items-start gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors duration-300 hover:border-gold/40 hover:bg-white/[0.08]">
                    <span className="ethos-quote text-3xl text-gold/40 transition-colors group-hover:text-gold/70">
                      {p.greek}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <h3 className="ethos-display text-2xl text-white">{p.title}</h3>
                        <span className="font-serif text-xs text-white/40">{p.korean}</span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-white/70">{p.description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 4개 업무 — editorial ═══════════════ */}
      <section className="py-24 sm:py-28" aria-labelledby="practice-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="ethos-eyebrow">Practice Areas</p>
                <h2 id="practice-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
                  네 가지 주력 분야
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-7 text-text-muted">
                각 분야별 전문 워크플로우로 사안을 체계적으로 정리합니다.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {PRACTICE_AREAS.map((area, i) => (
              <Reveal key={area.title} delay={((i % 2) + 1) as 1 | 2}>
                <Link
                  href={area.href}
                  className="ethos-card ethos-card-hover ethos-card-topline group relative flex h-full flex-col overflow-hidden p-8"
                >
                  <span className="ethos-index pointer-events-none absolute -right-2 -top-4 select-none">
                    {area.no}
                  </span>
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold-soft/30 text-primary transition-colors duration-300 group-hover:bg-gold-soft/60">
                    {area.icon}
                  </div>
                  <p className="relative mt-6 font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                    {area.subtitle}
                  </p>
                  <h3 className="ethos-display relative mt-1 text-2xl">{area.title}</h3>
                  <p className="relative mt-4 text-sm leading-7 text-text">{area.description}</p>
                  <ul className="relative mt-5 space-y-2.5">
                    {area.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2.5 text-sm text-text-muted">
                        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <span className="relative mt-auto inline-flex items-center gap-1 pt-6 font-serif text-sm font-semibold text-primary transition-colors group-hover:text-gold-deep">
                    자세히 보기
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 진행 절차 — soft band, 타임라인 ═══════════════ */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28" aria-labelledby="process-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Our Process</p>
            <h2 id="process-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
              다섯 단계 진행 절차
            </h2>
            <p className="mt-4 text-sm text-text-muted">고객이 준비할 일과 사무소가 확인할 일을 단계별로 안내합니다.</p>
          </Reveal>

          <div className="relative mt-16">
            {/* 타임라인 라인 */}
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 lg:block" aria-hidden />
            <div className="grid gap-8 lg:grid-cols-5">
              {PROCESS_STEPS.map((step, idx) => (
                <Reveal key={step.step} delay={((idx % 4) + 1) as 1 | 2 | 3 | 4}>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-surface font-serif text-sm font-bold text-primary shadow-sm">
                      {step.step}
                    </div>
                    <h3 className="ethos-display mt-5 text-lg">{step.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-text-muted">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 진행상황 + 운영원칙 ═══════════════ */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <div className="ethos-card ethos-card-hover relative h-full overflow-hidden p-10">
                <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gold/10" />
                <p className="ethos-eyebrow relative">Tracking</p>
                <h2 className="ethos-display relative mt-4 text-2xl leading-snug">
                  접수번호로
                  <br />
                  다음 단계 확인
                </h2>
                <p className="relative mt-4 text-sm leading-7 text-text-muted">
                  접수 후 받은 접수번호로 자료요청, 검토 중 상태, 다음 안내를 한곳에서 확인하실 수 있습니다.
                </p>
                <div className="relative mt-8">
                  <PrimaryCta href="/track">접수번호로 조회하기</PrimaryCta>
                </div>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div>
                <p className="ethos-eyebrow">Office Principles</p>
                <h2 className="ethos-display mt-4 text-2xl">사무소 운영 원칙</h2>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {[
                    { title: "공식 기준 우선", desc: "공식 서식·제출기관 기준 확인 후 진행합니다." },
                    { title: "관리자 검토", desc: "기관 제출은 관리자 검토 후 안내합니다." },
                    { title: "정보 보호", desc: "민감 정보 분리 보관, 외부 자동 전송 없습니다." },
                    { title: "사안별 상담", desc: "사안마다 자료·절차가 다르므로 개별 검토합니다." }
                  ].map((p) => (
                    <div
                      key={p.title}
                      className="rounded-xl border-l-2 border-gold/50 bg-surface-muted/40 px-5 py-4 transition-colors hover:bg-surface-muted/70"
                    >
                      <p className="font-serif text-sm font-bold text-primary">{p.title}</p>
                      <p className="mt-1.5 text-xs leading-6 text-text-muted">{p.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="ethos-quote mt-5 text-xs leading-5 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 의뢰인 후기 ═══════════════ */}
      <Testimonials />

      {/* ═══════════════ FAQ — soft band ═══════════════ */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28" aria-labelledby="home-faq-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">FAQ</p>
            <h2 id="home-faq-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
              자주 묻는 질문
            </h2>
          </Reveal>

          <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
            {FAQ_ITEMS.map((item, i) => (
              <Reveal key={item.q} delay={((i % 2) + 1) as 1 | 2}>
                <div className="ethos-card ethos-card-hover h-full p-6">
                  <div className="flex items-start gap-3">
                    <span className="ethos-quote mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft text-sm font-bold text-gold-deep">
                      Q
                    </span>
                    <div>
                      <h3 className="font-serif text-base font-bold text-primary">{item.q}</h3>
                      <p className="mt-2 text-sm leading-7 text-text-muted">{item.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 최종 CTA ═══════════════ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-primary via-primary to-text-strong p-12 shadow-floating sm:p-16">
              <svg className="absolute -right-20 -top-20 h-80 w-80 text-gold/15" viewBox="0 0 200 200" fill="none" aria-hidden>
                <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" />
                <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.7" />
                <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" />
              </svg>

              <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="ethos-eyebrow text-gold-soft">Begin Your Story</p>
                  <h2 className="ethos-display mt-4 text-3xl text-white sm:text-[2.6rem]">
                    지금 필요한 업무를
                    <br />
                    접수하고 다음 단계를 확인하세요
                  </h2>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-white/80">
                    비자·행정심판·계약서·인허가 — 어떤 사안이든 사실관계 확인부터 신중하게 시작합니다.
                  </p>
                  <p className="ethos-quote mt-4 text-sm text-gold-soft">
                    Reason in Process · Empathy for People · Trust in Every Step.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href={intakeHref}
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-gold px-7 text-sm font-bold text-primary shadow-md transition-all duration-300 hover:bg-gold-soft hover:shadow-lg"
                  >
                    상담 신청하기
                  </Link>
                  <Link
                    href="/track"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-gold/60 bg-transparent px-7 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
                  >
                    진행상황 조회
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
