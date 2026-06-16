import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Reveal } from "@/components/public/reveal";

export const metadata: Metadata = {
  title: "업무 분야 — ETHOS 행정사사무소",
  description: "비자/체류, 행정심판, 계약서/사실조사, 인허가 — 네 가지 주력 분야를 안내합니다."
};

type Area = {
  no: string;
  href: string;
  title: string;
  titleEn: string;
  subtitle: string;
  description: string;
  descriptionEn: string;
  icon: ReactNode;
};

const COPY = {
  ko: {
    heading: "업무 분야",
    intro: "네 가지 주력 분야 — 각 분야별 전문 워크플로우로 사안을 체계적으로 정리합니다.",
    more: "자세히 보기"
  },
  en: {
    heading: "Practice Areas",
    intro: "Four core practice areas — each handled with a dedicated, systematic workflow.",
    more: "Learn more"
  }
} as const;

const AREAS: readonly Area[] = [
  {
    no: "01",
    href: "/services/immigration",
    title: "비자 / 외국인 체류",
    titleEn: "Visa / Immigration",
    subtitle: "VISA & IMMIGRATION",
    description: "체류 자격 변경·연장, 사업/투자 비자, 강제퇴거 대응까지.",
    descriptionEn: "Status changes & extensions, business/investment visas, and removal defense.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  },
  {
    no: "02",
    href: "/services/appeal",
    title: "행정심판",
    titleEn: "Administrative Appeal",
    subtitle: "ADMINISTRATIVE APPEAL",
    description: "처분 통지부터 청구·심리·재결까지 함께 준비합니다.",
    descriptionEn: "From the disposition notice through the claim, hearing, and ruling.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 3v18M6 8h12M5 13l7-3 7 3M5 13v3a7 7 0 0 0 14 0v-3" />
      </svg>
    )
  },
  {
    no: "03",
    href: "/services/contract",
    title: "계약서 / 사실조사",
    titleEn: "Contracts / Fact-Finding",
    subtitle: "CONTRACT & INVESTIGATION",
    description: "계약 검토·작성, 분쟁 사실관계 조사, 조사보고서 작성.",
    descriptionEn: "Contract review & drafting, dispute fact-finding, and investigation reports.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6M8 13h8M8 17h5" />
      </svg>
    )
  },
  {
    no: "04",
    href: "/services/license",
    title: "인허가",
    titleEn: "Licenses / Permits",
    subtitle: "LICENSE & PERMIT",
    description: "사업·건축·식품·의료 등 허가 신청, 보완·불복 대응.",
    descriptionEn: "Business, construction, food, and medical permits, plus supplements and appeals.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 3v4M16 3v4M4 11h16M9 15l2 2 4-4" />
      </svg>
    )
  }
];

export default async function ServicesIndex({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const lang = sp.lang === "en" ? "en" : "ko";
  const c = COPY[lang];
  const qs = lang === "en" ? "?lang=en" : "";

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Practice Areas</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">{c.heading}</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-text-muted">{c.intro}</p>
          </Reveal>
        </div>
      </section>

      {/* 4개 분야 카드 */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            {AREAS.map((a, i) => (
              <Reveal key={a.href} delay={((i % 2) + 1) as 1 | 2}>
                <Link
                  href={`${a.href}${qs}`}
                  className="ethos-card ethos-card-hover ethos-card-topline group relative flex h-full flex-col overflow-hidden p-9"
                >
                  <span className="ethos-index pointer-events-none absolute -right-2 -top-4 select-none">{a.no}</span>
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold-soft/30 text-primary transition-colors duration-300 group-hover:bg-gold-soft/60">
                    {a.icon}
                  </div>
                  <p className="relative mt-6 font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                    {a.subtitle}
                  </p>
                  <h3 className="ethos-display relative mt-1 text-2xl">{lang === "en" ? a.titleEn : a.title}</h3>
                  <p className="relative mt-5 text-sm leading-7 text-text">
                    {lang === "en" ? a.descriptionEn : a.description}
                  </p>
                  <span className="relative mt-auto inline-flex items-center gap-1 pt-8 font-serif text-sm font-semibold text-primary transition-colors group-hover:text-gold-deep">
                    {c.more}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
