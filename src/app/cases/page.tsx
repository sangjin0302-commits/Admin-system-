import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
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
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6 sm:py-20">
      <section className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Case Studies</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-primary sm:text-5xl">처리 사례</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
          익명화된 처리 사례를 분야별로 정리했습니다. 사안마다 진행 절차와 결과는 다를 수 있으며,
          개별 사안의 결과를 보장하지 않습니다.
        </p>
      </section>

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

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PUBLIC_CASES.map((c, idx) => (
          <Link key={c.slug} href={`/cases/${c.slug}`} className="group">
            <Card className="flex h-full flex-col p-6 transition group-hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${CATEGORY_COLORS[c.category]}`}>
                  {c.categoryLabel}
                </span>
                <span className="font-serif text-xs text-text-muted">CASE {String(idx + 1).padStart(3, "0")}</span>
              </div>
              <h3 className="mt-5 font-serif text-xl font-bold leading-snug text-primary group-hover:text-gold-deep">
                {c.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-text-muted">{c.summary}</p>
              <div className="mt-5 space-y-3 border-t border-gold/20 pt-4 text-xs">
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
              <p className="mt-4 font-serif text-xs font-semibold text-primary group-hover:text-gold-deep">
                상세 보기 →
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl bg-primary p-10 text-center text-white sm:p-14">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-soft">Your Case</p>
        <h2 className="mt-3 font-serif text-2xl font-bold sm:text-3xl">비슷한 사안이 있으신가요?</h2>
        <Link
          href="/intake"
          className="mt-6 inline-flex h-12 items-center rounded-lg bg-gold px-6 font-bold text-primary transition hover:bg-gold-soft"
        >
          상담 신청하기
        </Link>
      </section>
    </div>
  );
}
