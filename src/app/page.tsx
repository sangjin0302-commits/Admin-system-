import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { prisma } from "@/lib/prisma/client";

import { FaqAccordion } from "@/components/public/faq-accordion";
import { TrustStats } from "@/components/public/trust-stats";
import { Testimonials } from "@/components/public/testimonials";
import { TrustBelt } from "@/components/public/trust-belt";
import { Reveal } from "@/components/public/reveal";
import { ConsultStructure } from "@/components/public/consult-structure";
import { HeroScrollIndicator } from "@/components/public/hero-scroll-indicator";
import { ParallaxAurora } from "@/components/public/parallax-aurora";
import { NewsletterWidget } from "@/components/public/newsletter-widget";
import { NaverReviewBand } from "@/components/public/naver-review-band";
import { HomeBlogShowcase } from "@/components/public/home-blog-showcase";
import { HeroCtaSubtitleVariants } from "@/components/public/hero-cta-variants";
import { HoloLogo } from "@/components/public/holo-logo";
import { PersonalizedHero } from "@/components/public/personalized-hero";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { fetchNaverBlogPosts } from "@/lib/services/naver-blog";
import { HOME_COPY, normalizeLang } from "@/lib/i18n-public";
import { loadNamespaceOverride } from "@/lib/i18n/load-overrides";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";
import { OrganizationJsonLd, LegalServiceJsonLd } from "@/components/seo/json-ld";
import { getSiteSettings } from "@/lib/services/site-settings";
import { getContentBatch } from "@/lib/services/site-content-service";
import { listPublicTestimonials } from "@/lib/services/testimonials";
import { LocalLandingGrid } from "@/components/public/local-landing-grid";
import DynamicCtaButton from "@/components/public/dynamic-cta-button";
import { HomeGazetteTeaser } from "@/components/public/home-gazette-teaser";
import {
  parseStringList,
  parseTitleDescList,
  parsePhilosophyList,
  parseProcessList,
  parsePracticeList
} from "@/lib/services/home-copy-parsers";

export const revalidate = 300;

type PracticeArea = {
  no: string;
  title: string;
  titleEn: string;
  subtitle: string;
  description: string;
  descriptionEn: string;
  href: string;
  bullets: readonly string[];
  bulletsEn: readonly string[];
  icon: ReactNode;
};

const PRACTICE_AREAS: readonly PracticeArea[] = [
  {
    no: "01",
    title: "비자 / 외국인 체류",
    titleEn: "Visa / Immigration",
    subtitle: "VISA & IMMIGRATION",
    description: "체류기간 연장, 자격 변경, 초청, 영주·국적, 강제퇴거 대응까지 한 흐름으로 정리합니다.",
    descriptionEn: "Extensions, status changes, invitations, permanent residency & nationality, and removal defense — organized in one flow.",
    href: "/services/immigration",
    bullets: ["체류 자격 변경 / 연장", "사업·투자 비자", "강제퇴거 / 출국명령 대응"],
    bulletsEn: ["Status change / extension", "Business & investment visa", "Removal / departure order defense"],
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
    titleEn: "Administrative Appeal",
    subtitle: "ADMINISTRATIVE APPEAL",
    description: "처분 내용·통지일·청구기한을 확인하고 청구이유·증거자료를 정리해 심판을 준비합니다.",
    descriptionEn: "We verify the disposition, notice date, and filing deadline, then organize grounds and evidence to prepare the appeal.",
    href: "/services/appeal",
    bullets: ["청구기한 검토 (90일)", "처분청·재결청 분리 관리", "재결까지 단계별 추적"],
    bulletsEn: ["Filing deadline review (90 days)", "Disposition vs. adjudication agency", "Step-by-step tracking to decision"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 3v18M6 8h12M5 13l7-3 7 3M5 13v3a7 7 0 0 0 14 0v-3" />
      </svg>
    )
  },
  {
    no: "03",
    title: "계약서 / 사실조사",
    titleEn: "Contract / Investigation",
    subtitle: "CONTRACT & INVESTIGATION",
    description: "계약 검토·작성, 분쟁 사실관계 조사, 법적 근거 정리, 조사보고서 작성을 지원합니다.",
    descriptionEn: "Contract drafting & review, fact-finding in disputes, legal-basis organization, and investigation reports.",
    href: "/services/contract",
    bullets: ["계약서 작성 / 검토", "분쟁 사실관계 조사", "조사보고서 작성"],
    bulletsEn: ["Contract drafting / review", "Dispute fact-finding", "Investigation reports"],
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
    titleEn: "Licenses & Permits",
    subtitle: "LICENSE & PERMIT",
    description: "사업·건축·식품·의료·환경 등 인허가 신청, 보완 대응, 불복 절차를 함께 준비합니다.",
    descriptionEn: "Business, construction, food, medical, and environmental permits — applications, supplementary responses, and appeals.",
    href: "/services/license",
    bullets: ["사업·건축·식품 허가", "처리기한 / 보완 관리", "불허 시 불복 절차"],
    bulletsEn: ["Business / construction / food permits", "Deadline & supplement management", "Appeal on denial"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 3v4M16 3v4M4 11h16M9 15l2 2 4-4" />
      </svg>
    )
  },
  {
    no: "05",
    title: "법인 설립",
    titleEn: "Company Formation",
    subtitle: "CORPORATE FORMATION",
    description: "법인 형태 결정, 정관·설립 등기 준비부터 설립 후 필요한 인허가 연계까지 함께합니다.",
    descriptionEn: "From entity type and articles of incorporation to registration, and linking the permits you need afterward.",
    href: "/services/corporate",
    bullets: ["법인 유형 / 자본금 설계", "정관 · 설립 등기 준비", "설립 후 인허가 연계"],
    bulletsEn: ["Entity type / capital design", "Articles & registration prep", "Post-formation permits"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.3">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 11h.01M15 11h.01" />
      </svg>
    )
  }
];

