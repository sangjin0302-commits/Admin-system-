import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal } from "@/components/public/reveal";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";

export type ServicePageData = {
  kicker: string;
  title: string;
  tagline: string;
  description: string;
  icon: ReactNode;
  whoFor: readonly string[];
  process: readonly { step: string; title: string; desc: string }[];
  documents: readonly string[];
  deadlines: readonly { label: string; value: string }[];
  faq: readonly { q: string; a: string }[];
};

export function ServicePage({ data }: { data: ServicePageData }) {
  const intakeHref = buildWebsiteIntakeHref();

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />

        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">{data.kicker}</p>
          </Reveal>
          <Reveal delay={1}>
            <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-gold/40 bg-gold-soft/30 text-primary shadow-sm">
              {data.icon}
            </div>
          </Reveal>
          <Reveal delay={2}>
            <h1 className="ethos-display mt-8 text-4xl sm:text-[3.4rem]">{data.title}</h1>
          </Reveal>
          <Reveal delay={3}>
            <p className="ethos-quote mt-4 text-base text-gold-deep">{data.tagline}</p>
          </Reveal>
          <Reveal delay={3}>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-text">{data.description}</p>
          </Reveal>
        </div>
      </section>

      {/* For Whom — DARK band */}
      <section className="ethos-band ethos-band-dark py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="ethos-eyebrow text-gold-soft">For Whom</p>
                <h2 className="ethos-display mt-3 text-3xl text-white sm:text-4xl">이런 분께 권합니다</h2>
              </div>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {data.whoFor.map((item, i) => (
              <Reveal key={item} delay={((i % 2) + 1) as 1 | 2}>
                <div className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors duration-300 hover:border-gold/40 hover:bg-white/[0.08]">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rotate-45 bg-gold transition-transform duration-300 group-hover:scale-125" />
                  <span className="text-sm leading-7 text-white/85">{item}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process — soft band, 타임라인 */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Process</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">진행 절차</h2>
          </Reveal>
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 md:block" aria-hidden />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {data.process.map((p, idx) => (
                <Reveal key={idx} delay={((idx % 4) + 1) as 1 | 2 | 3 | 4}>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-surface font-serif text-sm font-bold text-primary shadow-sm">
                      {p.step}
                    </div>
                    <h3 className="ethos-display mt-5 text-lg">{p.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-text-muted">{p.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Documents + Deadlines — 비대칭 */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <Reveal>
              <div>
                <p className="ethos-eyebrow">Documents</p>
                <h3 className="ethos-display mt-3 text-2xl sm:text-3xl">필요 자료</h3>
                <ul className="mt-7 space-y-3">
                  {data.documents.map((d) => (
                    <li key={d} className="flex items-start gap-3 border-l-2 border-gold/30 pl-4 text-sm leading-7 text-text">
                      <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                      {d}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[11px] text-text-muted">※ 사안별로 추가/축소될 수 있습니다.</p>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div className="ethos-card p-9">
                <p className="ethos-eyebrow">Deadlines</p>
                <h3 className="ethos-display mt-3 text-2xl sm:text-3xl">주요 기한</h3>
                <div className="mt-7 space-y-5">
                  {data.deadlines.map((d) => (
                    <div key={d.label} className="border-l-2 border-gold pl-5">
                      <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">{d.label}</p>
                      <p className="mt-1.5 font-serif text-lg font-bold text-primary">{d.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[11px] text-text-muted">※ 개별 사안에 따라 다를 수 있습니다.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ — soft band */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">FAQ</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">자주 묻는 질문</h2>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            {data.faq.map((f, i) => (
              <Reveal key={f.q} delay={((i % 2) + 1) as 1 | 2}>
                <div className="ethos-card ethos-card-hover h-full p-6">
                  <h3 className="font-serif text-base font-bold text-primary">Q. {f.q}</h3>
                  <p className="mt-3 text-sm leading-7 text-text-muted">{f.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="ethos-quote mx-auto mt-10 max-w-2xl text-center text-xs italic text-text-muted">
            {PUBLIC_MARKETING_SAFE_NOTICE}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-primary via-primary to-text-strong p-12 text-center shadow-floating sm:p-16">
              <p className="ethos-eyebrow text-gold-soft">Start Here</p>
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">상담을 시작하시겠습니까?</h2>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={intakeHref}
                  className="inline-flex h-12 items-center rounded-lg bg-gold px-8 text-sm font-bold text-primary shadow-md transition-all duration-300 hover:bg-gold-soft hover:shadow-lg"
                >
                  상담 신청
                </Link>
                <Link
                  href="/services"
                  className="inline-flex h-12 items-center rounded-lg border border-gold/50 px-8 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
                >
                  다른 분야 보기
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
