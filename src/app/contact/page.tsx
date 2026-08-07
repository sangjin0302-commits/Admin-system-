import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { getSiteSettings } from "@/lib/services/site-settings";
import { getRequestLocale, isLegacyLangEn } from "@/lib/i18n-request";
import { localePath } from "@/lib/i18n-locale";

export const dynamic = "force-dynamic";

const COPY = {
  ko: {
    metaTitle: "오시는 길 — 에토스 행정사사무소(ETHOS)",
    metaDescription: "에토스 행정사사무소 위치, 연락처, 운영시간 안내.",
    heroEyebrow: "Contact",
    heroTitle: "오시는 길",
    heroSubtitle: "상담은 사전 예약을 권장드립니다.",
    responseBadge: "평균 1시간 내 응답 · 영업일 기준",
    contactEyebrow: "Contact",
    contactTitle: "연락처",
    phoneLabel: "전화",
    emailLabel: "이메일",
    kakaoLabel: "카카오톡",
    kakaoButton: "카카오 채널 상담",
    hoursLabel: "운영시간",
    hoursNote: "주말 / 공휴일 휴무 (사전 예약 시 가능)",
    intakeButton: "온라인 상담 신청",
    locationEyebrow: "Location",
    locationTitle: "사무소 위치",
    addressLabel: "주소",
    transitNote: "교통편은 상담 예약 시 안내드립니다.",
    mapPlaceholderTitle: "사무소 위치",
    mapPlaceholderNote: "상담 예약 시 상세 위치를 안내드립니다",
    kakaoMapButton: "오시는 길 (카카오맵) →",
    kakaoMapShort: "카카오맵 보기",
    naverMapShort: "네이버 지도"
  },
  en: {
    metaTitle: "Directions — ETHOS Administrative Attorney Office",
    metaDescription: "Location, contact details, and office hours for ETHOS Administrative Attorney Office.",
    heroEyebrow: "Contact",
    heroTitle: "Directions",
    heroSubtitle: "We recommend booking a consultation in advance.",
    responseBadge: "Average reply within 1 hour · Business days",
    contactEyebrow: "Contact",
    contactTitle: "Contact",
    phoneLabel: "Phone",
    emailLabel: "Email",
    kakaoLabel: "KakaoTalk",
    kakaoButton: "Chat via Kakao Channel",
    hoursLabel: "Office Hours",
    hoursNote: "Closed weekends / holidays (available by appointment)",
    intakeButton: "Request a Consultation Online",
    locationEyebrow: "Location",
    locationTitle: "Office Location",
    addressLabel: "Address",
    transitNote: "Directions are provided when you book a consultation.",
    mapPlaceholderTitle: "Office Location",
    mapPlaceholderNote: "The exact location is shared when you book a consultation",
    kakaoMapButton: "Directions (Kakao Map) →",
    kakaoMapShort: "View on Kakao Map",
    naverMapShort: "Naver Map"
  }
} as const;

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const lang = await getRequestLocale((await searchParams).lang);
  const t = COPY[lang];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function ContactPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  // 레거시 ?lang=en → 경로기반 /en/contact 로 301. /en 서빙 중이면 스킵(루프 방지).
  if (await isLegacyLangEn(sp.lang)) {
    redirect(localePath("/contact", "en"));
  }
  const lang = await getRequestLocale(sp.lang);
  const t = COPY[lang];
  const site = await getSiteSettings();
  const phone = site["contact.phone"];
  const phoneTel = phone.replace(/[^0-9]/g, "");
  const email = site["contact.email"];
  const address = site["trust.officeAddress"] || site["contact.address"];
  const hours = site["contact.hours"];
  const kakaoUrl = site["contact.kakaoUrl"];
  const kakaoMapUrl = site["trust.kakaoMapUrl"];

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">{t.heroEyebrow}</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">{t.heroTitle}</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="ethos-quote mt-5 text-base text-gold-deep">{t.heroSubtitle}</p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t.responseBadge}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 연락처 + 지도 */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-7 lg:grid-cols-[1fr_1.3fr]">
            {/* 연락처 — DARK card */}
            <Reveal>
              <div className="ethos-band-dark ethos-grain rounded-[24px] p-9 text-white shadow-floating" style={{ backgroundColor: "rgb(22 50 80)" }}>
                <p className="ethos-eyebrow text-gold-soft">{t.contactEyebrow}</p>
                <h2 className="ethos-display mt-3 text-2xl text-white">{t.contactTitle}</h2>

                <div className="mt-8 space-y-6">
                  <div>
                    <p className="font-serif text-xs uppercase tracking-wider text-gold-soft">{t.phoneLabel}</p>
                    <a href={`tel:${phoneTel}`} className="mt-1 block font-serif text-3xl font-bold text-white">
                      {phone}
                    </a>
                  </div>
                  <div>
                    <p className="font-serif text-xs uppercase tracking-wider text-gold-soft">{t.emailLabel}</p>
                    <a href={`mailto:${email}`} className="mt-1 block text-base text-white hover:text-gold-soft">
                      {email}
                    </a>
                  </div>
                  <div>
                    <p className="font-serif text-xs uppercase tracking-wider text-gold-soft">{t.kakaoLabel}</p>
                    <a
                      href={kakaoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-bold text-[#3C1E1E]"
                    >
                      {t.kakaoButton}
                    </a>
                  </div>
                  <div>
                    <p className="font-serif text-xs uppercase tracking-wider text-gold-soft">{t.hoursLabel}</p>
                    <p className="mt-1 text-base text-white">{hours}</p>
                    <p className="text-xs text-white/60">{t.hoursNote}</p>
                  </div>
                </div>

                <Link
                  href={localePath("/intake", lang)}
                  className="mt-10 inline-flex h-11 w-full items-center justify-center rounded-lg bg-gold text-sm font-bold text-primary transition hover:bg-gold-soft"
                >
                  {t.intakeButton}
                </Link>
              </div>
            </Reveal>

            {/* 주소 + 지도 */}
            <Reveal delay={1}>
              <div className="ethos-card p-9">
                <p className="ethos-eyebrow">{t.locationEyebrow}</p>
                <h2 className="ethos-display mt-3 text-2xl">{t.locationTitle}</h2>
                <div className="mt-7 space-y-2">
                  <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">{t.addressLabel}</p>
                  <p className="text-base text-text-strong">{address}</p>
                  <p className="text-sm text-text-muted">{t.transitNote}</p>
                </div>

                <div className="mt-7 flex aspect-video items-center justify-center rounded-xl border border-gold/30 bg-gradient-to-br from-primary/5 to-gold/5">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <svg viewBox="0 0 48 48" width="48" height="48" className="text-primary/20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path d="M24 4C15.2 4 8 10.7 8 19c0 12 16 25 16 25s16-13 16-25c0-8.3-7.2-15-16-15z" />
                      <circle cx="24" cy="19" r="5" />
                    </svg>
                    <div>
                      <p className="font-serif text-sm font-bold text-text-muted">{t.mapPlaceholderTitle}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{t.mapPlaceholderNote}</p>
                    </div>
                  </div>
                </div>

                {kakaoMapUrl && (
                  <a
                    href={kakaoMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-white transition hover:bg-[#143d5d]"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 2C7.6 2 4 5.4 4 9.5 4 15.5 12 22 12 22s8-6.5 8-12.5C20 5.4 16.4 2 12 2z" />
                      <circle cx="12" cy="9.5" r="2.5" />
                    </svg>
                    {t.kakaoMapButton}
                  </a>
                )}

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <a
                    href={kakaoMapUrl || "https://map.kakao.com"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-gold/40 bg-surface text-xs font-bold text-primary transition hover:bg-gold-soft/30"
                  >
                    {t.kakaoMapShort}
                  </a>
                  <a
                    href="https://map.naver.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-gold/40 bg-surface text-xs font-bold text-primary transition hover:bg-gold-soft/30"
                  >
                    {t.naverMapShort}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
