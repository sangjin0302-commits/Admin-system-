import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { CHANNELS } from "@/lib/constants/channels";

// 정적 EN 홈(searchParams 미사용) → ISR. 방문마다 함수호출 대신 CDN 캐시.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "ETHOS Administrative Attorney Office — Jean | English support",
  description:
    "Korean administrative procedures for foreign nationals. Visa, business registration, contracts, administrative appeals — explained in English and Korean by Jean.",
  alternates: { canonical: "/en", languages: { ko: "/", en: "/en", "x-default": "/" } },
  openGraph: {
    title: "ETHOS · Jean — English-friendly administrative attorney in Seoul",
    description:
      "Free initial review · Paid consultation deducted upon engagement · Korean & English"
  }
};

const PRACTICE = [
  {
    no: "01",
    title: "Visa / Immigration",
    desc: "Status changes & extensions (D-8, D-10, F-2-7, etc.), business/investment visas, removal & departure-order defense."
  },
  {
    no: "02",
    title: "Administrative Appeal",
    desc: "From the disposition notice through the claim, hearing, and ruling — 90-day filing window strictly tracked."
  },
  {
    no: "03",
    title: "Contracts / Fact-Finding",
    desc: "Contract review and drafting (bilingual), dispute fact-finding, investigation reports for foreign clients."
  },
  {
    no: "04",
    title: "Licenses / Permits",
    desc: "Business, construction, food, medical permits — supplements and appeals when the agency pushes back."
  },
  {
    no: "05",
    title: "Company Formation",
    desc: "Corporation vs sole proprietorship from a foreign founder's view. Articles, registration, and downstream permits."
  }
] as const;

const STRUCTURE = [
  { tag: "FREE", title: "Review", desc: "Feasibility check, fee range, 1–2 key answers", color: "bg-emerald-100 text-emerald-800" },
  { tag: "PAID", title: "Consultation", desc: "Strategy, document design, risk analysis · ₩33,000–₩55,000", color: "bg-gold-soft text-gold-deep" },
  { tag: "ENGAGEMENT", title: "Retainer", desc: "Consultation fee fully credited against the retainer", color: "bg-primary text-white" }
] as const;

const AUTHORITY = [
  { kicker: "Embassy", title: "2.5+ years of visa & immigration practice", sub: "in a Seoul embassy consular section" },
  { kicker: "Ministry of Justice", title: "Official translator — refugee rulings", sub: "Korean ↔ English / Arabic" },
  { kicker: "Court Administration", title: "Registered court interpreter", sub: "ko · en · ar" },
  { kicker: "Academic", title: "HUFS Graduate School of Interpretation & Translation", sub: "Korean–Arabic" },
  { kicker: "Lecture", title: "OASIS 4 — Foreign Founder Program", sub: "Recurring lectures (KISED)" },
  { kicker: "AI", title: "Legal automation system", sub: "Self-built; in-house operation" }
] as const;

