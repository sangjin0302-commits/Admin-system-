import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal } from "@/components/public/reveal";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";
import { SERVICE_EN } from "@/lib/services/service-content-en";

const LABELS = {
  ko: {
    whoFor: "이런 분께 권합니다",
    process: "진행 절차",
    documents: "필요 자료",
    deadlines: "주요 기한",
    faq: "자주 묻는 질문",
    docsNote: "※ 사안별로 추가/축소될 수 있습니다.",
    deadlineNote: "※ 개별 사안에 따라 다를 수 있습니다.",
    ctaTitle: "상담을 시작하시겠습니까?",
    ctaPrimary: "상담 신청",
    ctaSecondary: "다른 분야 보기"
  },
  en: {
    whoFor: "Who it's for",
    process: "Process",
    documents: "Documents",
    deadlines: "Key deadlines",
    faq: "Frequently asked",
    docsNote: "※ May expand or narrow per case.",
    deadlineNote: "※ May differ by individual case.",
    ctaTitle: "Ready to begin?",
    ctaPrimary: "Request consultation",
    ctaSecondary: "Other practice areas"
  }
} as const;

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

export function ServicePage({
  data,
  descriptionOverride,
  lang = "ko",
  serviceKey
}: {
  data: ServicePageData;
  descriptionOverride?: string;
  lang?: "ko" | "en";
  serviceKey?: string;
}) {
  const intakeHref = buildWebsiteIntakeHref();
  const L = LABELS[lang];
  const en = lang === "en" && serviceKey ? SERVICE_EN[serviceKey] : undefined;

  // lang=en이면 영문 데이터로 치환 (없으면 한글 fallback)
  const tagline = en?.tagline ?? data.tagline;
  const whoFor = en?.whoFor ?? data.whoFor;
  const process = en?.process ?? data.process;
  const documents = en?.documents ?? data.documents;
  const deadlines = en?.deadlines ?? data.deadlines;
  const faq = en?.faq ?? data.faq;
  const description = descriptionOverride?.trim()
    ? descriptionOverride
    : en?.description ?? data.description;
  const qs = lang === "en" ? "?lang=en" : "";

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
            <p className="ethos-quote mt-4 text-base text-gold-deep">{tagline}</p>
          </Reveal>
          <Reveal delay={3}>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-text">{description}</p>
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
                <h2 className="ethos-display mt-3 text-3xl text-white sm:text-4xl">{L.whoFor}</h2>
              </div>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {whoFor.map((item, i) => (
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
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">{L.process}</h2>
          </Reveal>
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 md:block" aria-hidden />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {process.map((p, idx) => (
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
                <h3 className="ethos-display mt-3 text-2xl sm:text-3xl">{L.documents}</h3>
                <ul className="mt-7 space-y-3">
                  {documents.map((d) => (
                    <li key={d} className="flex items-start gap-3 border-l-2 border-gold/30 pl-4 text-sm leading-7 text-text">
                      <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                      {d}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[11px] text-text-muted">{L.docsNote}</p>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div className="ethos-card p-9">
                <p className="ethos-eyebrow">Deadlines</p>
                <h3 className="ethos-display mt-3 text-2xl sm:text-3xl">{L.deadlines}</h3>
                <div className="mt-7 space-y-5">
                  {deadlines.map((d) => (
                    <div key={d.label} className="border-l-2 border-gold pl-5">
                      <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">{d.label}</p>
                      <p className="mt-1.5 font-serif text-lg font-bold text-primary">{d.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[11px] text-text-muted">{L.deadlineNote}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 무료 검토 체크리스트 */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-7 sm:p-9">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">무료</span>
                <p className="font-serif text-base font-bold text-emerald-900">검토 가능 여부 체크</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-emerald-900/85">
                아래 항목 중 1개 이상 해당하시면 무료 검토 요청 후 가능 여부와 견적 범위를 회신드립니다.
                검토는 어느 채널(톡톡·카카오·이메일·텔레그램)로 요청하셔도 동일하게 무료입니다.
              </p>
              <ul className="mt-5 space-y-2.5">
                {data.whoFor.slice(0, 4).map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-text">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-lg bg-white/60 px-4 py-3 text-xs leading-6 text-emerald-900/80">
                <strong>본격 상담</strong>은 33,000~55,000원 유료이며, 수임 확정 시 상담료 전액 차감됩니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={intakeHref}
                  className="inline-flex h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800"
                >
                  무료 검토 요청하기 →
                </Link>
                <Link
                  href="/consult"
                  className="inline-flex h-10 items-center rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  상담 구조 자세히
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ — soft band */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">FAQ</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">{L.faq}</h2>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            {faq.map((f, i) => (
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
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">{L.ctaTitle}</h2>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={intakeHref}
                  className="inline-flex h-12 items-center rounded-lg bg-gold px-8 text-sm font-bold text-primary shadow-md transition-all duration-300 hover:bg-gold-soft hover:shadow-lg"
                >
                  {L.ctaPrimary}
                </Link>
                <Link
                  href={`/services${qs}`}
                  className="inline-flex h-12 items-center rounded-lg border border-gold/50 px-8 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
                >
                  {L.ctaSecondary}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
