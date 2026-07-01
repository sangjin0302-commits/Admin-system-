import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { ConsultStructure } from "@/components/public/consult-structure";
import { BookingWidget } from "@/components/public/booking-widget";
import { DeadlineReminderBand } from "@/components/public/deadline-reminder-band";
import { ConsultSlotAvailability } from "@/components/public/consult-slot-availability";
import { CHANNELS, CONSULT_TAGLINE } from "@/lib/constants/channels";
import { FAQJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "상담 안내 — 무료 검토 · 유료 상담 · 수임 시 차감 | ETHOS",
  description:
    "ETHOS 행정사사무소의 상담 구조 안내. 검토는 무료, 본격 상담은 유료(33,000~55,000원), 수임 확정 시 상담료 전액 차감."
};

const REVIEW_INCLUDES = [
  "가능 여부 확인",
  "견적·비용 범위 안내",
  "핵심 질문 1~2가지 답변",
  "에토스 업무 범위 여부 판단"
];

const CONSULT_INCLUDES = [
  "전략 수립 (절차 선택)",
  "서류 설계 (필요 자료 리스트)",
  "개별 법령 해석",
  "리스크 분석 · 대응 방향",
  "복잡한 사실관계 정리"
];

const TEMPLATE = `안녕하세요, 행정사 Jean입니다.

[검토 결과]
→ [가능 / 추가 확인 필요 / 에토스 업무 범위 외]
→ 견적 범위: [해당 시 안내]

구체적인 전략·서류 설계·리스크 분석은 유료 상담에서 진행합니다.
상담료는 문의 주시면 안내드리며, 수임 시 전액 차감됩니다.`;

const FAQ_QA = [
  { question: "검토는 정말 무료인가요?", answer: "네. 가능 여부와 견적 범위, 핵심 질문 1~2가지에 대한 답변은 무료로 제공됩니다. 모든 채널(톡톡, 카카오, 이메일, 텔레그램) 동일하게 적용됩니다." },
  { question: "유료 상담 비용은 얼마인가요?", answer: "사안 복잡도에 따라 33,000원에서 55,000원 사이로 책정되며, 수임 확정 시 상담료는 전액 본 수임료에서 차감됩니다." },
  { question: "검토와 상담의 차이는 무엇인가요?", answer: "검토는 가능 여부와 견적 안내 등 간단한 확인입니다. 본격적인 전략 수립, 서류 설계, 리스크 분석은 유료 상담에서 진행됩니다." },
  { question: "변호사 선임 대비 비용 차이는?", answer: "행정사 업무 범위 내에서는 변호사 선임 대비 약 1/3 ~ 1/5 수준의 비용으로 해결 가능합니다." },
  { question: "외국어 상담이 가능한가요?", answer: "한국어, 영어, 아랍어로 상담 가능합니다. 다국어 서류 검토와 번역도 함께 진행할 수 있습니다." }
];

