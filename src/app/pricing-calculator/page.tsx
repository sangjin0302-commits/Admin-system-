import type { Metadata } from "next";

import { PricingCalculator } from "@/components/public/pricing-calculator";
import { Reveal } from "@/components/public/reveal";

export const metadata: Metadata = {
  title: "예상 수임료 계산 — ETHOS 행정사사무소",
  description:
    "분야·복잡도·긴급도만 선택하면 행정사 예상 수임료 범위를 30초 만에 확인할 수 있습니다. 상담료는 수임 확정 시 전액 차감되며, 정확한 금액은 무료 검토 후 확정됩니다.",
};

const TRUST_BLOCKS: readonly { eyebrow: string; title: string; desc: string }[] = [
  {
    eyebrow: "COST EFFICIENCY",
    title: "변호사 대비 절감",
    desc: "행정 절차·인허가·불복 사안은 행정사 업무 범위 내에서 합리적인 비용으로 진행할 수 있습니다. 불필요한 절차 없이 필요한 만큼만 산정합니다.",
  },
  {
    eyebrow: "CREDITED CONSULT",
    title: "상담료 차감 구조",
    desc: "본격 상담료(33,000~55,000원)는 수임이 확정되면 수임료에서 전액 차감됩니다. 검토 단계에서 부담 없이 방향을 잡으실 수 있습니다.",
  },
  {
    eyebrow: "NO HIDDEN COST",
    title: "숨은 비용 없음",
    desc: "번역·공증 등 부수 작업이 필요한 경우 착수 전에 미리 안내드립니다. 진행 도중 예상하지 못한 비용이 추가되지 않도록 합니다.",
  },
];

export default function PricingCalculatorPage() {
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Fee Estimator</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.4rem]">
              30초 만에 예상 수임료를 확인하세요
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-text-muted">
              행정사 수임료가 궁금하셨나요? 분야·복잡도만 선택하면 대략적인 범위를 안내합니다.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <PricingCalculator />
          </Reveal>
        </div>
      </section>

      {/* WHY THIS COST — trust block */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Why This Cost</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">왜 이 비용인가</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
              투명한 비용 구조로 안내드립니다. 아래 세 가지 원칙을 지킵니다.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {TRUST_BLOCKS.map((b, i) => (
              <Reveal key={b.title} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <div className="ethos-card h-full p-7">
                  <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                    {b.eyebrow}
                  </p>
                  <h3 className="ethos-display mt-2 text-xl">{b.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-text-muted">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="ethos-quote mx-auto mt-10 max-w-3xl text-center text-xs italic text-text-muted">
            ※ 본 계산은 참고용 예상 범위이며 실제 견적과 다를 수 있습니다. 정확한 금액은 무료 검토 후 확정됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
