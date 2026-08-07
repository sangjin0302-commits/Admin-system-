import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { getRequestLocale, isLegacyLangEn } from "@/lib/i18n-request";
import { localePath } from "@/lib/i18n-locale";
import { ConsultStructure } from "@/components/public/consult-structure";
import { BookingWidget } from "@/components/public/booking-widget";
import { DeadlineReminderBand } from "@/components/public/deadline-reminder-band";
import { QuickConsultForm } from "@/components/public/quick-consult-form";
import { ConsultSlotAvailability } from "@/components/public/consult-slot-availability";
import { CHANNELS, CONSULT_TAGLINE } from "@/lib/constants/channels";
import { FAQJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "상담 안내 — 무료 검토 · 유료 상담 · 수임 시 차감 | ETHOS",
  description:
    "ETHOS 행정사사무소의 상담 구조 안내. 검토는 무료, 본격 상담은 유료(33,000~55,000원), 수임 확정 시 상담료 전액 차감."
};

const REVIEW_INCLUDES_KO = [
  "가능 여부 확인",
  "견적·비용 범위 안내",
  "핵심 질문 1~2가지 답변",
  "에토스 업무 범위 여부 판단"
];

const REVIEW_INCLUDES_EN = [
  "Feasibility check",
  "Estimate / cost range guidance",
  "Answers to 1-2 key questions",
  "Determination of whether it falls within ETHOS's scope"
];

const CONSULT_INCLUDES_KO = [
  "전략 수립 (절차 선택)",
  "서류 설계 (필요 자료 리스트)",
  "개별 법령 해석",
  "리스크 분석 · 대응 방향",
  "복잡한 사실관계 정리"
];

const CONSULT_INCLUDES_EN = [
  "Strategy planning (choosing a procedure)",
  "Document design (required materials list)",
  "Case-specific statutory interpretation",
  "Risk analysis and response direction",
  "Organizing complex factual matters"
];

const TEMPLATE_KO = `안녕하세요, 행정사 지상진입니다.

[검토 결과]
→ [가능 / 추가 확인 필요 / 에토스 업무 범위 외]
→ 견적 범위: [해당 시 안내]

구체적인 전략·서류 설계·리스크 분석은 유료 상담에서 진행합니다.
상담료는 문의 주시면 안내드리며, 수임 시 전액 차감됩니다.`;

const TEMPLATE_EN = `Hello, this is administrative attorney Jean.

[Review Result]
→ [Feasible / Needs further review / Outside ETHOS's scope]
→ Estimate range: [provided if applicable]

Detailed strategy, document design, and risk analysis are handled in a paid consultation.
Consultation fees are provided on request and fully deducted upon engagement.`;

