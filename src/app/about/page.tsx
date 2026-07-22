import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { EthosLogo } from "@/components/brand/ethos-logo";
import { Reveal } from "@/components/public/reveal";
import { PersonJsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/prisma/client";
import { getSiteSetting } from "@/lib/services/site-settings";
import { listPublicCredentials, CREDENTIAL_TYPE_LABELS } from "@/lib/services/credentials";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "사무소 소개 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소의 철학, 대표 행정사 소개, 운영 원칙을 안내합니다."
};

const VALUES_KO = [
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

const VALUES_EN = [
  {
    greek: "Logos",
    title: "Reason in Process",
    description: "We work through administrative matters with accurate statutes and logical judgment, not just intuition."
  },
  {
    greek: "Pathos",
    title: "Empathy for People",
    description: "We take time to understand the circumstances and concerns behind each administrative matter."
  },
  {
    greek: "Ethos",
    title: "Trust in Every Step",
    description: "We offer clear standards and direction our clients can follow, even through unfamiliar procedures."
  }
] as const;

const COPY = {
  ko: {
    metaTitle: "사무소 소개 — ETHOS 행정사사무소",
    metaDescription: "에토스 행정사사무소의 철학, 대표 행정사 소개, 운영 원칙을 안내합니다.",
    eyebrowAbout: "About ETHOS",
    heroTitle: "사무소 소개",
    greetingEyebrow: "Greeting",
    greetingTitleA: "행정 문제 뒤에 있는",
    greetingTitleB: "사람의 마음까지",
    greetingTitleC: "살피겠습니다.",
    greetingBody1:
      "AI가 많은 정보를 빠르게 정리하고, 이성적인 판단의 영역인 로고스(Logos)를 보조하는 시대가 되었습니다. 그러나 행정 문제 앞에 선 사람에게 필요한 것은 정보만이 아닙니다. 자신의 사정을 이해받고 있다는 안도감, 막막한 절차 속에서도 함께 걸어주는 사람이 있다는 신뢰가 필요합니다.",
    greetingBody2Prefix: "",
    greetingBody2Name: "에토스 행정사사무소",
    greetingBody2Suffix:
      "는 아리스토텔레스가 말한 설득의 세 요소, 로고스 · 파토스 · 에토스를 바탕으로 의뢰인의 상황을 세심하게 듣고 가장 현실적인 방향을 함께 찾아갑니다.",
    greetingQuote: "절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.",
    scopeEyebrow: "Statutory Scope",
    scopeTitle: "행정사 직무 범위",
    scopeSubtitle: "행정사법 제2조에 따라 정해진 업무 범위 내에서 의뢰인을 대리합니다. 변호사·법무사·세무사·노무사의 업무가 아닙니다.",
    scopeItems: [
      { kicker: "행정사법 §2-1", title: "행정기관 제출서류", desc: "관공서·공공기관에 제출하는 신청·신고·청구·진정·이의신청 서류 작성·제출 대행" },
      { kicker: "행정사법 §2-2", title: "권리·의무 사실증명", desc: "권리·의무 또는 사실관계에 관한 증명서류 작성" },
      { kicker: "행정사법 §2-3", title: "인허가 신청", desc: "인가·허가·면허·등록·신고 등 신청 대행과 보완 대응" },
      { kicker: "행정사법 §2-4", title: "행정심판 대리", desc: "행정심판 청구·재결·이의신청 대리" },
      { kicker: "행정사법 §2-5", title: "법령 해석·자문", desc: "행정 업무 관련 법령 해석 및 절차 안내" },
      { kicker: "행정사법 §2-6", title: "사실조사 · 확인", desc: "행정 절차에 필요한 사실관계 조사·확인·증명" }
    ],
    scopeNoticeTitle: "행정사 업무 범위 외 사안",
    scopeNoticeBody:
      "소송 대리 (변호사), 등기 신청 (법무사), 세무 신고 (세무사), 노동 분쟁 대리 (노무사) 등은 행정사 업무가 아닙니다. 검토 후 해당 사안일 경우 적합한 전문가를 안내드립니다.",
    valuesEyebrow: "Our Values",
    valuesTitle: "세 가지 가치",
    values: VALUES_KO,
    colorEyebrow: "Color System",
    colorTitle: "색에 담긴 태도",
    colorIntro:
      "에토스의 색은 장식이 아니라 인식의 설계입니다. 의뢰인이 사무소를 처음 마주하는 순간 전해야 할 두 가지 — 신뢰와 전문성 — 을 색으로 옮겼습니다.",
    colorSwatches: [
      { hex: "#1B2B6B", name: "네이비", role: "주 텍스트 · 바" },
      { hex: "#152056", name: "네이비 딥", role: "그라데이션 끝 · 깊이" },
      { hex: "#B8972A", name: "골드", role: "포인트 · 구분선" },
      { hex: "#F5F0E8", name: "크림", role: "기본 배경" },
      { hex: "#F8F3E8", name: "크림 딥", role: "분할 · 박스" },
      { hex: "#FFFFFF", name: "화이트", role: "카드 배경" }
    ],
    colorGrounding: [
      {
        k: "네이비 — 신뢰와 역량",
        v: "색채 인지 연구에서 파랑 계열은 여러 색 가운데 '역량(competence)'과 신뢰 인식이 가장 높게 나타납니다. 행정·법률 서비스가 가장 먼저 전해야 할 인상과 정확히 일치합니다.",
        cite: "Labrecque & Milne, Journal of the Academy of Marketing Science, 2012"
      },
      {
        k: "골드 — 절제된 전문성",
        v: "금색은 문화권을 가로질러 '프리미엄 · 품격 · 전문성'의 신호로 해석됩니다. 화려함이 아니라 격을 위해, 포인트와 구분선에만 절제해서 사용합니다.",
        cite: "Aslam, Journal of Marketing Communications, 2006"
      },
      {
        k: "크림 — 저널리즘의 진중함",
        v: "순백 대신 신문지 톤의 크림을 배경으로 써 장시간 읽어도 눈부심이 적고, 기록하고 검토하는 저널리즘 특유의 진중한 인상을 남깁니다.",
        cite: null
      }
    ],
    leadEyebrow: "Lead Attorney",
    leadTitle: "행정사 지상진",
    leadPhotoAlt: "대표 행정사",
    leadBadge: "대표 행정사",
    leadBadgeKicker: "Lead",
    leadBody1:
      "비자·출입국, 행정심판, 계약서·사실조사, 인허가, 법인설립 업무를 담당합니다. 주한 대사관 비자·출입국 실무를 3년간 경험하였고, 법무부 난민 판결문 공식 번역인 · 법원행정처 법정 통번역인으로 등록되어 있습니다.",
    leadBody2Prefix: "한국어·영어·아랍어로 상담이 가능하며, 외국인 의뢰인의 사정에 맞춘",
    leadBody2Highlight: " 다국어 서류 검토와 절차 안내",
    leadBody2Suffix: "를 함께 진행합니다.",
    credentialCards: [
      { kicker: "Embassy", title: "주한 대사관 비자 실무", desc: "비자·출입국 실무 3년" },
      { kicker: "MOJ", title: "법무부 난민 판결문 번역인", desc: "공식 번역인 등록" },
      { kicker: "Court", title: "법정 통번역인", desc: "법원행정처 등록" },
      { kicker: "Academic", title: "한국외대 통번역대학원", desc: "한국어–아랍어 전공" },
      { kicker: "Lecture", title: "OASIS 4 강의", desc: "외국인 창업지원 프로그램" },
      { kicker: "AI System", title: "법률 자동화 시스템", desc: "심판청구서·법령 자동수집 운영" }
    ],
    otherCredentialsLabel: "기타 자격",
    ctaEyebrow: "Start with ETHOS",
    ctaTitle: "오늘 상황을 말씀해 주세요",
    ctaBody1: "비자·행정심판·인허가 어느 분야든 먼저 사실관계를 들어보겠습니다.",
    ctaBody2: "1차 상담은 무료이며 영업일 기준 24시간 이내 회신드립니다.",
    ctaIntake: "무료 검토 요청하기 →",
    ctaQuickCheck: "AI 사전 진단 (30초)",
    ctaFootnote: "검토 무료 · 24h 이내 회신 · 수임 시 상담료 차감"
  },
  en: {
    metaTitle: "About Us — ETHOS Administrative Attorney Office",
    metaDescription: "The philosophy, lead attorney, and operating principles of ETHOS Administrative Attorney Office.",
    eyebrowAbout: "About ETHOS",
    heroTitle: "About Us",
    greetingEyebrow: "Greeting",
    greetingTitleA: "We look after the person",
    greetingTitleB: "behind every",
    greetingTitleC: "administrative matter.",
    greetingBody1:
      "AI can now organize large amounts of information quickly, supporting Logos — the domain of reasoned judgment. But someone facing an administrative matter needs more than information. They need the reassurance of being understood, and the trust that comes from having someone walk through an unfamiliar process with them.",
    greetingBody2Prefix: "",
    greetingBody2Name: "ETHOS Administrative Attorney Office",
    greetingBody2Suffix:
      " is built on the three elements of persuasion described by Aristotle — Logos, Pathos, and Ethos — listening carefully to each client's situation and working together toward the most realistic path forward.",
    greetingQuote: "Reason in Process. Empathy for People. Trust in Every Step.",
    scopeEyebrow: "Statutory Scope",
    scopeTitle: "Scope of Administrative Attorney Work",
    scopeSubtitle:
      "We represent clients within the scope defined by Article 2 of the Administrative Attorney Act. This does not cover the work of attorneys, judicial scriveners, tax accountants, or labor attorneys.",
    scopeItems: [
      { kicker: "Act §2-1", title: "Documents Filed with Agencies", desc: "Drafting and filing applications, reports, petitions, and objections submitted to government agencies" },
      { kicker: "Act §2-2", title: "Certification of Rights & Facts", desc: "Drafting documents certifying rights, obligations, or factual matters" },
      { kicker: "Act §2-3", title: "License & Permit Applications", desc: "Filing and follow-up for approvals, permits, licenses, and registrations" },
      { kicker: "Act §2-4", title: "Administrative Appeal Representation", desc: "Representation in administrative appeal petitions, rulings, and objections" },
      { kicker: "Act §2-5", title: "Statutory Interpretation & Advice", desc: "Interpreting relevant statutes and guiding procedures for administrative matters" },
      { kicker: "Act §2-6", title: "Fact Investigation & Verification", desc: "Investigating, verifying, and certifying facts needed for administrative procedures" }
    ],
    scopeNoticeTitle: "Matters Outside Administrative Attorney Scope",
    scopeNoticeBody:
      "Litigation (attorneys), registry filings (judicial scriveners), tax filings (tax accountants), and labor dispute representation (labor attorneys) are outside administrative attorney work. If your matter falls into one of these areas, we will refer you to an appropriate specialist after review.",
    valuesEyebrow: "Our Values",
    valuesTitle: "Three Core Values",
    values: VALUES_EN,
    colorEyebrow: "Color System",
    colorTitle: "Color as a Stance",
    colorIntro:
      "Our palette is not decoration but a design of perception. It translates into color the two impressions a client should feel at first sight — trust and expertise.",
    colorSwatches: [
      { hex: "#1B2B6B", name: "Navy", role: "Body text · bars" },
      { hex: "#152056", name: "Deep Navy", role: "Gradient end · depth" },
      { hex: "#B8972A", name: "Gold", role: "Accent · dividers" },
      { hex: "#F5F0E8", name: "Cream", role: "Base background" },
      { hex: "#F8F3E8", name: "Deep Cream", role: "Sections · boxes" },
      { hex: "#FFFFFF", name: "White", role: "Card background" }
    ],
    colorGrounding: [
      {
        k: "Navy — Trust & Competence",
        v: "In color-perception research, blue hues score highest among colors for perceived competence and trust — precisely the first impression an administrative and legal practice must convey.",
        cite: "Labrecque & Milne, Journal of the Academy of Marketing Science, 2012"
      },
      {
        k: "Gold — Restrained Expertise",
        v: "Across cultures, gold reads as a signal of premium quality, dignity, and professionalism. We use it sparingly — only for accents and dividers — for stature, not flash.",
        cite: "Aslam, Journal of Marketing Communications, 2006"
      },
      {
        k: "Cream — Editorial Gravitas",
        v: "Instead of pure white, a newsprint-toned cream reduces glare over long reading and leaves the composed impression of journalism that records and reviews.",
        cite: null
      }
    ],
    leadEyebrow: "Lead Attorney",
    leadTitle: "Administrative Attorney Jean",
    leadPhotoAlt: "Lead Administrative Attorney",
    leadBadge: "Lead Administrative Attorney",
    leadBadgeKicker: "Lead",
    leadBody1:
      "Handles visa and immigration matters, administrative appeals, contracts and fact investigation, licensing, and corporate registration. With over 2.5 years of visa/immigration experience at an embassy in Korea, registered as an official translator for Ministry of Justice refugee rulings and as a certified court interpreter/translator with the National Court Administration.",
    leadBody2Prefix: "Consultations are available in Korean, English, and Arabic, with",
    leadBody2Highlight: " multilingual document review and procedural guidance",
    leadBody2Suffix: " tailored to foreign clients.",
    credentialCards: [
      { kicker: "Embassy", title: "Embassy Visa Practice", desc: "2.5+ years visa/immigration experience" },
      { kicker: "MOJ", title: "MOJ Refugee Ruling Translator", desc: "Registered official translator" },
      { kicker: "Court", title: "Certified Court Interpreter", desc: "Registered with National Court Administration" },
      { kicker: "Academic", title: "HUFS Graduate School of Interpretation & Translation", desc: "Korean–Arabic" },
      { kicker: "Lecture", title: "OASIS 4 Lecturer", desc: "Foreign entrepreneur support program" },
      { kicker: "AI System", title: "Legal Automation System", desc: "Operates automated appeal drafting and statute collection" }
    ],
    otherCredentialsLabel: "Other Credentials",
    ctaEyebrow: "Start with ETHOS",
    ctaTitle: "Tell us about your situation today",
    ctaBody1: "Whatever the matter — visa, administrative appeal, or licensing — we start by hearing the facts.",
    ctaBody2: "The first review is free, with a reply within 24 business hours.",
    ctaIntake: "Request a Free Review →",
    ctaQuickCheck: "AI Pre-Check (30 sec)",
    ctaFootnote: "Free review · Reply within 24h · Consultation fee deducted upon engagement"
  }
} as const;

export default async function AboutPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  const t = COPY[lang];
  const [greeting, brandEyebrow, brandTitle, brandBody, brandLogoNote] = await Promise.all([
    getSiteSetting("about.greeting"),
    getSiteSetting("about.brandStory.eyebrow"),
    getSiteSetting("about.brandStory.title"),
    getSiteSetting("about.brandStory.body"),
    getSiteSetting("about.brandStory.logoNote")
  ]);
  const credentials = await listPublicCredentials();
  const imageRows = await prisma.siteSetting
    .findMany({ where: { key: { in: ["image.aboutPhoto", "image.brandStory"] } } })
    .catch(() => [] as { key: string; value: string }[]);
  const imageMap = new Map(imageRows.map((r) => [r.key, r.value]));
  const aboutPhoto = imageMap.get("image.aboutPhoto") || null;
  const brandStoryImage = imageMap.get("image.brandStory") || null;
  const hasBrandStory = Boolean(
    brandStoryImage ||
      (brandTitle && brandTitle.trim()) ||
      (brandBody && brandBody.trim()) ||
      (brandLogoNote && brandLogoNote.trim())
  );
  return (
    <div className="overflow-x-clip">
      <PersonJsonLd />
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">{t.eyebrowAbout}</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">{t.heroTitle}</h1>
          </Reveal>
          <Reveal delay={2}>
            <div className="mt-10 flex justify-center">
              <EthosLogo size={140} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 로고·브랜드 스토리 — 관리자가 입력한 텍스트 또는 업로드한 이미지가 있을 때만 노출 */}
      {hasBrandStory && (
        <section className="border-y border-gold/25 bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            {brandStoryImage ? (
              // 업로드한 인포그래픽이 있으면: 헤더 + 이미지를 중심으로 크게 노출 (이미지 자체가 상징 설명을 포함).
              <div className="text-center">
                {brandEyebrow && brandEyebrow.trim() ? (
                  <Reveal>
                    <p className="ethos-eyebrow">{brandEyebrow}</p>
                  </Reveal>
                ) : null}
                {brandTitle && brandTitle.trim() ? (
                  <Reveal delay={1}>
                    <h2 className="ethos-display mt-4 text-3xl leading-tight sm:text-[2.4rem]">{brandTitle}</h2>
                  </Reveal>
                ) : null}
                <Reveal delay={2}>
                  <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border border-gold/30 shadow-floating">
                    <Image
                      src={brandStoryImage}
                      alt={brandTitle?.trim() || "로고·브랜드 스토리"}
                      width={1456}
                      height={1080}
                      className="h-auto w-full"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 768px"
                    />
                  </div>
                </Reveal>
                {brandLogoNote && brandLogoNote.trim() ? (
                  <Reveal delay={3}>
                    <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line text-sm leading-7 text-text-muted">
                      {brandLogoNote}
                    </p>
                  </Reveal>
                ) : null}
              </div>
            ) : (
              // 이미지가 없으면: SVG 로고 + 텍스트 2단 레이아웃 (기본).
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:items-center">
                <Reveal>
                  <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                    <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-gold-soft/20 via-surface to-primary/10 p-8 shadow-panel">
                      <EthosLogo size={160} />
                    </div>
                    {brandLogoNote && brandLogoNote.trim() ? (
                      <p className="max-w-xs whitespace-pre-line text-xs leading-6 text-text-muted">
                        {brandLogoNote}
                      </p>
                    ) : null}
                  </div>
                </Reveal>
                <Reveal delay={1}>
                  <div>
                    {brandEyebrow && brandEyebrow.trim() ? (
                      <p className="ethos-eyebrow">{brandEyebrow}</p>
                    ) : null}
                    {brandTitle && brandTitle.trim() ? (
                      <h2 className="ethos-display mt-4 text-3xl leading-tight sm:text-[2.4rem]">
                        {brandTitle}
                      </h2>
                    ) : null}
                    {brandBody && brandBody.trim() ? (
                      <div className="mt-6 whitespace-pre-line text-sm leading-8 text-text">
                        {brandBody}
                      </div>
                    ) : null}
                  </div>
                </Reveal>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 컬러 시스템 — 브랜드 색 팔레트 + 근거 */}
      <section className="border-b border-gold/20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">{t.colorEyebrow}</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.4rem]">{t.colorTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">{t.colorIntro}</p>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {t.colorSwatches.map((s, i) => (
              <Reveal key={s.hex} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <div className="flex flex-col">
                  <div
                    className="aspect-[4/3] w-full rounded-xl border border-line shadow-panel"
                    style={{ backgroundColor: s.hex }}
                    aria-hidden
                  />
                  <p className="mt-3 font-serif text-sm font-bold text-text-strong">{s.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-gold-deep">{s.hex}</p>
                  <p className="mt-1 text-[11px] leading-5 text-text-muted">{s.role}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {t.colorGrounding.map((g, i) => (
              <Reveal key={g.k} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <div className="h-full rounded-2xl border border-gold/25 bg-surface p-6 shadow-panel">
                  <p className="font-serif text-sm font-bold text-primary">{g.k}</p>
                  <p className="mt-2.5 text-xs leading-6 text-text-muted">{g.v}</p>
                  {g.cite ? (
                    <p className="mt-3.5 border-t border-line pt-3 text-[10px] italic leading-4 text-text-muted/80">
                      {g.cite}
                    </p>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 인사말 — DARK band */}
      <section className="ethos-band ethos-band-dark ethos-grain py-24 sm:py-32" style={{ backgroundColor: "rgb(22 50 80)" }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow text-gold-soft">{t.greetingEyebrow}</p>
            <h2 className="ethos-display mt-5 text-3xl leading-snug text-white sm:text-[2.6rem]">
              {t.greetingTitleA}
              <br />
              {t.greetingTitleB}
              <br />
              <span className="text-gold-soft">{t.greetingTitleC}</span>
            </h2>
          </Reveal>
          <div className="mt-10 space-y-6 text-base leading-8 text-white/80">
            <Reveal delay={1}>
              <p className="ethos-dropcap">{greeting}</p>
            </Reveal>
            <Reveal delay={2}>
              <p>{t.greetingBody1}</p>
            </Reveal>
            <Reveal delay={3}>
              <p>
                {t.greetingBody2Prefix}
                <span className="font-serif font-bold text-white">{t.greetingBody2Name}</span>
                {t.greetingBody2Suffix}
              </p>
            </Reveal>
            <Reveal delay={4}>
              <p className="ethos-quote border-l-2 border-gold/60 pl-5 text-lg text-gold-soft">
                {t.greetingQuote}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 행정사 권한 — 행정사법 제2조 */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">{t.scopeEyebrow}</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.4rem]">{t.scopeTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-text-muted">
              {t.scopeSubtitle}
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.scopeItems.map((s) => (
              <div key={s.kicker} className="ethos-card ethos-card-hover p-6">
                <p className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold-deep">{s.kicker}</p>
                <p className="mt-2 font-serif text-base font-bold text-text-strong">{s.title}</p>
                <p className="mt-2 text-xs leading-6 text-text-muted">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="font-serif text-sm font-bold text-amber-900">{t.scopeNoticeTitle}</p>
            <p className="mt-1.5 text-xs leading-6 text-amber-800">
              {t.scopeNoticeBody}
            </p>
          </div>
        </div>
      </section>

      {/* 가치 */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">{t.valuesEyebrow}</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">{t.valuesTitle}</h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {t.values.map((v, i) => (
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
                    <Image src={aboutPhoto} alt={t.leadPhotoAlt} fill className="object-cover" unoptimized sizes="(max-width: 768px) 100vw, 40vw" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                      <svg viewBox="0 0 80 100" width="120" className="text-primary/20" fill="currentColor" aria-hidden>
                        <circle cx="40" cy="28" r="18" />
                        <path d="M10 95 Q10 60 40 55 Q70 60 70 95 Z" />
                      </svg>
                      <p className="font-serif text-xs tracking-wider text-text-muted">{t.leadBadge}</p>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-5 -right-5 rounded-xl bg-primary px-6 py-4 text-white shadow-floating">
                  <p className="ethos-quote text-xs tracking-wider text-gold-soft">{t.leadBadgeKicker}</p>
                  <p className="mt-1 font-serif text-lg font-bold">{t.leadBadge}</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div>
                <p className="ethos-eyebrow">{t.leadEyebrow}</p>
                <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">{t.leadTitle}</h2>

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
                  <p>{t.leadBody1}</p>
                  <p>
                    {t.leadBody2Prefix}
                    <span className="font-bold text-primary">{t.leadBody2Highlight}</span>
                    {t.leadBody2Suffix}
                  </p>
                </div>

                {/* 권위 신호 카드 */}
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {t.credentialCards.map((c) => (
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
                    <p className="font-serif text-xs font-bold uppercase tracking-wider text-gold-deep">{t.otherCredentialsLabel}</p>
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
            <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 ethos-dark-card p-12 text-center shadow-floating sm:p-16">
              <p className="ethos-eyebrow text-gold-soft">{t.ctaEyebrow}</p>
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">
                {t.ctaTitle}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/80">
                {t.ctaBody1}
                <br className="hidden sm:block" />
                {t.ctaBody2}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`/intake${lang === "en" ? "?lang=en" : ""}`}
                  className="inline-flex h-12 items-center rounded-lg bg-gold px-8 text-sm font-bold text-primary transition hover:bg-gold-soft"
                >
                  {t.ctaIntake}
                </Link>
                <Link
                  href={`/quick-check${lang === "en" ? "?lang=en" : ""}`}
                  className="inline-flex h-12 items-center rounded-lg border border-gold/50 px-8 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
                >
                  {t.ctaQuickCheck}
                </Link>
              </div>
              <p className="mt-6 text-xs text-white/70">{t.ctaFootnote}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