const PHILOSOPHY = [
  {
    greek: "Logos",
    korean: "로고스 · 기둥",
    koreanEn: "Logos · Pillar",
    title: "이성",
    titleEn: "Reason",
    description: "이성, 질서, 절차. 행정 문제를 정확하고 논리적으로 풀어가는 태도를 담았습니다.",
    descriptionEn: "Reason, order, procedure — resolving administrative matters precisely and logically.",
    benefit: "→ 기한·서식·근거를 정확히 짚어 흔들리지 않는 서면을 만듭니다.",
    benefitEn: "→ Pinpointing deadlines, forms, and grounds to build filings that hold."
  },
  {
    greek: "Ethos",
    korean: "에토스 · 빛",
    koreanEn: "Ethos · Light",
    title: "신뢰",
    titleEn: "Trust",
    description: "신뢰, 품격, 책임. 의뢰인에게 믿을 수 있는 기준과 방향을 제시하는 마음을 담았습니다.",
    descriptionEn: "Trust, dignity, responsibility — offering clients a reliable standard and direction.",
    benefit: "→ 결과를 부풀리지 않고, 가능성과 한계를 솔직하게 안내합니다.",
    benefitEn: "→ We never overstate outcomes; we're honest about possibilities and limits."
  },
  {
    greek: "Pathos",
    korean: "파토스 · 손",
    koreanEn: "Pathos · Hand",
    title: "공감",
    titleEn: "Empathy",
    description: "공감, 이해, 위로. 행정의 문제 뒤에 있는 사람의 사정과 마음을 함께 헤아립니다.",
    descriptionEn: "Empathy, understanding, comfort — considering the person behind the administrative matter.",
    benefit: "→ 처음 겪는 절차도 이해하기 쉽게, 끝까지 곁에서 안내합니다.",
    benefitEn: "→ We guide even first-time procedures clearly, by your side to the end."
  }
] as const;

const PROCESS_STEPS = [
  { step: "01", title: "접수", titleEn: "Intake", desc: "업무 분야, 연락처, 기본 사실관계를 남깁니다.", descEn: "Leave your practice area, contact, and basic facts." },
  { step: "02", title: "사실관계 확인", titleEn: "Fact Check", desc: "처분서, 통지일, 체류자격, 제출기관을 확인합니다.", descEn: "We verify the disposition, notice date, status, and agency." },
  { step: "03", title: "자료 요청", titleEn: "Document Request", desc: "필요 자료와 보완 항목을 안내합니다.", descEn: "We guide the documents and supplements needed." },
  { step: "04", title: "기한·서식 검토", titleEn: "Deadline & Form Review", desc: "공식 서식·제출기관 기준·기한을 확인합니다.", descEn: "We confirm official forms, agency rules, and deadlines." },
  { step: "05", title: "제출 준비", titleEn: "Submission Prep", desc: "관리자 검토 후 제출 준비와 보완 대응을 정리합니다.", descEn: "After review, we organize submission and supplementary responses." }
] as const;

const FAQ_ITEMS = [
  { q: "상담 신청 후 바로 진행되나요?", qEn: "Does work start right after I request a consultation?", a: "사실관계와 자료를 확인한 뒤 가능한 범위와 다음 단계를 안내합니다.", aEn: "After reviewing the facts and documents, we explain the feasible scope and next steps." },
  { q: "행정심판 청구기한이 지나면 어떻게 되나요?", qEn: "What if the appeal filing deadline has passed?", a: "처분일·통지일을 기준으로 청구기한을 확인합니다. 기한 경과 시 사안별 대응을 함께 검토합니다.", aEn: "We check the deadline from the disposition/notice date. If it has passed, we review case-specific options together." },
  { q: "계약서 검토만 의뢰할 수 있나요?", qEn: "Can I request contract review only?", a: "계약서 작성/검토 단독 의뢰 가능합니다. 분쟁 발생 시 사실조사를 추가로 진행할 수 있습니다.", aEn: "Yes, contract drafting/review can be a standalone request. If a dispute arises, fact-finding can be added." },
  { q: "인허가 보완 요청 대응도 도와주나요?", qEn: "Do you help respond to permit supplement requests?", a: "신청부터 보완 대응, 불허 처분 시 불복 절차까지 단계별로 관리합니다.", aEn: "We manage from application through supplements to appeals on denial, step by step." },
  { q: "진행상황은 어떻게 확인하나요?", qEn: "How do I check progress?", a: "접수 후 받은 접수번호로 자료요청, 검토 상태, 다음 안내를 확인할 수 있습니다.", aEn: "With the tracking code you receive after intake, you can check document requests, review status, and next steps." },
  { q: "결과를 보장하나요?", qEn: "Do you guarantee results?", a: "결과를 보장하지 않습니다. 자료 확인 후 안내하며, AI가 최종 판단하지 않습니다.", aEn: "We do not guarantee results. We advise after reviewing documents, and AI does not make the final judgment." }
] as const;

function PrimaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="ethos-cta-shine group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-text-strong hover:shadow-lg hover:shadow-primary/20"
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

