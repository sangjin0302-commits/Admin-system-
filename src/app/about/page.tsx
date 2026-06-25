import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { EthosLogo } from "@/components/brand/ethos-logo";
import { Reveal } from "@/components/public/reveal";
import { prisma } from "@/lib/prisma/client";
import { getSiteSetting } from "@/lib/services/site-settings";
import { listPublicCredentials, CREDENTIAL_TYPE_LABELS } from "@/lib/services/credentials";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "사무소 소개 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소의 철학, 대표 행정사 소개, 운영 원칙을 안내합니다."
};

const VALUES = [
  {
    greek: "Logos",
    title: "이성으로 절차를",
    description: "감정만이 아닌 정확한 법령과 논리적 판단으로 행정 문제를 풀어갑니다."
  },
  {
    greek: "Pathos",
    title: "공감으로 사람을",
    description: "행정 문제 뒤에 있는 사람의 사정과 마음을 함께 헤아립니다."
  },
  {
    greek: "Ethos",
    title: "신뢰로 일을",
    description: "막막한 절차 속에서도 의뢰인이 믿고 따라갈 수 있는 기준과 길을 제시합니다."
  }
] as const;

export default async function AboutPage() {
  const greeting = await getSiteSetting("about.greeting");
  const credentials = await listPublicCredentials();
  const photoRow = await prisma.siteSetting.findUnique({ where: { key: "image.aboutPhoto" } }).catch(() => null);
  const aboutPhoto = photoRow?.value || null;
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">About ETHOS</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">사무소 소개</h1>
          </Reveal>
          <Reveal delay={2}>
            <div className="mt-10 flex justify-center">
              <EthosLogo size={140} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 인사말 — DARK band */}
      <section className="ethos-band ethos-band-dark ethos-grain py-24 sm:py-32" style={{ backgroundColor: "rgb(22 50 80)" }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow text-gold-soft">Greeting</p>
            <h2 className="ethos-display mt-5 text-3xl leading-snug text-white sm:text-[2.6rem]">
              행정 문제 뒤에 있는
              <br />
              사람의 마음까지
              <br />
              <span className="text-gold-soft">살피겠습니다.</span>
            </h2>
          </Reveal>
          <div className="mt-10 space-y-6 text-base leading-8 text-white/80">
            <Reveal delay={1}>
              <p className="ethos-dropcap">{greeting}</p>
            </Reveal>
            <Reveal delay={2}>
              <p>
                AI가 많은 정보를 빠르게 정리하고, 이성적인 판단의 영역인{" "}
                <span className="ethos-quote text-gold-soft">로고스(Logos)</span>를 보조하는 시대가 되었습니다.
                그러나 행정 문제 앞에 선 사람에게 필요한 것은 정보만이 아닙니다. 자신의 사정을 이해받고
                있다는 안도감, 막막한 절차 속에서도 함께 걸어주는 사람이 있다는 신뢰가 필요합니다.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <p>
                <span className="font-serif font-bold text-white">에토스 행정사사무소</span>는 아리스토텔레스가
                말한 설득의 세 요소,{" "}
                <span className="ethos-quote text-gold-soft">로고스 · 파토스 · 에토스</span>를 바탕으로 의뢰인의
                상황을 세심하게 듣고 가장 현실적인 방향을 함께 찾아갑니다.
              </p>
            </Reveal>
            <Reveal delay={4}>
              <p className="ethos-quote border-l-2 border-gold/60 pl-5 text-lg text-gold-soft">
                절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 가치 */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Our Values</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">세 가지 가치</h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.greek} delay={(i + 1) as 1 | 2 | 3}>
                <div className="ethos-card ethos-card-hover relative h-full overflow-hidden p-9">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <p className="ethos-quote text-3xl text-gold-deep">{v.greek}</p>
                  <h3 className="ethos-display mt-3 text-2xl">{v.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-text-muted">{v.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 대표 행정사 — soft band, 비대칭 */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <div className="relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-4 border-gold/40 bg-gradient-to-br from-primary/10 via-surface to-gold/10 shadow-floating">
                  {aboutPhoto ? (
                    <Image src={aboutPhoto} alt="대표 행정사" fill className="object-cover" unoptimized sizes="(max-width: 768px) 100vw, 40vw" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                      <svg viewBox="0 0 80 100" width="120" className="text-primary/20" fill="currentColor" aria-hidden>
                        <circle cx="40" cy="28" r="18" />
                        <path d="M10 95 Q10 60 40 55 Q70 60 70 95 Z" />
                      </svg>
                      <p className="font-serif text-xs tracking-wider text-text-muted">대표 행정사</p>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-5 -right-5 rounded-xl bg-primary px-6 py-4 text-white shadow-floating">
                  <p className="ethos-quote text-xs tracking-wider text-gold-soft">Lead</p>
                  <p className="mt-1 font-serif text-lg font-bold">대표 행정사</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div>
                <p className="ethos-eyebrow">Lead Attorney</p>
                <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">행정사 Jean</h2>

                {/* 다국어 배지 */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    🇰🇷 한국어
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    🇬🇧 English
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    🇸🇦 العربية
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-sm leading-7 text-text">
                  <p>
                    비자·출입국, 행정심판, 계약서·사실조사, 인허가, 법인설립 업무를 담당합니다.
                    주한 대사관 비자·출입국 실무를 2.5년 이상 경험하였고, 법무부 난민 판결문 공식 번역인 ·
                    법원행정처 법정 통번역인으로 등록되어 있습니다.
                  </p>
                  <p>
                    한국어·영어·아랍어로 상담이 가능하며, 외국인 의뢰인의 사정에 맞춘
                    <span className="font-bold text-primary"> 다국어 서류 검토와 절차 안내</span>를 함께 진행합니다.
                  </p>
                </div>

                {/* 권위 신호 카드 */}
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    { kicker: "Embassy", title: "주한 대사관 비자 실무", desc: "비자·출입국 실무 2.5년+" },
                    { kicker: "MOJ", title: "법무부 난민 판결문 번역인", desc: "공식 번역인 등록" },
                    { kicker: "Court", title: "법정 통번역인", desc: "법원행정처 등록" },
                    { kicker: "Academic", title: "한국외대 통번역대학원", desc: "한아과 · GPA 4.41" },
                    { kicker: "Lecture", title: "OASIS 4 강의", desc: "외국인 창업지원 프로그램" },
                    { kicker: "AI System", title: "법률 자동화 시스템", desc: "심판청구서·법령 자동수집 운영" }
                  ].map((c) => (
                    <div key={c.title} className="rounded-xl border border-gold/30 bg-surface px-4 py-3 transition hover:border-gold/60 hover:bg-gold-soft/15">
                      <p className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold-deep">{c.kicker}</p>
                      <p className="mt-1 text-sm font-bold text-text-strong">{c.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{c.desc}</p>
                    </div>
                  ))}
                </div>

                {/* 동적 자격증 (DB) - 있을 때만 노출 */}
                {credentials.length > 0 && (
                  <div className="mt-7 space-y-3 border-l-2 border-gold/50 pl-6">
                    <p className="font-serif text-xs font-bold uppercase tracking-wider text-gold-deep">기타 자격</p>
                    {credentials.map((c, i) => (
                      <div key={i} className="flex items-baseline gap-4">
                        <span className="ethos-quote w-16 flex-shrink-0 text-xl text-gold-deep">{c.year}</span>
                        <span className="rounded bg-gold-soft/60 px-2 py-0.5 text-[11px] font-bold text-gold-deep">
                          {CREDENTIAL_TYPE_LABELS[c.type] ?? c.type}
                        </span>
                        <span className="text-sm text-text">
                          {c.title}
                          {c.detail ? <span className="text-text-muted"> · {c.detail}</span> : null}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-primary via-primary to-text-strong p-12 text-center shadow-floating sm:p-16">
              <p className="ethos-eyebrow text-gold-soft">Start with ETHOS</p>
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">
                오늘 상황을 말씀해 주세요
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/80">
                비자·행정심판·인허가 어느 분야든 먼저 사실관계를 들어보겠습니다.
                <br className="hidden sm:block" />
                1차 상담은 무료이며 영업일 기준 24시간 이내 회신드립니다.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/intake"
                  className="inline-flex h-12 items-center rounded-lg bg-gold px-8 text-sm font-bold text-primary transition hover:bg-gold-soft"
                >
                  무료 검토 요청하기 →
                </Link>
                <Link
                  href="/quick-check"
                  className="inline-flex h-12 items-center rounded-lg border border-gold/50 px-8 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
                >
                  AI 사전 진단 (30초)
                </Link>
              </div>
              <p className="mt-6 text-xs text-white/70">검토 무료 · 24h 이내 회신 · 수임 시 상담료 차감</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
