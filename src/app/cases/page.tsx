import Link from "next/link";
import type { Metadata } from "next";

import { CasesGrid } from "@/components/public/cases-grid";
import { Reveal } from "@/components/public/reveal";
import { PUBLIC_CASES } from "@/lib/public-cases";

export const metadata: Metadata = {
  title: "처리 사례 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소의 익명화된 처리 사례 모음."
};

export default function CasesPage() {
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Case Studies</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">처리 사례</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-text-muted">
              익명화된 처리 사례를 분야별로 정리했습니다. 사안마다 진행 절차와 결과는 다를 수 있으며,
              개별 사안의 결과를 보장하지 않습니다.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 필터 + 그리드 */}
      <section className="py-12 sm:py-16">
        <CasesGrid cases={PUBLIC_CASES} />
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-primary via-primary to-text-strong p-12 text-center shadow-floating sm:p-16">
              <p className="ethos-eyebrow text-gold-soft">Your Case</p>
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">비슷한 사안이 있으신가요?</h2>
              <Link
                href="/intake"
                className="mt-9 inline-flex h-12 items-center rounded-lg bg-gold px-8 text-sm font-bold text-primary transition hover:bg-gold-soft"
              >
                상담 신청하기
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
