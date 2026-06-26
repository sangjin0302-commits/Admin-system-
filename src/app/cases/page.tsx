import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { CHANNELS } from "@/lib/constants/channels";
import { EventJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const en = (await searchParams).lang === "en";
  return en
    ? {
        title: "Lectures & Talks — ETHOS Administrative Attorney Office",
        description:
          "OASIS 4 foreign founder startup support lecture series by Jean — visa, business registration, compliance for foreign entrepreneurs in Korea."
      }
    : {
        title: "강연 · 활동 — ETHOS 행정사사무소",
        description: "OASIS 4 외국인 창업지원 프로그램 강의 등 행정사 Jean의 교육·강연 활동을 소개합니다."
      };
}

const COPY = {
  ko: {
    heading: "강연 · 활동",
    intro:
      "행정사 Jean은 외국인 창업가·예비 의뢰인을 대상으로 비자·창업 절차에 대한 실무 교육을 진행해 왔습니다. 강연 자료와 후기를 일부 정리했습니다.",
    ctaTitle: "강연 / 사내 세미나 의뢰가 필요하신가요?",
    cta: "강연 문의하기"
  },
  en: {
    heading: "Lectures & Talks",
    intro:
      "Jean has delivered practical lectures on visa and startup procedures for foreign entrepreneurs and prospective clients. A selection of materials and feedback follows.",
    ctaTitle: "Need a lecture or in-house seminar?",
    cta: "Request a talk"
  }
} as const;

const LECTURE = {
  badge: "OASIS 4",
  program: "외국인 창업지원 프로그램 (창업진흥원)",
  programEn: "Foreign Founder Startup Support Program (KISED)",
  title: "외국인 창업비자 · 사업자 등록 · 행정 절차",
  titleEn: "Foreign Founder Visa · Business Registration · Administrative Procedure",
  scope: [
    "D-8 / D-10 / F-2-7 비자 분기 결정 흐름",
    "법인 vs 개인사업자 — 외국인 관점에서의 선택 기준",
    "사업자 등록 · 통신판매업 · 인허가 연계",
    "체류기간 연장 시 자주 발생하는 보완 요청 사례"
  ],
  scopeEn: [
    "Decision flow for D-8 / D-10 / F-2-7 visa categories",
    "Corporation vs sole proprietorship — choosing from a foreign founder's view",
    "Business registration · e-commerce registration · permit linkage",
    "Common supplementary-document requests at status extension"
  ]
} as const;

const FEEDBACK_KO = [
  {
    quote:
      "비자 카테고리만 설명한 다른 자료와 달리 'D-8을 왜 못 받는지'부터 설명해줘서, 현재 우리 상황에 맞는 다음 단계를 잡을 수 있었습니다.",
    role: "OASIS 4 참가 예비 창업가 · D-10 → D-8 준비"
  },
  {
    quote:
      "법인을 세워야 하는지, 개인사업자로 시작해야 하는지 판단이 어려웠는데, 외국인 입장에서의 세무·행정 차이를 한 번에 정리해줘서 결정이 빨라졌습니다.",
    role: "외국인 1인 창업 준비자"
  },
  {
    quote:
      "한국어가 어려운 동료들에게 영어/아랍어로도 같은 내용을 다시 안내해주셔서 팀 전체가 같은 기준으로 출발할 수 있었습니다.",
    role: "MENA 지역 출신 공동창업 팀"
  }
] as const;

const FEEDBACK_EN = [
  {
    quote:
      "Unlike materials that only list visa categories, Jean started by explaining *why* D-8 is denied first — so we could plan a realistic next step for our situation.",
    role: "OASIS 4 prospective founder · transitioning D-10 → D-8"
  },
  {
    quote:
      "It was hard to decide between forming a corporation and starting as a sole proprietor. The session laid out the tax and administrative differences from a foreigner's perspective, and the decision became clear.",
    role: "Foreign solo founder"
  },
  {
    quote:
      "Jean re-explained the same content in English and Arabic for teammates who struggle with Korean, so the whole team started from the same baseline.",
    role: "MENA-origin co-founder team"
  }
] as const;

const ACTIVITIES = [
  {
    yearLabel: "Lecture",
    title: "OASIS 4 — 외국인 창업지원 프로그램 강의",
    titleEn: "OASIS 4 — Foreign Founder Startup Support Program lecture",
    desc: "비자·법인설립·인허가 등 외국인 창업가가 마주치는 행정 절차를 단계별로 정리한 세션.",
    descEn: "Step-by-step session on visa, incorporation, and licensing — the administrative path for foreign founders.",
    chip: "정기 강의"
  },
  {
    yearLabel: "Translator",
    title: "법무부 난민 판결문 공식 번역인",
    titleEn: "Ministry of Justice — official translator (refugee rulings)",
    desc: "난민 판결문 한↔영/아랍어 공식 번역 업무 수행.",
    descEn: "Official Korean ↔ English/Arabic translation of refugee rulings.",
    chip: "공식 등록"
  },
  {
    yearLabel: "Court",
    title: "법원행정처 법정 통번역인",
    titleEn: "Court Administration Office — registered court interpreter",
    desc: "법정 통번역인 등록 (한국어·영어·아랍어).",
    descEn: "Registered court interpreter (Korean · English · Arabic).",
    chip: "공식 등록"
  }
] as const;

