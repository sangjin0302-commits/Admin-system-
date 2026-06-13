import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { EthosLogo } from "@/components/brand/ethos-logo";
import { TrustStats } from "@/components/public/trust-stats";
import { Reveal } from "@/components/public/reveal";
import { HOME_COPY, normalizeLang } from "@/lib/i18n-public";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";

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
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.4">
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
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.4">
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
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.4">
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
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.4">
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
    description: "이성, 질서, 절차. 행정 문제를 정확하고 논리적으로 풀어가는 태도를 담았습니다.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12 text-primary">
        <path d="M18 18 Q16 16 18 14 L46 14 Q48 16 46 18 Z" fill="currentColor" />
        <circle cx="20" cy="16" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="44" cy="16" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="22" y="18" width="20" height="34" fill="currentColor" />
        <rect x="18" y="52" width="28" height="3" fill="currentColor" />
      </svg>
    )
  },
  {
    greek: "Ethos",
    korean: "에토스 · 빛",
    title: "신뢰",
    description: "신뢰, 품격, 책임. 의뢰인에게 믿을 수 있는 기준과 방향을 제시하는 마음을 담았습니다.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12 text-gold">
        <path d="M32 8 L36 28 L56 32 L36 36 L32 56 L28 36 L8 32 L28 28 Z" fill="currentColor" />
        <circle cx="32" cy="32" r="4" fill="currentColor" />
      </svg>
    )
  },
  {
    greek: "Pathos",
    korean: "파토스 · 손",
    title: "공감",
    description: "공감, 이해, 위로. 행정의 문제 뒤에 있는 사람의 사정과 마음을 함께 헤아립니다.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="h-12 w-12 text-gold-deep">
        <path d="M10 42 Q15 28 28 36 Q34 40 40 36 Q53 28 56 42 Q48 52 32 52 Q16 52 10 42 Z" fill="currentColor" />
      </svg>
    )
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
      className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-text-strong hover:shadow-lg hover:shadow-primary/20"
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
      className="inline-flex h-12 items-center justify-center rounded-lg border border-gold/40 bg-surface/60 px-6 text-sm font-semibold text-primary backdrop-blur transition-all duration-300 hover:border-gold hover:bg-gold-soft/30"
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

  return (
    <div>
      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr]">
          {/* 좌: 카피 */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-soft/20 px-4 py-1.5 text-xs font-semibold text-gold-deep backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {t.heroTagBadge}
              </span>
            </Reveal>

            <Reveal delay={1}>
              <h1 className="ethos-display mt-6 text-[2.6rem] leading-[1.12] sm:text-6xl">
                {t.heroTitleA}
                <br />
                {t.heroTitleB}
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10">{t.heroTitleC}</span>
                  <span className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-gold/25" aria-hidden />
                </span>
                {t.heroTitleD}
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="mt-7 max-w-xl text-base leading-8 text-text">{t.heroDescription}</p>
            </Reveal>

            <Reveal delay={3}>
              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryCta href="/quick-check">{t.ctaQuickCheck}</PrimaryCta>
                <SecondaryCta href={intakeHref}>{t.ctaIntake}</SecondaryCta>
                <SecondaryCta href="/track">{t.ctaTrack}</SecondaryCta>
              </div>
            </Reveal>

            <Reveal delay={4}>
              <p className="mt-6 text-xs leading-5 text-text-muted">{t.safetyNote}</p>
            </Reveal>
          </div>

          {/* 우: 로고 + 슬로건 카드 */}
          <Reveal delay={2} className="flex justify-center lg:justify-end">
            <div className="ethos-card ethos-grain relative w-full max-w-sm p-10 text-center">
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-[18px] bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="flex justify-center">
                <EthosLogo size={150} />
              </div>
              <h2 className="ethos-display mt-6 text-3xl tracking-[0.22em]">ETHOS</h2>
              <p className="mt-1 font-serif text-xs tracking-wide text-text-muted">
                Administrative Attorney Office
              </p>
              <div className="ethos-divider my-5">
                <span />
              </div>
              <p className="font-serif text-sm italic leading-7 text-gold-deep">
                Reason in Process
                <br />
                Empathy for People
                <br />
                Trust in Every Step
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 본문 컨테이너 */}
      <div className="mx-auto max-w-6xl space-y-24 px-4 pb-8 sm:px-6">
        {/* ══ 신뢰 통계 ══ */}
        <Reveal>
          <TrustStats />
        </Reveal>

        {/* ══ 인사말 / 철학 ══ */}
        <section className="relative">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Brand Story</p>
            <h2 className="ethos-display mx-auto mt-4 max-w-3xl text-3xl leading-snug sm:text-4xl">
              절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.
            </h2>
          </Reveal>

          <Reveal delay={1}>
            <div className="mx-auto mt-10 max-w-3xl space-y-5 text-center text-base leading-8 text-text">
              <p>
                행정 문제는 단순한 서류 작성이 아닙니다. 그 안에는 누군가의 생계, 체류, 권리,
                가족, 사업, 그리고 앞으로의 삶이 함께 담겨 있습니다.
              </p>
              <p>
                <span className="font-serif font-bold text-primary">에토스 행정사사무소</span>는
                아리스토텔레스가 말한 설득의 세 요소,
                <span className="mx-1 font-serif italic text-gold-deep">Logos · Pathos · Ethos</span>
                를 바탕으로 의뢰인의 상황을 세심하게 듣고, 가장 현실적인 방향을 함께 찾아갑니다.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PHILOSOPHY.map((p, i) => (
              <Reveal key={p.greek} delay={(i + 1) as 1 | 2 | 3}>
                <div className="ethos-card ethos-card-hover relative h-full overflow-hidden p-8 text-center">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <div className="flex justify-center">{p.icon}</div>
                  <p className="mt-5 font-serif text-2xl font-bold italic text-gold-deep">{p.greek}</p>
                  <p className="mt-1 font-serif text-sm text-text-muted">{p.korean}</p>
                  <h3 className="ethos-display mt-4 text-3xl">{p.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-text-muted">{p.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ 4개 업무 영역 ══ */}
        <section aria-labelledby="practice-heading">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Practice Areas</p>
            <h2 id="practice-heading" className="ethos-display mt-4 text-3xl sm:text-4xl">
              네 가지 주력 분야
            </h2>
            <p className="mt-3 text-sm text-text-muted">각 분야별 전문 워크플로우로 사안을 체계적으로 정리합니다.</p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {PRACTICE_AREAS.map((area, i) => (
              <Reveal key={area.title} delay={((i % 2) + 1) as 1 | 2}>
                <div className="ethos-card ethos-card-hover ethos-card-topline group flex h-full flex-col p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold-soft/30 text-primary transition-colors duration-300 group-hover:bg-gold-soft/60">
                      {area.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-xs font-bold italic text-gold/70">{area.no}</span>
                        <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                          {area.subtitle}
                        </p>
                      </div>
                      <h3 className="ethos-display mt-1 text-2xl">{area.title}</h3>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-text">{area.description}</p>

                  <ul className="mt-5 space-y-2.5">
                    {area.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2.5 text-sm text-text-muted">
                        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-center justify-between border-t border-gold/15 pt-5">
                    <Link href={area.href} className="ethos-link font-serif text-sm font-semibold">
                      자세히 보기 →
                    </Link>
                    <Link
                      href={intakeHref}
                      className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-text-strong"
                    >
                      상담 신청
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ 진행 흐름 ══ */}
        <section aria-labelledby="process-heading">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Our Process</p>
            <h2 id="process-heading" className="ethos-display mt-4 text-3xl sm:text-4xl">
              다섯 단계 진행 절차
            </h2>
            <p className="mt-3 text-sm text-text-muted">고객이 준비할 일과 사무소가 확인할 일을 단계별로 안내합니다.</p>
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-5">
            {PROCESS_STEPS.map((step, idx) => (
              <Reveal key={step.step} delay={((idx % 4) + 1) as 1 | 2 | 3 | 4}>
                <div className="relative">
                  <div className="ethos-card ethos-card-hover h-full p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-gold-soft/40 font-serif text-sm font-bold text-primary">
                      {step.step}
                    </div>
                    <h3 className="ethos-display mt-4 text-lg">{step.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-text-muted">{step.desc}</p>
                  </div>
                  {idx < PROCESS_STEPS.length - 1 && (
                    <svg
                      viewBox="0 0 24 24"
                      className="absolute right-[-14px] top-1/2 hidden h-5 w-5 -translate-y-1/2 text-gold lg:block"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ 진행상황 조회 + 신뢰 원칙 ══ */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="ethos-card ethos-card-hover relative h-full overflow-hidden p-9">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gold/10" />
              <p className="ethos-eyebrow relative">Tracking</p>
              <h2 className="ethos-display relative mt-4 text-2xl leading-snug">
                접수번호로
                <br />
                다음 단계 확인
              </h2>
              <p className="relative mt-3 text-sm leading-7 text-text-muted">
                접수 후 받은 접수번호로 자료요청, 검토 중 상태, 다음 안내를 한곳에서 확인하실 수 있습니다.
              </p>
              <div className="relative mt-7">
                <PrimaryCta href="/track">접수번호로 조회하기</PrimaryCta>
              </div>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div>
              <p className="ethos-eyebrow">Office Principles</p>
              <h2 className="ethos-display mt-4 text-2xl">사무소 운영 원칙</h2>
              <div className="mt-6 space-y-3">
                {[
                  { title: "공식 기준 우선", desc: "공식 서식·제출기관 기준 확인 후 진행합니다." },
                  { title: "관리자 검토", desc: "기관 제출은 관리자 검토 후 안내합니다." },
                  { title: "정보 보호", desc: "민감 정보 분리 보관, 외부 자동 전송 없습니다." },
                  { title: "사안별 상담", desc: "사안마다 자료·절차가 다르므로 개별 검토합니다." }
                ].map((p) => (
                  <div
                    key={p.title}
                    className="flex items-start gap-3 rounded-r-lg border-l-2 border-gold/50 bg-surface-muted/40 px-4 py-3 transition-colors hover:bg-surface-muted/70"
                  >
                    <div>
                      <p className="font-serif text-sm font-bold text-primary">{p.title}</p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs italic leading-5 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
            </div>
          </Reveal>
        </section>

        {/* ══ FAQ ══ */}
        <section aria-labelledby="home-faq-heading">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">FAQ</p>
            <h2 id="home-faq-heading" className="ethos-display mt-4 text-3xl sm:text-4xl">
              자주 묻는 질문
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {FAQ_ITEMS.map((item, i) => (
              <Reveal key={item.q} delay={((i % 2) + 1) as 1 | 2}>
                <div className="ethos-card ethos-card-hover h-full p-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft font-serif text-sm font-bold italic text-gold-deep">
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
        </section>

        {/* ══ 최종 CTA ══ */}
        <Reveal>
          <section className="ethos-grain relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-primary via-primary to-text-strong p-10 shadow-floating sm:p-14">
            <svg className="absolute -right-20 -top-20 h-80 w-80 text-gold/15" viewBox="0 0 200 200" fill="none" aria-hidden>
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" />
              <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.7" />
              <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" />
            </svg>

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="ethos-eyebrow text-gold-soft">Begin Your Story</p>
                <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">
                  지금 필요한 업무를
                  <br />
                  접수하고 다음 단계를 확인하세요
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/80">
                  비자·행정심판·계약서·인허가 — 어떤 사안이든 사실관계 확인부터 신중하게 시작합니다.
                </p>
                <p className="mt-3 font-serif text-sm italic text-gold-soft">
                  Reason in Process · Empathy for People · Trust in Every Step.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href={intakeHref}
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-gold px-6 text-sm font-bold text-primary shadow-md transition-all duration-300 hover:bg-gold-soft hover:shadow-lg"
                >
                  상담 신청하기
                </Link>
                <Link
                  href="/track"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-gold/60 bg-transparent px-6 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
                >
                  진행상황 조회
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