// ?lang=en 홈은 그동안 레이아웃의 한글 메타를 상속해 검색결과에 한글 제목이 노출됐음.
// 영문일 때만 영문 메타로 덮고 canonical 을 /en 으로(중복색인 방지). 한글은 레이아웃 상속.
export async function generateMetadata({
  searchParams
}: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  if (params.lang !== "en") {
    // 한글 홈 메타(기존 export const metadata 이관). canonical "/" + hreflang.
    return {
      title: "에토스 행정사사무소(ETHOS) — 절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를",
      description:
        "에토스 행정사사무소. 비자/외국인 체류, 행정심판, 계약서·사실조사, 인허가 업무를 Logos·Pathos·Ethos 철학으로 함께합니다.",
      alternates: { canonical: "/", languages: { ko: "/", en: "/en", "x-default": "/" } }
    };
  }
  const title = "ETHOS Administrative Attorney — Visa, Appeals, Permits for Foreign Residents";
  const description =
    "Korean administrative-law support for foreign residents: visa & residency, administrative appeals, contracts, and licensing. Fast direction, case-by-case judgment.";
  return {
    title,
    description,
    alternates: { canonical: "/en" },
    openGraph: { title, description, locale: "en_US", type: "website" },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function PublicMarketingHomePage({
  searchParams
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const lang = normalizeLang(params.lang);
  const t = HOME_COPY[lang];
  // admin(/admin/i18n)에서 편집한 마케팅 문구 override. 없으면 기본값(HOME_COPY).
  const homeOv = await loadNamespaceOverride(lang, "home");
  const tt = (key: string, fallback: string) => homeOv[key] ?? fallback;
  const intakeHref = buildWebsiteIntakeHref();

  // ─── 마케팅 배열 override(/admin/i18n "home") → 파서 → 실패/빈값이면 하드코딩 회귀 ───
  //   기본 직렬화본은 하드코딩 배열과 라운드트립하므로 override 없으면 렌더 결과 동일.
  const benefits = parseStringList(tt("benefitsList", "") || undefined, t.benefits);
  const leadBullets = parseStringList(tt("leadBulletsList", "") || undefined, t.leadBullets);
  const whyCards = parseTitleDescList(tt("whyCardsList", "") || undefined, t.whyCards);
  const philosophyDefaults = PHILOSOPHY.map((p) =>
    lang === "en"
      ? { title: p.titleEn, description: p.descriptionEn, benefit: p.benefitEn }
      : { title: p.title, description: p.description, benefit: p.benefit }
  );
  const philosophyItems = parsePhilosophyList(tt("philosophyList", "") || undefined, philosophyDefaults);
  const processDefaults = PROCESS_STEPS.map((s) =>
    lang === "en"
      ? { step: s.step, title: s.titleEn, desc: s.descEn }
      : { step: s.step, title: s.title, desc: s.desc }
  );
  const processSteps = parseProcessList(tt("processList", "") || undefined, processDefaults);
  const practiceDefaults = PRACTICE_AREAS.map((a) =>
    lang === "en"
      ? { title: a.titleEn, subtitle: a.subtitle, description: a.descriptionEn, bullets: [...a.bulletsEn] }
      : { title: a.title, subtitle: a.subtitle, description: a.description, bullets: [...a.bullets] }
  );
  const practiceAreas = parsePracticeList(tt("practiceList", "") || undefined, practiceDefaults);

  // 관리자 운영란 컨텐츠 (한국어에서만 override, 영어는 기본 카피)
  const site = await getSiteSettings();
  // CMS 오버레이 (site_content_editor flag) — 편집 가능한 문구
  // "home.cta.label" 제거: 이 키는 fetch 만 되고 렌더 안 됐음(dead read). 실제 기본
  // CTA 문구는 i18n tt("ctaFreeReview")가 담당 → content-editor 에서 편집해도 무효였음.
  const cms = await getContentBatch([
    "home.deadline_strip.title",
    "home.deadline_strip.subtitle",
    "footer.tagline"
  ]);
  const heroBadge = lang === "ko" && site["home.heroBadge"] ? site["home.heroBadge"] : t.heroTagBadge;
  const heroDescription =
    lang === "ko" && site["home.heroDescription"] ? site["home.heroDescription"] : t.heroDescription;
  const noticeBanner = site["home.noticeBanner"]?.trim();
  const heroTitleOverride = lang === "ko" ? site["home.heroTitle"]?.trim() : "";
  const heroTitleLines = heroTitleOverride ? heroTitleOverride.split("\n").map((l) => l.trim()).filter(Boolean) : null;

  // Brand Story 본문 override (문단 = 빈 줄 구분)
  const brandStoryOverride = site["home.brandStory"]?.trim();
  const brandStoryParas = brandStoryOverride
    ? brandStoryOverride.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    : null;

  // FAQ override: "Q :: A" 줄 단위
  const faqOverride = site["home.faq"]?.trim();
  const faqItems = faqOverride
    ? faqOverride
        .split("\n")
        .map((line) => {
          const [q, ...rest] = line.split("::");
          return { q: (q ?? "").trim(), a: rest.join("::").trim() };
        })
        .filter((x) => x.q && x.a)
    : FAQ_ITEMS.map((f) => ({ q: lang === "en" ? f.qEn : f.q, a: lang === "en" ? f.aEn : f.a }));

  const testimonials = await listPublicTestimonials();
  const naverBlogId = site["naver.blogId"];
  const naverPosts = naverBlogId ? await fetchNaverBlogPosts(naverBlogId, 6) : [];

  // 홈 블로그 쇼케이스 — 자사 수입 최신글(커버 포함). 자사 도메인 링크로 SEO/전환.
  const showcasePosts = await prisma.blogPost
    .findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        slug: true,
        title: true,
        titleEn: true,
        excerpt: true,
        excerptEn: true,
        category: true,
        coverImage: true
      }
    })
    .catch(() => []);

  // 로고 (DB → /logo.webp fallback)
  const heroLogoRow = await prisma.siteSetting.findUnique({ where: { key: "image.logo" } }).catch(() => null);
  let heroLogo = heroLogoRow?.value || "/logo.webp";
  // 대표 사진 슬롯 (image.aboutPhoto) — 설정 시 Lead Attorney 섹션에 인물 사진 노출.
  const aboutPhotoRow = await prisma.siteSetting.findUnique({ where: { key: "image.aboutPhoto" } }).catch(() => null);
  const aboutPhoto = aboutPhotoRow?.value?.trim() || "";
  const [
    holoLogoEnabled,
    personalizationEnabled,
    heroRotationEnabled,
    dynamicCtaEnabled,
    trustBeltEnabled,
    localGridEnabled,
    naverReviewsEnabled,
    processCtaEnabled,
    newsletterEnabled,
    consultStructureEnabled,
    trackingPrinciplesEnabled
  ] = await Promise.all([
    isFeatureEnabled("holographic_logo"),
    isFeatureEnabled("homepage_personalization"),
    isFeatureEnabled("hero_image_rotation"),
    isFeatureEnabled("dynamic_cta_labels"),
    isFeatureEnabled("trust_belt"),
    isFeatureEnabled("local_landing_grid"),
    isFeatureEnabled("home_naver_reviews"),
    isFeatureEnabled("home_process_cta"),
    isFeatureEnabled("home_newsletter"),
    isFeatureEnabled("home_consult_structure"),
    isFeatureEnabled("home_tracking_principles"),
  ]);

  // UX5: 히어로 이미지 일자별 로테이션 — SiteSetting "image.hero.rotation" = JSON string[]
  //   DB 미설정 시 기본 배열 (커밋된 브랜드 배경) 사용
  if (heroRotationEnabled) {
    let list: string[] = ["/hero-rotation-1.png"];
    const rotationRow = await prisma.siteSetting.findUnique({ where: { key: "image.hero.rotation" } }).catch(() => null);
    if (rotationRow?.value) {
      try {
        const parsed = JSON.parse(rotationRow.value) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch { /* malformed JSON → 기본 배열 유지 */ }
    }
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    heroLogo = list[dayOfYear % list.length] || heroLogo;
  }

  // NOTE: 대표 프로필 사진(image.aboutPhoto) 조회를 제거했다. 프로필 섹션에서
  // 사진/로고 카드를 걷어내면서 쓰이지 않게 됐고, 남겨두면 렌더마다 불필요한
  // DB 조회가 한 번씩 더 나간다. 사진을 다시 쓰려면 이 조회와 슬롯을 함께 되살린다.

  return (
    <div className="overflow-x-clip">
      <HeroScrollIndicator />
      <OrganizationJsonLd />
      <LegalServiceJsonLd
        serviceName="비자·체류 / 행정심판 / 계약·사실조사 / 인허가 / 법인설립"
        description={t.heroDescription}
      />
      {/* 긴급 상단 스트립 — 행정 기한 안내 */}
      <div className="border-b border-gold/30 bg-gold-soft/60 px-4 py-2 text-center text-[13px] leading-5 text-primary">
        <span aria-hidden className="mr-1">⚠️</span>
        <span className="font-serif font-bold">{cms["home.deadline_strip.title"]}</span>
        <span className="mx-1.5 text-gold-deep">—</span>
        <span className="text-text-muted">{cms["home.deadline_strip.subtitle"]}</span>{" "}
        <Link
          href="/quick-check"
          className="ml-1 inline-flex items-center gap-1 font-semibold text-primary underline decoration-gold/60 underline-offset-2 transition-colors hover:text-gold-deep"
        >
          {tt("deadlineCta", t.deadlineCta)}
          <span aria-hidden>→</span>
        </Link>
      </div>

      {/* 공지 배너 (운영란에서 입력 시 표시) */}
      {noticeBanner && (
        <div className="border-b border-gold/30 bg-primary px-4 py-2.5 text-center text-sm text-white">
          <span className="font-serif text-gold-soft">{tt("noticeLabel", t.noticeLabel)}</span> · {noticeBanner}
        </div>
      )}

      {/* ═══════════════ HERO ═══════════════ */}
      {/* A방향(여백·타이포) + B방향(문서의 물성)을 함께 적용한 히어로.
          ethos-paper = 종이 결. 이미지 파일 없이 CSS 로만 만든다. */}
      <section className="ethos-paper relative overflow-hidden">
        <ParallaxAurora className="ethos-aurora ethos-aurora-animated" />

        {/* A방향: 상하 여백을 키우고(pt-28→pt-36) 좌우 비율을 글자 쪽으로 더 준다. */}
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-24 pt-24 sm:px-6 sm:pb-32 sm:pt-36 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            {personalizationEnabled && <PersonalizedHero fallbackBadge={heroBadge} fallbackTitle={heroTitleOverride || "비자 거절, 행정처분, 인허가 —\n방향은 빠르게, 판단은 사안별로 드립니다"} fallbackDescription={heroDescription} />}
            <Reveal>
              <span className="ethos-eyebrow inline-flex items-center gap-2 text-gold-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {tt("heroEyebrow", t.heroEyebrow)}
              </span>
            </Reveal>

            <Reveal delay={1}>
              <h1 className="ethos-display mt-7 max-w-[19ch] text-[2.9rem] leading-[1.06] tracking-[-0.028em] text-balance sm:text-[4.15rem]">
                {heroTitleLines ? (
                  heroTitleLines.map((line, i) => (
                    <span key={i}>
                      {i === heroTitleLines.length - 1 ? (
                        <span className="ethos-underline-gold">{line}</span>
                      ) : (
                        line
                      )}
                      {i < heroTitleLines.length - 1 && <br />}
                    </span>
                  ))
                ) : (
                  <>
                    {t.heroTitleLead}
                    <br />
                    <span className="ethos-underline-gold">{t.heroTitleEmph}</span>{t.heroTitleTail}
                  </>
                )}
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <HeroCtaSubtitleVariants />
            </Reveal>

            {/* 혜택 배지 행 — 24h·비용·다국어 전면 노출 */}
            <Reveal delay={2}>
              <div className="mt-7 flex flex-wrap gap-2.5">
                {benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft/40 px-3.5 py-1.5 text-sm font-semibold text-primary"
                  >
                    <span className="text-gold-deep">✓</span>
                    {benefit}
                  </span>
                ))}
              </div>
            </Reveal>

            {/* CTA 위계 — 지배적 primary 하나 + 보조 하나 */}
            <Reveal delay={3}>
              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                {dynamicCtaEnabled ? (
                  <DynamicCtaButton
                    enabled
                    className="ethos-cta-shine h-14 px-8 text-base font-bold shadow-md hover:bg-text-strong hover:shadow-lg hover:shadow-primary/25"
                  />
                ) : (
                  <Link
                    href={intakeHref}
                    data-tour-id="cta-consult"
                    className="ethos-cta-shine group inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-white shadow-md transition-all duration-300 hover:bg-text-strong hover:shadow-lg hover:shadow-primary/25"
                  >
                    {tt("ctaFreeReview", t.ctaFreeReview)}
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                  </Link>
                )}
                <Link
                  href="/quick-check"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-gold/50 bg-surface/60 px-7 text-sm font-semibold text-primary backdrop-blur transition-all duration-300 hover:border-gold hover:bg-gold-soft/30"
                >
                  {tt("ctaQuickCheck30", t.ctaQuickCheck30)}
                </Link>
              </div>
            </Reveal>

            {/* 요금 안내 힌트 (admin 편집: home.pricingHint) — 비우면 숨김 */}
            {site["home.pricingHint"]?.trim() && (
              <Reveal delay={3}>
                <p className="mt-4 inline-flex items-center rounded-full bg-gold-soft/40 px-4 py-1.5 text-xs font-semibold text-gold-deep">
                  {site["home.pricingHint"]!.trim()}
                </p>
              </Reveal>
            )}

            {/* 사회적 증거 에코 */}
            <Reveal delay={4}>
              <p className="mt-5 text-sm leading-5 text-text">
                {tt("socialEcho", t.socialEcho)}
              </p>
            </Reveal>

            <Reveal delay={4}>
              <p className="mt-3 text-sm leading-5 text-text-muted">{tt("safetyNote", t.safetyNote)}</p>
            </Reveal>
          </div>

          {/* 우: 로고 + 다국어 + 권위 카드 */}
          <Reveal delay={2} className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gold/15 blur-3xl" aria-hidden />
              <div
                className="ethos-grain relative flex w-full flex-col items-center overflow-hidden rounded-[28px] border border-gold/30 px-8 py-12 text-center shadow-floating sm:px-12 sm:py-14"
                style={{
                  backgroundColor: "rgb(22 50 80)",
                  backgroundImage: "linear-gradient(180deg, rgb(22 50 80) 0%, rgb(18 40 65) 60%, rgb(12 28 48) 100%)"
                }}>
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

                {/* 로고 prominent — 흰 타일로 가시성 보장 */}
                <div className="relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-3xl bg-white p-6 shadow-floating ring-4 ring-gold/40 sm:h-60 sm:w-60">
                  {holoLogoEnabled ? <HoloLogo label="ETHOS 3D 로고" /> : (
                  <Image
                    src={heroLogo}
                    alt="에토스 행정사사무소(ETHOS) 로고"
                    fill
                    className="object-contain p-2"
                    priority
                    unoptimized={heroLogo.startsWith("http")}
                    sizes="(max-width: 768px) 13rem, 15rem"
                  />
                  )}
                </div>

                <p className="mt-7 font-serif text-base font-bold tracking-[0.32em] text-white">ETHOS</p>
                <p className="mt-1 font-serif text-[11px] tracking-[0.25em] text-gold-soft">{lang === "en" ? "ETHOS Administrative Attorney" : "에토스 행정사사무소"}</p>

                {/* 골드 디바이더 */}
                <div className="my-7 h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

                {/* 다국어 stack */}
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 font-serif text-xs font-bold text-white ring-1 ring-gold/30">🇰🇷 한국어</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 font-serif text-xs font-bold text-white ring-1 ring-gold/30">🇬🇧 English</span>
                </div>

                {/* 권위 한 줄 */}
                <p className="mt-6 text-xs leading-6 text-white/85">
                  {tt("cardAuthority", t.cardAuthority).split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i === 0 && <br />}
                    </span>
                  ))}
                </p>

                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              </div>
            </div>
          </Reveal>
        </div>

        {/* 히어로 실적 스트립 — 첫인상(3초)에 결과 숫자를 바로 노출. */}
        <div className="relative border-t border-gold/20 bg-surface/40 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6">
            <Reveal>
              <TrustStats
                overrides={[site["home.stat1"], site["home.stat2"], site["home.stat3"], site["home.stat4"]]}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━ 의뢰인 여정 ① 내 문제를 아는가 — 업무분야 ━━━━━━━━━━━━━━━ */}
      {/* 방문자의 첫 질문은 "이 사무소가 내 사건을 다루나?"다. 신뢰·프로필보다 먼저
          업무분야를 보여줘 정보 냄새를 잇는다(예전엔 6번째로 밀려 있었다). */}
      <section className="py-24 sm:py-28" aria-labelledby="practice-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="ethos-eyebrow">Practice Areas</p>
                <h2 id="practice-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
                  {tt("practiceTitle", t.practiceTitle)}
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-7 text-text-muted">
                {tt("practiceSubtitle", t.practiceSubtitle)}
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {PRACTICE_AREAS.map((area, i) => {
              const text = practiceAreas[i] ?? {
                title: lang === "en" ? area.titleEn : area.title,
                subtitle: area.subtitle,
                description: lang === "en" ? area.descriptionEn : area.description,
                bullets: [...(lang === "en" ? area.bulletsEn : area.bullets)]
              };
              return (
              <Reveal key={area.no} delay={((i % 2) + 1) as 1 | 2}>
                <Link
                  href={area.href}
                  className="ethos-card ethos-card-hover ethos-card-topline ethos-cta-shine ethos-tilt group relative flex h-full flex-col overflow-hidden p-8"
                >
                  <span className="ethos-index pointer-events-none absolute -right-2 -top-4 select-none">
                    {area.no}
                  </span>
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold-soft/30 text-primary transition-colors duration-300 group-hover:bg-gold-soft/60">
                    {area.icon}
                  </div>
                  <p className="relative mt-6 font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                    {text.subtitle}
                  </p>
                  <h3 className="ethos-display relative mt-1 text-2xl">{text.title}</h3>
                  <p className="relative mt-4 text-sm leading-7 text-text">{text.description}</p>
                  <ul className="relative mt-5 space-y-2.5">
                    {text.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2.5 text-sm text-text-muted">
                        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <div className="relative mt-auto flex items-center justify-between pt-6">
                    <span className="inline-flex items-center gap-1 font-serif text-sm font-semibold text-primary transition-colors group-hover:text-gold-deep">
                      {tt("practiceDetail", t.practiceDetail)}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold-soft/30 px-3 py-1.5 font-serif text-xs font-bold text-gold-deep transition-colors group-hover:bg-gold-soft/60">
                      {tt("practiceConsult", t.practiceConsult)}
                    </span>
                  </div>
                </Link>
              </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━ 의뢰인 여정 ② 믿을 수 있는가 — 차별화·프로필·후기 ━━━━━━━━━━━━━━━ */}
      {/* ═══════════════ 왜 ETHOS인가 — 차별화 스트립 ═══════════════ */}
      <section className="py-24 sm:py-28" aria-labelledby="why-ethos-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Why ETHOS</p>
            <h2 id="why-ethos-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
              {tt("whyTitle", t.whyTitle)}
            </h2>
            <p className="mt-4 text-sm text-text-muted">{tt("whySubtitle", t.whySubtitle)}</p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyCards.map((card, i) => (
              <Reveal key={card.title} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
                <div className="ethos-card ethos-card-hover ethos-card-topline flex h-full flex-col p-7">
                  <h3 className="ethos-display text-xl leading-snug">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-text">{card.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 대표 행정사 프로필 ═══════════════ */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28" aria-labelledby="lead-attorney-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* 대표 사진 슬롯: image.aboutPhoto 설정 시 인물 사진 + 텍스트 2단,
              미설정 시 텍스트만 1단(회귀 없음). */}
          <div
            className={
              aboutPhoto
                ? "mx-auto grid max-w-5xl items-center gap-10 sm:gap-14 lg:grid-cols-[0.8fr_1.2fr]"
                : "mx-auto max-w-3xl"
            }
          >
            {aboutPhoto && (
              <Reveal className="flex justify-center lg:justify-start">
                <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-[24px] border border-gold/30 shadow-floating">
                  <Image
                    src={aboutPhoto}
                    alt={lang === "en" ? "Lead administrative attorney at ETHOS" : "에토스 대표 행정사"}
                    fill
                    className="object-cover"
                    unoptimized={aboutPhoto.startsWith("http")}
                    sizes="(max-width: 1024px) 20rem, 22rem"
                  />
                </div>
              </Reveal>
            )}
            {/* 우: 이름 · 자격 요약 · CTA */}
            <Reveal delay={1}>
              <div>
                <p className="ethos-eyebrow">Lead Attorney</p>
                <h2 id="lead-attorney-heading" className="ethos-display mt-3 text-3xl sm:text-4xl">
                  {tt("leadTitle", t.leadTitle)}
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-text-muted">
                  {tt("leadDesc", t.leadDesc)}
                </p>
                <ul className="mt-7 space-y-3">
                  {leadBullets.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-text">
                      <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden />
                      <span className="font-semibold">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-9">
                  <Link
                    href={lang === "en" ? "/about?lang=en" : "/about"}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-gold/50 bg-surface px-7 text-sm font-bold text-primary shadow-sm transition-all duration-300 hover:border-gold hover:bg-gold-soft/40"
                  >
                    {tt("profileCta", t.profileCta)}
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 의뢰인 후기 (신뢰 클러스터로 이동) ═══════════════ */}
      <Testimonials items={testimonials} />

      {/* ═══════════════ Naver Place 실제 방문자 후기 ═══════════════ */}
      {/* 위 '의뢰인 후기'와 사회적 증거가 중복되어 기본 OFF (플래그: home_naver_reviews). */}
      {naverReviewsEnabled && <NaverReviewBand />}

      {/* ━━━━━━━━━━━━━━━ 의뢰인 여정 ③ 어떻게 진행되나 — 철학·비용·절차 ━━━━━━━━━━━━━━━ */}
      {/* ═══════════════ 철학 — DARK 풀블리드 밴드 ═══════════════ */}
      <section className="ethos-band ethos-band-dark ethos-grain overflow-hidden py-24 sm:py-32" style={{ backgroundColor: "rgb(22 50 80)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            {/* 좌: 카피 */}
            <Reveal>
              <div>
                <p className="ethos-eyebrow text-gold-soft">Brand Story</p>
                <h2 className="ethos-display mt-5 text-3xl leading-snug text-white sm:text-[2.6rem]">
                  {t.brandHeading[0]}
                  <br />
                  {t.brandHeading[1]}
                  <br />
                  <span className="text-gold-soft">{t.brandHeading[2]}</span>
                </h2>
                {brandStoryParas ? (
                  brandStoryParas.map((para, i) => (
                    <p key={i} className={`max-w-md text-sm leading-8 text-white/75 ${i === 0 ? "mt-7" : "mt-4"}`}>
                      {para}
                    </p>
                  ))
                ) : (
                  <>
                <p className="mt-7 max-w-md text-sm leading-8 text-white/75">
                  {tt("brandPara1", t.brandPara1)}
                </p>
                <p className="mt-4 max-w-md text-sm leading-8 text-white/75">
                  {tt("brandPara2Pre", t.brandPara2Pre)}
                  <span className="ethos-quote mx-1 text-gold-soft">Logos · Pathos · Ethos</span>
                  {tt("brandPara2Post", t.brandPara2Post)}
                </p>
                  </>
                )}
                <p className="ethos-quote mt-8 border-l-2 border-gold/60 pl-5 text-lg text-gold-soft">
                  {tt("brandQuote", t.brandQuote)}
                </p>
              </div>
            </Reveal>

            {/* 우: 3가치 스택 */}
            <div className="space-y-4">
              {PHILOSOPHY.map((p, i) => {
                const text = philosophyItems[i] ?? {
                  title: lang === "en" ? p.titleEn : p.title,
                  description: lang === "en" ? p.descriptionEn : p.description,
                  benefit: lang === "en" ? p.benefitEn : p.benefit
                };
                return (
                <Reveal key={p.greek} delay={(i + 1) as 1 | 2 | 3}>
                  <div className="group flex items-start gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors duration-300 hover:border-gold/40 hover:bg-white/[0.08]">
                    <span className="ethos-quote text-3xl text-gold/40 transition-colors group-hover:text-gold/70">
                      {p.greek}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <h3 className="ethos-display text-2xl text-white">{text.title}</h3>
                        <span className="font-serif text-xs text-white/60">{lang === "en" ? p.koreanEn : p.korean}</span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-white/70">{text.description}</p>
                      <p className="mt-2.5 font-serif text-sm leading-6 text-gold-soft">{text.benefit}</p>
                    </div>
                  </div>
                </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 비용 안내 미니 밴드 — 수임료 계산기 ═══════════════ */}
      <div className="pb-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-gold/30 bg-gold-soft/20 px-8 py-7 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="font-serif text-base font-bold text-primary">{tt("pricingTitle", t.pricingTitle)}</p>
                <p className="mt-1 text-sm text-text-muted">{tt("pricingDesc", t.pricingDesc)}</p>
              </div>
              <Link
                href={lang === "en" ? "/pricing-calculator?lang=en" : "/pricing-calculator"}
                className="ethos-cta-shine inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gold/50 bg-surface px-6 text-sm font-bold text-primary shadow-sm transition hover:border-gold hover:bg-gold-soft/40"
              >
                {tt("pricingCta", t.pricingCta)}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ═══════════════ 진행 절차 — soft band, 타임라인 ═══════════════ */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28" aria-labelledby="process-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Our Process</p>
            <h2 id="process-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
              {tt("processTitle", t.processTitle)}
            </h2>
            <p className="mt-4 text-sm text-text-muted">{tt("processSubtitle", t.processSubtitle)}</p>
          </Reveal>

          <div className="relative mt-16">
            {/* 타임라인 라인 */}
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 lg:block" aria-hidden />
            <div className="grid gap-8 lg:grid-cols-5">
              {processSteps.map((step, idx) => (
                <Reveal key={step.step} delay={((idx % 4) + 1) as 1 | 2 | 3 | 4}>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-surface font-serif text-sm font-bold text-primary shadow-sm">
                      {step.step}
                    </div>
                    <h3 className="ethos-display mt-5 text-lg">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 절차 후 CTA ═══════════════ */}
      {/* 하단 최종 CTA와 중복되어 기본 OFF (플래그: home_process_cta). */}
      {processCtaEnabled && (
      <div className="py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-gold/30 bg-gold-soft/20 px-8 py-7 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="font-serif text-base font-bold text-primary">이 절차를 지금 시작하고 싶으신가요?</p>
                <p className="mt-1 text-sm text-text-muted">사실관계 확인부터 시작합니다. 5분이면 충분합니다.</p>
              </div>
              <Link
                href={intakeHref}
                className="ethos-cta-shine inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-text-strong"
              >
                무료 검토 신청 →
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
      )}

      {/* 진행 추적은 헤더 메뉴로도 가능하고 운영원칙은 소개 페이지와 중복되어 기본 OFF (플래그: home_tracking_principles). */}
      {trackingPrinciplesEnabled && (
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
                <p className="relative mt-4 text-sm leading-7 text-text">
                  접수 후 받은 접수번호로 자료요청, 검토 중 상태, 다음 안내를 한곳에서 확인하실 수 있습니다.
                </p>
                <div className="relative mt-8">
                  <PrimaryCta href="/portal">포털 · 진행조회</PrimaryCta>
                </div>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div>
                <p className="ethos-eyebrow">Office Principles</p>
                <h2 className="ethos-display mt-4 text-2xl">{tt("officeTitle", t.officeTitle)}</h2>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {t.officeCards.map((p) => (
                    <div
                      key={p.title}
                      className="rounded-xl border-l-2 border-gold/50 bg-surface-muted/40 px-5 py-4 transition-colors hover:bg-surface-muted/70"
                    >
                      <p className="font-serif text-sm font-bold text-primary">{p.title}</p>
                      <p className="mt-1.5 text-sm leading-6 text-text-muted">{p.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="ethos-quote mt-5 text-xs leading-5 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      )}

      {/* 상담 구조 */}
      {/* '진행 절차' 섹션과 겹쳐 기본 OFF (플래그: home_consult_structure). */}
      {consultStructureEnabled && <ConsultStructure />}

      {/* ━━━━━━━━━━━━━━━ 의뢰인 여정 ④ 지금 시작 — 블로그·뉴스레터·FAQ·상담 ━━━━━━━━━━━━━━━ */}
      {/* ═══════════════ 글 채널 — 법률 칼럼 + LinkedIn ═══════════════ */}
      {/* 예전의 '네이버 블로그 최신글'은 /blog(법률 칼럼)와 같은 글을 실시간으로
          다시 보여줘 중복이었고, 방문자를 네이버로 내보내 자사 도메인 SEO 자산을
          깎았다. 글은 /blog 하나로 모으고 영문 독자용 LinkedIn 을 함께 안내한다. */}
      {/* 홈 블로그 쇼케이스 — 네이버 자동수입 최신글 + 카드뉴스 커버(자사 도메인) */}
      <HomeBlogShowcase posts={showcasePosts} lang={lang === "en" ? "en" : "ko"} />

      {/* 최신 관보 티저 — 봇 미설정/실패/빈응답이면 스스로 숨김(홈 안 깨짐) */}
      <HomeGazetteTeaser lang={lang === "en" ? "en" : "ko"} />

      {/* ═══════════════ 신뢰 뱃지 벨트 (기능 플래그: trust_belt) ═══════════════ */}
      {trustBeltEnabled && <TrustBelt />}

      {/* ═══════════════ Newsletter ═══════════════ */}
      {/* 이메일 발송 수단 미설정으로 기본 OFF (플래그: home_newsletter). */}
      {newsletterEnabled && <NewsletterWidget />}

      {/* ═══════════════ FAQ — soft band ═══════════════ */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28" aria-labelledby="home-faq-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">FAQ</p>
            <h2 id="home-faq-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
              {tt("faqTitle", t.faqTitle)}
            </h2>
          </Reveal>

          <FaqAccordion items={faqItems} />

          <Reveal>
            <div className="mt-12 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-text-muted">{tt("faqMore", t.faqMore)}</p>
              <Link
                href={intakeHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-sm font-bold text-white shadow-sm transition hover:bg-text-strong"
              >
                {tt("ctaFreeReview", t.ctaFreeReview)} →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 지역별 안내 그리드 (기능 플래그: local_landing_grid) ═══════════════ */}
      {localGridEnabled && <LocalLandingGrid />}

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div
              className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 p-12 shadow-floating sm:p-16"
              style={{
                backgroundColor: "rgb(22 50 80)",
                backgroundImage: "linear-gradient(135deg, rgb(22 50 80) 0%, rgb(18 40 65) 50%, rgb(12 28 48) 100%)"
              }}>
              <svg className="absolute -right-20 -top-20 h-80 w-80 text-gold/15" viewBox="0 0 200 200" fill="none" aria-hidden>
                <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" />
                <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.7" />
                <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" />
              </svg>

              <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-gold">Begin Your Story</p>
                  <h2 className="ethos-display mt-4 text-3xl font-bold text-white drop-shadow-sm sm:text-[2.6rem]">
                    {tt("finalCtaTitle", t.finalCtaTitle)}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-8 text-white">
                    {tt("finalCtaDescription", t.finalCtaDescription)}
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="h-px w-10 bg-gold/60" aria-hidden />
                    <p className="font-serif text-sm font-bold italic tracking-wide text-gold">
                      Reason in Process · Empathy for People · Trust in Every Step.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href={intakeHref}
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-gold px-7 text-sm font-bold text-primary shadow-md transition-all duration-300 hover:bg-gold-soft hover:shadow-lg"
                  >
                    {tt("ctaFreeReview", t.ctaFreeReview)}
                  </Link>
                  <Link
                    href="/portal"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-gold/60 bg-transparent px-7 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
                  >
                    {tt("ctaTrack", t.ctaTrack)}
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