const COPY = {
  ko: {
    heroEyebrow: "Consultation",
    heroTitle: "상담 안내",
    heroSub: "변호사는 소송·법적 판단, 행정사는 절차 진행을 담당합니다. 역할이 다릅니다.",
    compareEyebrow: "Free vs Paid",
    compareTitle: "검토와 상담의 범위",
    freeBadge: "무료",
    freeKicker: "FREE REVIEW",
    freeTitle: "검토 범위",
    freeIntro: "아래 항목만 무료로 제공됩니다.",
    freeIncludes: REVIEW_INCLUDES_KO,
    freeNote: "채널 무관 (톡톡·카카오·이메일·텔레그램) 동일 적용",
    paidBadge: "유료",
    paidKicker: "PAID CONSULTATION",
    paidTitle: "상담 범위",
    paidIntro: "아래 항목부터 유료 상담으로 진행됩니다.",
    paidIncludes: CONSULT_INCLUDES_KO,
    paidNote: "33,000원 ~ 55,000원 · 수임 확정 시 전액 차감",
    templateEyebrow: "Response Template",
    templateTitle: "검토 응답은 이렇게 받으십니다",
    templateSub: "어느 채널로 검토를 요청하셔도 동일한 형식으로 답변드립니다. (투명성 보장)",
    templateLabel: "SAMPLE RESPONSE",
    template: TEMPLATE_KO,
    channelsTitle: "지금 무료 검토 요청하기",
    channelsSub: "편한 채널을 선택해주세요. 영업일 기준 24시간 내 회신.",
    channelNaverTalkName: "네이버 톡톡",
    channelNaverTalkDesc: "가장 빠른 검토",
    channelKakaoName: "카카오 채팅",
    channelKakaoDesc: "카카오로 검토 요청",
    channelTelegramName: "텔레그램",
    channelEmailName: "이메일",
    channelNaverExpertName: "네이버 엑스퍼트",
    channelNaverExpertDesc: "유료 상담 33,000~55,000원",
    channelFormName: "상담 신청서",
    channelFormDesc: "웹폼으로 검토 요청",
    bookingEyebrow: "Booking",
    bookingTitle: "상담 예약",
    bookingSub: "원하시는 날짜와 시간을 선택하면 접수 폼에 자동 연결됩니다.",
    faqEyebrow: "FAQ",
    faqTitle: "자주 묻는 질문",
    faqQa: [
      { question: "검토는 정말 무료인가요?", answer: "네. 가능 여부와 견적 범위, 핵심 질문 1~2가지에 대한 답변은 무료로 제공됩니다. 모든 채널(톡톡, 카카오, 이메일, 텔레그램) 동일하게 적용됩니다." },
      { question: "유료 상담 비용은 얼마인가요?", answer: "사안 복잡도에 따라 33,000원에서 55,000원 사이로 책정되며, 수임 확정 시 상담료는 전액 본 수임료에서 차감됩니다." },
      { question: "검토와 상담의 차이는 무엇인가요?", answer: "검토는 가능 여부와 견적 안내 등 간단한 확인입니다. 본격적인 전략 수립, 서류 설계, 리스크 분석은 유료 상담에서 진행됩니다." },
      { question: "변호사와 행정사의 차이는?", answer: "소송·법률 판단은 변호사, 행정 절차·서류 업무는 행정사의 영역입니다. 행정사 업무 범위 내 사안은 절차에 맞는 합리적 비용으로 진행하며, 정확한 수임료는 사안 확인 후 사전에 안내드립니다." },
      { question: "외국어 상담이 가능한가요?", answer: "한국어, 영어, 아랍어로 상담 가능합니다. 다국어 서류 검토와 번역도 함께 진행할 수 있습니다." }
    ]
  },
  en: {
    heroEyebrow: "Consultation",
    heroTitle: "Consultation Guide",
    heroSub: "Attorneys handle litigation and legal judgment; administrative attorneys handle procedural work. These are different roles.",
    compareEyebrow: "Free vs Paid",
    compareTitle: "Scope of Review vs Consultation",
    freeBadge: "Free",
    freeKicker: "FREE REVIEW",
    freeTitle: "Review Scope",
    freeIntro: "Only the items below are provided free of charge.",
    freeIncludes: REVIEW_INCLUDES_EN,
    freeNote: "Same across all channels (Naver Talk, KakaoTalk, email, Telegram)",
    paidBadge: "Paid",
    paidKicker: "PAID CONSULTATION",
    paidTitle: "Consultation Scope",
    paidIntro: "The items below require a paid consultation.",
    paidIncludes: CONSULT_INCLUDES_EN,
    paidNote: "KRW 33,000 ~ 55,000 · Fully deducted upon engagement",
    templateEyebrow: "Response Template",
    templateTitle: "How your review response will look",
    templateSub: "Whatever channel you use to request a review, we reply in the same format. (For transparency.)",
    templateLabel: "SAMPLE RESPONSE",
    template: TEMPLATE_EN,
    channelsTitle: "Request a Free Review Now",
    channelsSub: "Choose whichever channel is convenient. Reply within 24 business hours.",
    channelNaverTalkName: "Naver TalkTalk",
    channelNaverTalkDesc: "Fastest review",
    channelKakaoName: "KakaoTalk",
    channelKakaoDesc: "Request a review via KakaoTalk",
    channelTelegramName: "Telegram",
    channelEmailName: "Email",
    channelNaverExpertName: "Naver Expert",
    channelNaverExpertDesc: "Paid consultation, KRW 33,000~55,000",
    channelFormName: "Consultation Form",
    channelFormDesc: "Request a review via web form",
    bookingEyebrow: "Booking",
    bookingTitle: "Book a Consultation",
    bookingSub: "Choose a date and time and it will be linked automatically to the intake form.",
    faqEyebrow: "FAQ",
    faqTitle: "Frequently Asked Questions",
    faqQa: [
      { question: "Is the review really free?", answer: "Yes. Feasibility, an estimate range, and answers to 1-2 key questions are provided free of charge — the same across all channels (Naver TalkTalk, KakaoTalk, email, Telegram)." },
      { question: "How much does the paid consultation cost?", answer: "Depending on complexity, it ranges from KRW 33,000 to 55,000. The full amount is deducted from the final fee if you proceed with engagement." },
      { question: "What is the difference between a review and a consultation?", answer: "A review is a brief check of feasibility and estimate range. In-depth strategy, document design, and risk analysis are handled in a paid consultation." },
      { question: "How are fees determined?", answer: "The administrative scrivener handles procedures within the scope of the Administrative Scrivener Act Article 2. Fees are transparent and quoted per matter." },
      { question: "Is consultation available in other languages?", answer: "Consultations are available in Korean, English, and Arabic. Multilingual document review and translation can also be arranged." }
    ]
  }
} as const;