export default async function LecturesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  const t = COPY[lang];
  const feedback = lang === "en" ? FEEDBACK_EN : FEEDBACK_KO;

  return (
    <div className="overflow-x-clip">
      <EventJsonLd
        name="OASIS 4 — 외국인 창업지원 프로그램 강의"
        description="외국인 창업가를 위한 비자·법인설립·인허가 절차 실무 가이드. 행정사 Jean 진행."
      />
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Lectures · Activities</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">{t.heading}</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-text-muted">{t.intro}</p>
          </Reveal>
        </div>
      </section>

      {/* 대표 강연 — DARK band */}
      <section className="ethos-band ethos-band-dark ethos-grain py-24 sm:py-28" style={{ backgroundColor: "rgb(22 50 80)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <Reveal>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold text-gold-soft">
                  Featured · {LECTURE.badge}
                </span>
                <p className="mt-5 font-serif text-[11px] font-bold tracking-[0.2em] text-gold-soft">
                  {lang === "en" ? LECTURE.programEn : LECTURE.program}
                </p>
                <h2 className="ethos-display mt-3 text-3xl leading-snug text-white sm:text-[2.6rem]">
                  {lang === "en" ? LECTURE.titleEn : LECTURE.title}
                </h2>
                <p className="mt-6 text-sm leading-8 text-white/75">
                  {lang === "en"
                    ? "Delivered to foreign founders entering Korea. Focuses on what actually goes wrong at the procedural level — not just visa-category lists."
                    : "한국에서 사업을 시작하려는 외국인 창업가를 위한 세션입니다. 비자 카테고리 나열이 아닌, 실제 절차에서 무엇이 막히는지에 초점을 둡니다."}
                </p>
                <ul className="mt-7 space-y-2.5">
                  {(lang === "en" ? LECTURE.scopeEn : LECTURE.scope).map((s) => (
                    <li key={s} className="flex items-start gap-3 text-sm text-white/85">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* 후기 카드 stack */}
            <div className="space-y-4">
              <Reveal>
                <p className="ethos-eyebrow text-gold-soft">Feedback</p>
              </Reveal>
              {feedback.map((f, i) => (
                <Reveal key={i} delay={((i % 3) + 1) as 1 | 2 | 3}>
                  <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <p className="ethos-quote text-2xl leading-none text-gold/50">&ldquo;</p>
                    <p className="mt-2 text-sm leading-7 text-white/90">{f.quote}</p>
                    <footer className="mt-4 text-xs font-bold text-gold-soft">— {f.role}</footer>
                  </blockquote>
                </Reveal>
              ))}
              <p className="text-[11px] leading-5 text-white/55">
                {lang === "en"
                  ? "* Quotes are paraphrased and anonymized with participants' consent."
                  : "※ 참가자 동의 하에 핵심 발언을 익명화하여 정리한 후기입니다."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 활동 그리드 */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Activities</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
              {lang === "en" ? "Other Activities" : "그 외 활동"}
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {ACTIVITIES.map((a, i) => (
              <Reveal key={a.title} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <div className="ethos-card ethos-card-hover ethos-card-topline relative flex h-full flex-col p-7">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                      {a.yearLabel}
                    </span>
                    <span className="rounded-full bg-gold-soft/50 px-2.5 py-0.5 text-[11px] font-bold text-gold-deep">
                      {a.chip}
                    </span>
                  </div>
                  <h3 className="ethos-display mt-4 text-lg leading-snug">
                    {lang === "en" ? a.titleEn : a.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-text-muted">
                    {lang === "en" ? a.descEn : a.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 ethos-dark-card p-12 text-center shadow-floating sm:p-16">
              <p className="ethos-eyebrow text-gold-soft">Booking</p>
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">{t.ctaTitle}</h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/80">
                {lang === "en"
                  ? "Public lectures, in-house seminars, and private team briefings — available in Korean, English, and Arabic."
                  : "공개 강연, 사내 세미나, 팀 브리핑 모두 가능합니다. 한국어 · 영어 · 아랍어로 진행할 수 있습니다."}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={CHANNELS.email.url}
                  className="inline-flex h-12 items-center rounded-lg bg-gold px-8 text-sm font-bold text-primary transition hover:bg-gold-soft"
                >
                  {t.cta} →
                </a>
                <Link
                  href="/links"
                  className="inline-flex h-12 items-center rounded-lg border border-gold/60 px-8 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
                >
                  {lang === "en" ? "All channels" : "모든 채널 보기"}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
