import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { PUBLIC_CASES } from "@/lib/public-cases";

export const metadata: Metadata = {
  title: "처리 사례 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소의 익명화된 처리 사례 모음."
};

const CATEGORY_COLORS: Record<string, string> = {
  VISA_STAY: "bg-emerald-100 text-emerald-800",
  ADMIN_APPEAL: "bg-amber-100 text-amber-800",
  CONTRACT_INVESTIGATION: "bg-sky-100 text-sky-800",
  LICENSE_PERMIT: "bg-violet-100 text-violet-800"
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

      {/* 카테고리 칩 */}
      <section className="pb-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap justify-center gap-2">
              {["전체", "비자/체류", "행정심판", "계약서/사실조사", "인허가"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-gold/40 bg-surface px-4 py-1.5 font-serif text-xs font-semibold text-primary"
                >
                  {label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 사례 그리드 */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_CASES.map((c, idx) => (
              <Reveal key={c.slug} delay={((idx % 3) + 1) as 1 | 2 | 3}>
                <Link href={`/cases/${c.slug}`} className="group block h-full">
                  <div className="ethos-card ethos-card-hover ethos-card-topline flex h-full flex-col p-7">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${CATEGORY_COLORS[c.category]}`}>
                        {c.categoryLabel}
                      </span>
                      <span className="ethos-quote text-xs text-text-muted">CASE {String(idx + 1).padStart(3, "0")}</span>
                    </div>
                    <h3 className="ethos-display mt-6 text-xl leading-snug group-hover:text-gold-deep">
                      {c.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-7 text-text-muted">{c.summary}</p>
                    <div className="mt-6 space-y-3 border-t border-gold/15 pt-5 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-gold" />
                        <div>
                          <span className="font-bold text-text-strong">진행 결과: </span>
                          <span className="text-text-muted">{c.outcome}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-gold" />
                        <div>
                          <span className="font-bold text-text-strong">소요 기간: </span>
                          <span className="text-text-muted">{c.duration}</span>
                        </div>
                      </div>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1 font-serif text-sm font-semibold text-primary group-hover:text-gold-deep">
                      상세 보기
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
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
