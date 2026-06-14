import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";

export const metadata: Metadata = {
  title: "비용 안내 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소의 수임 비용 안내와 결제 방식."
};

type FeeRow = {
  category: string;
  service: string;
  range: string;
  note: string;
};

const FEES: readonly FeeRow[] = [
  { category: "비자/체류", service: "체류 자격 변경", range: "사안별 협의", note: "자격 / 사실관계 검토 후 견적" },
  { category: "비자/체류", service: "체류 기간 연장", range: "사안별 협의", note: "표준 진행 시 정액" },
  { category: "비자/체류", service: "강제퇴거 대응", range: "사안별 협의", note: "긴급도 / 자료 범위에 따라" },
  { category: "행정심판", service: "심판 청구 및 진행", range: "사안별 협의", note: "기본 + 단계별 추가" },
  { category: "행정심판", service: "이의신청", range: "사안별 협의", note: "" },
  { category: "계약서/사실조사", service: "계약서 작성 / 검토", range: "사안별 협의", note: "검토 단독 / 작성 단독 / 통합" },
  { category: "계약서/사실조사", service: "사실조사 보고서", range: "사안별 협의", note: "조사 범위에 따라" },
  { category: "인허가", service: "허가 신청", range: "사안별 협의", note: "허가 유형 / 보완 가능성 검토" },
  { category: "인허가", service: "보완 / 불복 대응", range: "사안별 협의", note: "" }
];

export default function FeesPage() {
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Transparent Fees</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">비용 안내</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-text-muted">
              사안의 복잡도, 자료 범위, 진행 단계에 따라 비용이 달라집니다.
              상담 단계에서 명확한 견적을 안내드립니다.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 표 */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gold/30 bg-surface-muted/60 text-left">
                    <th className="px-6 py-4 font-serif text-xs uppercase tracking-wider text-gold-deep">분야</th>
                    <th className="px-6 py-4 font-serif text-xs uppercase tracking-wider text-gold-deep">업무</th>
                    <th className="px-6 py-4 font-serif text-xs uppercase tracking-wider text-gold-deep">비용 범위</th>
                    <th className="hidden px-6 py-4 font-serif text-xs uppercase tracking-wider text-gold-deep lg:table-cell">
                      비고
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEES.map((f, i) => (
                    <tr key={i} className="border-b border-gold/10 last:border-0 transition hover:bg-gold-soft/15">
                      <td className="px-6 py-4 font-serif text-xs font-bold text-gold-deep">{f.category}</td>
                      <td className="px-6 py-4 font-bold text-text-strong">{f.service}</td>
                      <td className="px-6 py-4 text-text-muted">{f.range}</td>
                      <td className="hidden px-6 py-4 text-xs text-text-muted lg:table-cell">{f.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3 컬럼 원칙 */}
      <section className="ethos-band ethos-band-soft py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { title: "투명한 견적", desc: "상담 후 명확한 견적서를 안내드립니다.", n: "01" },
              { title: "단계별 정산", desc: "착수금 / 중간 / 완수 단계로 나눠 정산합니다.", n: "02" },
              { title: "결제 방법", desc: "계좌 이체 / 카드 / 가상계좌 사용 가능합니다.", n: "03" }
            ].map((p, i) => (
              <Reveal key={p.title} delay={(i + 1) as 1 | 2 | 3}>
                <div className="ethos-card ethos-card-hover relative h-full overflow-hidden p-7">
                  <span className="ethos-index pointer-events-none absolute -right-2 -top-4 select-none">{p.n}</span>
                  <h3 className="ethos-display relative text-xl">{p.title}</h3>
                  <p className="relative mt-4 text-sm leading-7 text-text-muted">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 산정 원칙 */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-card p-9">
              <p className="ethos-eyebrow">Pricing Principles</p>
              <h3 className="ethos-display mt-3 text-2xl">비용 산정 원칙</h3>
              <ul className="mt-7 space-y-3 text-sm leading-8 text-text">
                {[
                  "사안의 복잡도 / 자료 범위 / 긴급도에 따라 사전 협의합니다.",
                  "단계별 진행 시 단계 종료마다 정산을 안내합니다.",
                  "보장의 의미로 해석될 수 있는 표현은 사용하지 않습니다.",
                  "관청 수수료 / 인지대 / 송달료 등 실비는 별도 부과됩니다.",
                  "상담 단계에서 가능한 진행 범위와 한계를 안내합니다."
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 border-l-2 border-gold/40 pl-4">
                    <span className="mt-2.5 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-primary via-primary to-text-strong p-12 text-center shadow-floating sm:p-16">
              <p className="ethos-eyebrow text-gold-soft">Consultation</p>
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">상담 후 견적을 안내드립니다</h2>
              <p className="mt-4 text-sm text-white/80">사안을 듣고 가능한 진행 범위와 비용을 함께 확인합니다.</p>
              <Link
                href="/intake"
                className="mt-9 inline-flex h-12 items-center rounded-lg bg-gold px-8 text-sm font-bold text-primary transition hover:bg-gold-soft"
              >
                상담 신청
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