export default function EnglishLanding() {
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-soft/20 px-4 py-1.5 text-xs font-bold text-gold-deep">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Administrative attorney · Seoul, Korea
                </span>
              </Reveal>
              <Reveal delay={1}>
                <h1 className="ethos-display mt-7 text-[2.6rem] leading-[1.1] sm:text-5xl">
                  Korean administrative procedures,<br />
                  <span className="ethos-underline-gold">explained in your language.</span>
                </h1>
              </Reveal>
              <Reveal delay={2}>
                <p className="mt-7 max-w-xl text-base leading-8 text-text">
                  Visa, business registration, contracts, administrative appeals — handled by an attorney who has actually
                  worked the visa desk inside an embassy in Seoul. Available in Korean and English.
                </p>
              </Reveal>
              <Reveal delay={3}>
                <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
                  <a href={CHANNELS.naverTalk.url} target="_blank" rel="noreferrer"
                     className="inline-flex h-12 items-center rounded-lg bg-[#03C75A] px-7 text-sm font-bold text-white shadow-sm transition hover:brightness-95">
                    Naver Talk (fastest)
                  </a>
                  <a href={CHANNELS.email.url}
                     className="inline-flex h-12 items-center rounded-lg bg-primary px-7 text-sm font-bold text-white shadow-sm transition hover:bg-text-strong">
                    Email Jean
                  </a>
                  <a href={CHANNELS.telegram.url} target="_blank" rel="noreferrer"
                     className="inline-flex h-12 items-center rounded-lg border border-gold/40 px-7 text-sm font-semibold text-primary transition hover:bg-gold-soft/30">
                    Telegram {CHANNELS.telegram.value}
                  </a>
                </div>
              </Reveal>
              <Reveal delay={4}>
                <p className="mt-5 text-xs text-text-muted">
                  Free initial review · Paid consultation ₩33,000–₩55,000 · Fee credited upon engagement
                </p>
              </Reveal>
            </div>

            {/* 우: 브랜드 카드 */}
            <Reveal delay={2} className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm">
                <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gold/10 blur-3xl" aria-hidden />
                <div className="ethos-grain relative flex flex-col items-center rounded-[24px] border border-gold/30 ethos-dark-card-v px-8 py-12 text-center shadow-floating">
                  <p className="font-serif text-[10px] font-bold uppercase tracking-[0.3em] text-gold-soft">ETHOS</p>
                  <h2 className="ethos-display mt-5 text-3xl tracking-[0.28em] text-white">JEAN</h2>
                  <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <p className="ethos-quote text-sm leading-8 text-gold-soft">
                    Reason in process,<br />
                    empathy for people,<br />
                    trust in every step.
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-1.5">
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/90">🇰🇷 한국어</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/90">🇬🇧 English</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CONSULT STRUCTURE */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">How consultation works</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.4rem]">Free review. Paid consultation. Credited on retainer.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {STRUCTURE.map((s, i) => (
              <Reveal key={s.title} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <div className="ethos-card ethos-card-hover p-7">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${s.color}`}>{s.tag}</span>
                  <h3 className="ethos-display mt-4 text-xl">{s.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-text-muted">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRACTICE */}
      <section className="ethos-band ethos-band-soft py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Practice areas</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.4rem]">Five core areas</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {PRACTICE.map((p, i) => (
              <Reveal key={p.no} delay={((i % 2) + 1) as 1 | 2}>
                <div className="ethos-card ethos-card-hover ethos-card-topline relative p-7">
                  <span className="ethos-index absolute -right-2 -top-4 select-none">{p.no}</span>
                  <h3 className="ethos-display text-xl">{p.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-text-muted">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AUTHORITY */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Why Jean</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.4rem]">Authority you can verify</h2>
          </Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AUTHORITY.map((a) => (
              <div key={a.title} className="rounded-2xl border border-gold/30 bg-surface p-5 transition hover:border-gold/60 hover:bg-gold-soft/15">
                <p className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold-deep">{a.kicker}</p>
                <p className="mt-1.5 font-serif text-sm font-bold text-text-strong">{a.title}</p>
                <p className="mt-1 text-xs text-text-muted">{a.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-grain relative overflow-hidden rounded-[24px] border border-gold/30 ethos-dark-card p-10 text-center shadow-floating sm:p-14">
              <p className="ethos-eyebrow text-gold-soft">Get started</p>
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">Send your situation in one line.</h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/80">
                Any channel works — Naver Talk, Kakao, Telegram, or email. You'll get a free initial review within 24 business hours.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/intake?lang=en" className="inline-flex h-12 items-center rounded-lg bg-gold px-7 text-sm font-bold text-primary transition hover:bg-gold-soft">
                  Request consultation →
                </Link>
                <Link href="/quick-check" className="inline-flex h-12 items-center rounded-lg border border-gold/60 px-7 text-sm font-semibold text-gold-soft transition hover:bg-gold/10">
                  Free case check
                </Link>
                <Link href="/links" className="inline-flex h-12 items-center rounded-lg border border-gold/60 px-7 text-sm font-semibold text-gold-soft transition hover:bg-gold/10">
                  All channels
                </Link>
              </div>
              <p className="mt-7 text-[11px] text-white/55">
                Read our columns in English · <Link href="/blog?lang=en" className="underline">English blog →</Link>
              </p>
              <p className="mt-2 text-[11px] text-white/55">
                한국어로 보기 · <Link href="/" className="underline">/ ← Korean homepage</Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