export default function ConsultPage() {
  return (
    <div className="overflow-x-clip">
      <FAQJsonLd qa={FAQ_QA} />
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Consultation</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">상담 안내</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-text-muted">
              {CONSULT_TAGLINE}
            </p>
          </Reveal>
          <Reveal delay={3}>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gold-deep">
              변호사 선임 대비 1/3~1/5 비용 수준으로 해결합니다.
            </p>
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
            <p className="ethos-eyebrow">Free vs Paid</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">검토와 상담의 범위</h2>
          </Reveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <Reveal delay={1}>
              <div className="ethos-card relative h-full overflow-hidden p-9">
                <div className="absolute right-5 top-5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  무료
                </div>
                <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-emerald-700">FREE REVIEW</p>
                <h3 className="ethos-display mt-2 text-2xl">검토 범위</h3>
                <p className="mt-3 text-sm text-text-muted">아래 항목만 무료로 제공됩니다.</p>
                <ul className="mt-6 space-y-3">
                  {REVIEW_INCLUDES.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-text">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  채널 무관 (톡톡·카카오·이메일·텔레그램) 동일 적용
                </p>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <div className="ethos-card relative h-full overflow-hidden p-9">
                <div className="absolute right-5 top-5 rounded-full bg-gold-soft/60 px-3 py-1 text-xs font-bold text-gold-deep">
                  유료
                </div>
                <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">PAID CONSULTATION</p>
                <h3 className="ethos-display mt-2 text-2xl">상담 범위</h3>
                <p className="mt-3 text-sm text-text-muted">아래 항목부터 유료 상담으로 진행됩니다.</p>
                <ul className="mt-6 space-y-3">
                  {CONSULT_INCLUDES.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-text">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-soft/60 text-xs font-bold text-gold-deep">★</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 rounded-lg bg-gold-soft/30 px-3 py-2 text-xs font-bold text-gold-deep">
                  33,000원 ~ 55,000원 · 수임 확정 시 전액 차감
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
            <p className="ethos-eyebrow">Response Template</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">검토 응답은 이렇게 받으십니다</h2>
            <p className="mt-4 text-sm text-text-muted">
              어느 채널로 검토를 요청하셔도 동일한 형식으로 답변드립니다. (투명성 보장)
            </p>
          </Reveal>

          <Reveal delay={1}>
            <div className="ethos-grain mt-12 overflow-hidden rounded-[24px] border border-gold/30 ethos-dark-card-v p-8 shadow-floating sm:p-10">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
              <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-soft">SAMPLE RESPONSE</p>
              <pre className="mt-5 whitespace-pre-wrap font-mono text-sm leading-7 text-white/90">{TEMPLATE}</pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA — 5채널 */}
      <section className="ethos-band ethos-band-soft py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="text-center">
            <h2 className="ethos-display text-2xl sm:text-3xl">지금 무료 검토 요청하기</h2>
            <p className="mt-3 text-sm text-text-muted">편한 채널을 선택해주세요. 영업일 기준 24시간 내 회신.</p>
          </Reveal>

          <Reveal delay={1}>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <a href={CHANNELS.naverTalk.url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-3 rounded-2xl bg-[#03C75A] px-5 py-4 text-white transition hover:brightness-95">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-lg font-black">N</span>
                <span><span className="block font-serif text-base font-bold">네이버 톡톡</span><span className="block text-xs opacity-90">가장 빠른 검토</span></span>
              </a>
              <a href={CHANNELS.kakao.url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-3 rounded-2xl bg-[#FEE500] px-5 py-4 text-[#3C1E1E] transition hover:brightness-95">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3C1E1E]/10 text-lg">💬</span>
                <span><span className="block font-serif text-base font-bold">카카오 채팅</span><span className="block text-xs opacity-90">카카오로 검토 요청</span></span>
              </a>
              <a href={CHANNELS.telegram.url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-3 rounded-2xl bg-[#0088CC] px-5 py-4 text-white transition hover:brightness-95">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-lg">✈</span>
                <span><span className="block font-serif text-base font-bold">텔레그램</span><span className="block text-xs opacity-90">{CHANNELS.telegram.value}</span></span>
              </a>
              <a href={CHANNELS.email.url}
                 className="flex items-center gap-3 rounded-2xl bg-primary px-5 py-4 text-white transition hover:bg-text-strong">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-lg">✉</span>
                <span><span className="block font-serif text-base font-bold">이메일</span><span className="block text-xs opacity-90">{CHANNELS.email.value}</span></span>
              </a>
              <a href={CHANNELS.naverExpert.url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-3 rounded-2xl border-2 border-gold/50 bg-surface px-5 py-4 text-primary transition hover:bg-gold-soft/30">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-soft text-lg text-gold-deep">★</span>
                <span><span className="block font-serif text-base font-bold">네이버 엑스퍼트</span><span className="block text-xs text-text-muted">유료 상담 33,000~55,000원</span></span>
              </a>
              <Link href="/intake"
                 className="flex items-center gap-3 rounded-2xl border-2 border-gold/50 bg-surface px-5 py-4 text-primary transition hover:bg-gold-soft/30">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-soft text-lg text-gold-deep">📋</span>
                <span><span className="block font-serif text-base font-bold">상담 신청서</span><span className="block text-xs text-text-muted">웹폼으로 검토 요청</span></span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 상담 예약 */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Booking</p>
            <h2 className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">상담 예약</h2>
            <p className="mt-3 text-sm text-text-muted">원하시는 날짜와 시간을 선택하면 접수 폼에 자동 연결됩니다.</p>
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
            <p className="ethos-eyebrow">FAQ</p>
            <h2 className="ethos-display mt-4 text-3xl">자주 묻는 질문</h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {FAQ_QA.map((item) => (
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
