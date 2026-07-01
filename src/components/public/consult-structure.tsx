import Link from "next/link";

import { CHANNELS } from "@/lib/constants/channels";
import { Reveal } from "@/components/public/reveal";

const STEPS = [
  {
    no: "01",
    badge: "무료",
    badgeBg: "bg-emerald-100",
    badgeFg: "text-emerald-800",
    title: "검토",
    sub: "Free Review",
    desc: "가능 여부 + 견적 범위 + 핵심 질문 1~2가지 답변",
    channels: ["네이버 톡톡", "카카오", "이메일", "텔레그램"]
  },
  {
    no: "02",
    badge: "유료",
    badgeBg: "bg-gold-soft/60",
    badgeFg: "text-gold-deep",
    title: "상담",
    sub: "Paid Consultation",
    desc: "전략 수립 · 서류 설계 · 리스크 분석 · 개별 법령 해석",
    range: "33,000원 ~ 55,000원",
    channels: ["네이버 엑스퍼트"]
  },
  {
    no: "03",
    badge: "수임 시",
    badgeBg: "bg-primary",
    badgeFg: "text-white",
    title: "수임 확정",
    sub: "Engagement",
    desc: "상담료 전액 본 수임료에서 차감",
    note: "변호사 선임 대비 1/3~1/5 비용 수준"
  }
] as const;

export function ConsultStructure() {
  return (
    <section className="py-24 sm:py-28" aria-labelledby="consult-structure-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="ethos-eyebrow">Consultation Structure</p>
          <h2 id="consult-structure-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
            상담 구조
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
            검토는 무료입니다. 본격적 상담은 유료로 진행하며, 수임 시 상담료는 전액 차감됩니다.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.no} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="ethos-card ethos-card-hover relative flex h-full flex-col overflow-hidden p-8">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
                <div className="flex items-start justify-between">
                  <span className="ethos-index text-5xl">{step.no}</span>
                  <span className={`rounded-full ${step.badgeBg} px-3 py-1 text-xs font-bold ${step.badgeFg}`}>
                    {step.badge}
                  </span>
                </div>
                <p className="mt-6 font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">{step.sub}</p>
                <h3 className="ethos-display mt-1 text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text">{step.desc}</p>

                {"range" in step && step.range && (
                  <p className="mt-4 rounded-lg bg-gold-soft/40 px-3 py-2 font-serif text-sm font-bold text-gold-deep">
                    {step.range}
                  </p>
                )}
                {"note" in step && step.note && (
                  <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                    {step.note}
                  </p>
                )}
                {"channels" in step && step.channels && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {step.channels.map((c) => (
                      <span key={c} className="rounded-full border border-gold/30 bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* 검토 채널 CTA */}
        <Reveal>
          <div className="mt-12 rounded-2xl border border-gold/30 bg-gold-soft/15 p-6 sm:p-8">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-serif text-base font-bold text-primary">지금 무료 검토 요청하기</p>
                <p className="mt-1 text-sm text-text-muted">아래 채널 중 편한 곳으로 연락 주세요. 영업일 기준 24시간 내 회신드립니다.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={CHANNELS.naverTalk.url} target="_blank" rel="noreferrer"
                   className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#03C75A] px-4 text-sm font-bold text-white transition hover:brightness-95">
                  네이버 톡톡
                </a>
                <a href={CHANNELS.kakao.url} target="_blank" rel="noreferrer"
                   className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#FEE500] px-4 text-sm font-bold text-[#3C1E1E] transition hover:brightness-95">
                  카카오
                </a>
                <a href={CHANNELS.telegram.url} target="_blank" rel="noreferrer"
                   className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0088CC] px-4 text-sm font-bold text-white transition hover:brightness-95">
                  텔레그램
                </a>
                <a href={CHANNELS.email.url}
                   className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:bg-text-strong">
                  이메일
                </a>
                <Link href="/intake"
                   className="inline-flex h-11 items-center gap-2 rounded-lg border border-gold/40 bg-surface px-4 text-sm font-bold text-primary transition hover:bg-gold-soft/30">
                  상담 신청서
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
