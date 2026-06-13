import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { EthosLogo, EthosWordmark } from "@/components/brand/ethos-logo";
import { TrustStats } from "@/components/public/trust-stats";
import { HOME_COPY, normalizeLang } from "@/lib/i18n-public";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ETHOS 행정사사무소 — 절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를",
  description:
    "에토스 행정사사무소. 비자/외국인 체류, 행정심판, 계약서·사실조사, 인허가 업무를 Logos·Pathos·Ethos 철학으로 함께합니다."
};

type PracticeArea = {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  bullets: readonly string[];
  icon: ReactNode;
};

const PRACTICE_AREAS: readonly PracticeArea[] = [
  {
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
      className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-text-strong hover:shadow-md"
    >
      {children}
    </Link>
  );
}

function SecondaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-gold/40 bg-surface px-6 text-sm font-semibold text-primary transition hover:border-gold hover:bg-gold-soft/30"
    >
      {children}
    </Link>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold" />
    </div>
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
    <div className="mx-auto max-w-6xl space-y-20 px-4 sm:space-y-24 sm:px-6">
      {/* HERO — 로고 + 워드마크 */}
      <section className="relative overflow-hidden pt-12 pb-8">
        {/* Aurora 배경 */}
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />

        {/* Grid 패턴 */}
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />

        {/* 골드 곡선 장식 */}
        <svg
          className="absolute -right-32 -top-20 -z-10 h-[400px] w-[600px] text-gold/20"
          viewBox="0 0 600 400"
          fill="none"
          aria-hidden
        >
          <path d="M0 200 Q150 50 300 200 T600 200" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M0 250 Q150 100 300 250 T600 250" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M0 300 Q150 150 300 300 T600 300" stroke="currentColor" strokeWidth="0.7" fill="none" />
        </svg>

        <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
          <div className="flex justify-center lg:justify-start">
            <EthosLogo size={180} />
          </div>
          <div>
            <EthosWordmark />
            <GoldDivider />
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryCta href="/quick-check">{t.ctaQuickCheck}</PrimaryCta>
              <SecondaryCta href={intakeHref}>{t.ctaIntake}</SecondaryCta>
              <SecondaryCta href="/track">{t.ctaTrack}</SecondaryCta>
            </div>
          </div>
        </div>
      </section>

      {/* 신뢰 통계 */}
      <TrustStats />

      {/* 인사말 / 철학 */}
      <section className="relative">
        <div className="text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Brand Story</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-primary sm:text-4xl">
            절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.
          </h2>
        </div>

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

        {/* 3가지 가치 */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PHILOSOPHY.map((p) => (
            <Card key={p.greek} className="relative overflow-hidden p-7 text-center">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="flex justify-center">{p.icon}</div>
              <p className="mt-5 font-serif text-2xl font-bold italic text-gold-deep">{p.greek}</p>
              <p className="mt-1 font-serif text-sm text-text-muted">{p.korean}</p>
              <h3 className="mt-4 font-serif text-3xl font-bold text-primary">{p.title}</h3>
              <p className="mt-4 text-sm leading-7 text-text-muted">{p.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4개 업무 영역 */}
      <section className="space-y-8" aria-labelledby="practice-heading">
        <div className="text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Practice Areas</p>
          <h2 id="practice-heading" className="mt-3 font-serif text-3xl font-bold text-primary sm:text-4xl">
            네 가지 주력 분야
          </h2>
          <p className="mt-3 text-sm text-text-muted">각 분야별 전문 워크플로우로 사안을 체계적으로 정리합니다.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {PRACTICE_AREAS.map((area) => (
            <Card key={area.title} className="group relative flex h-full flex-col overflow-hidden p-7 transition hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gold/0 via-gold to-gold/0 opacity-0 transition group-hover:opacity-100" />

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-gold/40 bg-gold-soft/30 text-primary">
                  {area.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                    {area.subtitle}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-primary">{area.title}</h3>
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

              <div className="mt-6 flex items-center justify-between border-t border-gold/20 pt-4">
                <Link href={area.href} className="font-serif text-sm font-semibold text-primary hover:text-gold-deep">
                  자세히 보기 →
                </Link>
                <Link
                  href={intakeHref}
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-text-strong"
                >
                  상담 신청
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 진행 흐름 */}
      <section className="space-y-8" aria-labelledby="process-heading">
        <div className="text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Our Process</p>
          <h2 id="process-heading" className="mt-3 font-serif text-3xl font-bold text-primary sm:text-4xl">
            다섯 단계 진행 절차
          </h2>
          <p className="mt-3 text-sm text-text-muted">고객이 준비할 일과 사무소가 확인할 일을 단계별로 안내합니다.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {PROCESS_STEPS.map((step, idx) => (
            <div key={step.step} className="relative">
              <Card className="h-full p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold/50 bg-gold-soft/40 font-serif text-sm font-bold text-primary">
                  {step.step}
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-primary">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-text-muted">{step.desc}</p>
              </Card>
              {idx < PROCESS_STEPS.length - 1 && (
                <svg viewBox="0 0 24 24" className="absolute right-[-14px] top-1/2 hidden h-5 w-5 -translate-y-1/2 text-gold lg:block" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 진행상황 조회 + 신뢰 원칙 */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="relative overflow-hidden p-8">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gold/10" />
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Tracking</p>
          <h2 className="relative mt-3 font-serif text-2xl font-bold text-primary">
            접수번호로<br />다음 단계 확인
          </h2>
          <p className="relative mt-3 text-sm leading-7 text-text-muted">
            접수 후 받은 접수번호로 자료요청, 검토 중 상태, 다음 안내를 한곳에서 확인하실 수 있습니다.
          </p>
          <div className="relative mt-6">
            <PrimaryCta href="/track">접수번호로 조회하기</PrimaryCta>
          </div>
        </Card>

        <div>
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Office Principles</p>
          <h2 className="mt-3 font-serif text-2xl font-bold text-primary">사무소 운영 원칙</h2>
          <div className="mt-6 space-y-3">
            {[
              { title: "공식 기준 우선", desc: "공식 서식·제출기관 기준 확인 후 진행합니다." },
              { title: "관리자 검토", desc: "기관 제출은 관리자 검토 후 안내합니다." },
              { title: "정보 보호", desc: "민감 정보 분리 보관, 외부 자동 전송 없습니다." },
              { title: "사안별 상담", desc: "사안마다 자료·절차가 다르므로 개별 검토합니다." }
            ].map((p) => (
              <div key={p.title} className="flex items-start gap-3 border-l-2 border-gold/50 bg-surface-muted/40 px-4 py-3">
                <div>
                  <p className="font-serif text-sm font-bold text-primary">{p.title}</p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs italic leading-5 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-8" aria-labelledby="home-faq-heading">
        <div className="text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">FAQ</p>
          <h2 id="home-faq-heading" className="mt-3 font-serif text-3xl font-bold text-primary sm:text-4xl">
            자주 묻는 질문
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <Card key={item.q} className="p-6">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft font-serif text-sm font-bold italic text-gold-deep">
                  Q
                </span>
                <div>
                  <h3 className="font-serif text-base font-bold text-primary">{item.q}</h3>
                  <p className="mt-2 text-sm leading-7 text-text-muted">{item.a}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 최종 CTA */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-primary via-primary to-text-strong p-10 shadow-floating sm:p-12">
        <svg
          className="absolute -right-20 -top-20 h-80 w-80 text-gold/15"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.7" />
          <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" />
        </svg>

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-soft">Begin Your Story</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
              지금 필요한 업무를<br />접수하고 다음 단계를 확인하세요
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
              className="inline-flex h-12 items-center justify-center rounded-lg bg-gold px-6 text-sm font-bold text-primary shadow-md transition hover:bg-gold-soft"
            >
              상담 신청하기
            </Link>
            <Link
              href="/track"
              className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-gold/60 bg-transparent px-6 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
            >
              진행상황 조회
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