export default async function ConsultPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  // 레거시 ?lang=en → 경로기반 /en/consult 로 301. /en 서빙 중이면 스킵(루프 방지).
  if (await isLegacyLangEn(sp.lang)) {
    redirect(localePath("/consult", "en"));
  }
  const lang = await getRequestLocale(sp.lang);
  const t = COPY[lang];
  return (
    <div className="overflow-x-clip">
      <FAQJsonLd qa={[...t.faqQa]} />
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">{t.heroEyebrow}</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">{t.heroTitle}</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-text-muted">
              {CONSULT_TAGLINE}
            </p>
          </Reveal>
          <Reveal delay={3}>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gold-deep">
              {t.heroSub}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 퀵 상담폼 — 4필드 */}
      <section className="pb-10">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <Reveal>
            <QuickConsultForm />
          </Reveal>
        </div>
      </section>

      {/* 기한 안내 밴드 */}
      <section className="pb-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <DeadlineReminderBand />
          </Reveal>
        </div>
      </section>

      {/* 상담 구조 */}
      <ConsultStructure />

      {/* 무료 검토 vs 유료 상담 비교 */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">{t.compareEyebrow}</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">{t.compareTitle}</h2>
          </Reveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <Reveal delay={1}>
              <div className="ethos-card relative h-full overflow-hidden p-9">
                <div className="absolute right-5 top-5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  {t.freeBadge}
                </div>
                <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-emerald-700">{t.freeKicker}</p>
                <h3 className="ethos-display mt-2 text-2xl">{t.freeTitle}</h3>
                <p className="mt-3 text-sm text-text-muted">{t.freeIntro}</p>
                <ul className="mt-6 space-y-3">
                  {t.freeIncludes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-text">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  {t.freeNote}
                </p>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <div className="ethos-card relative h-full overflow-hidden p-9">
                <div className="absolute right-5 top-5 rounded-full bg-gold-soft/60 px-3 py-1 text-xs font-bold text-gold-deep">
                  {t.paidBadge}
                </div>
                <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">{t.paidKicker}</p>
                <h3 className="ethos-display mt-2 text-2xl">{t.paidTitle}</h3>
                <p className="mt-3 text-sm text-text-muted">{t.paidIntro}</p>
                <ul className="mt-6 space-y-3">
                  {t.paidIncludes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-text">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-soft/60 text-xs font-bold text-gold-deep">★</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-lg bg-gold-soft/30 px-3 py-2 text-xs font-bold text-gold-deep">
                  {t.paidNote}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 응답 템플릿 (투명성) */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">{t.templateEyebrow}</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">{t.templateTitle}</h2>
            <p className="mt-4 text-sm text-text-muted">
              {t.templateSub}
            </p>
          </Reveal>

          <Reveal delay={1}>
            <div className="ethos-grain mt-12 overflow-hidden rounded-[24px] border border-gold/30 ethos-dark-card-v p-8 shadow-floating sm:p-10">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
              <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-soft">{t.templateLabel}</p>
              <pre className="mt-5 whitespace-pre-wrap font-mono text-sm leading-7 text-white/90">{t.template}</pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA — 5채널 */}
      <section className="ethos-band ethos-band-soft py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="text-center">
            <h2 className="ethos-display text-2xl sm:text-3xl">{t.channelsTitle}</h2>
            <p className="mt-3 text-sm text-text-muted">{t.channelsSub}</p>
          </Reveal>

          <Reveal delay={1}>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a href={CHANNELS.naverTalk.url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-3 rounded-2xl bg-[#03C75A] px-5 py-4 text-white transition hover:brightness-95">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-lg font-black">N</span>
                <span><span className="block font-serif text-base font-bold">{t.channelNaverTalkName}</span><span className="block text-xs opacity-90">{t.channelNaverTalkDesc}</span></span>
              </a>
              <a href={CHANNELS.kakao.url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-3 rounded-2xl bg-[#FEE500] px-5 py-4 text-[#3C1E1E] transition hover:brightness-95">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3C1E1E]/10 text-lg">💬</span>
                <span><span className="block font-serif text-base font-bold">{t.channelKakaoName}</span><span className="block text-xs opacity-90">{t.channelKakaoDesc}</span></span>
              </a>
              <a href={CHANNELS.telegram.url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-3 rounded-2xl bg-[#0088CC] px-5 py-4 text-white transition hover:brightness-95">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-lg">✈</span>
                <span><span className="block font-serif text-base font-bold">{t.channelTelegramName}</span><span className="block text-xs opacity-90">{CHANNELS.telegram.value}</span></span>
              </a>
              <a href={CHANNELS.email.url}
                 className="flex items-center gap-3 rounded-2xl bg-primary px-5 py-4 text-white transition hover:bg-text-strong">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-lg">✉</span>
                <span><span className="block font-serif text-base font-bold">{t.channelEmailName}</span><span className="block text-xs opacity-90">{CHANNELS.email.value}</span></span>
              </a>
              <a href={CHANNELS.naverExpert.url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-3 rounded-2xl border-2 border-gold/50 bg-surface px-5 py-4 text-primary transition hover:bg-gold-soft/30">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-soft text-lg text-gold-deep">★</span>
                <span><span className="block font-serif text-base font-bold">{t.channelNaverExpertName}</span><span className="block text-xs text-text-muted">{t.channelNaverExpertDesc}</span></span>
              </a>
              <Link href={localePath("/intake", lang)}
                 className="flex items-center gap-3 rounded-2xl border-2 border-gold/50 bg-surface px-5 py-4 text-primary transition hover:bg-gold-soft/30">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-soft text-lg text-gold-deep">📋</span>
                <span><span className="block font-serif text-base font-bold">{t.channelFormName}</span><span className="block text-xs text-text-muted">{t.channelFormDesc}</span></span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 상담 예약 */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">{t.bookingEyebrow}</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">{t.bookingTitle}</h2>
            <p className="mt-3 text-sm text-text-muted">{t.bookingSub}</p>
          </Reveal>
          <Reveal delay={1}>
            <div className="mt-8">
              <ConsultSlotAvailability />
            </div>
          </Reveal>
          <Reveal delay={2}>
            <div className="mt-6">
              <BookingWidget />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="ethos-band ethos-band-soft py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">{t.faqEyebrow}</p>
            <h2 className="ethos-display mt-4 text-3xl">{t.faqTitle}</h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {t.faqQa.map((item) => (
              <Reveal key={item.question}>
                <details className="group rounded-2xl border border-gold/30 bg-surface">
                  <summary className="cursor-pointer px-6 py-4 font-serif text-sm font-bold text-primary transition group-open:text-gold-deep">
                    {item.question}
                  </summary>
                  <p className="px-6 pb-5 text-sm leading-7 text-text-muted">{item.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
