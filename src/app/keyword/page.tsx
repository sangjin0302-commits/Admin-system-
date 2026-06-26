import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "키워드 가이드 — ETHOS 행정사사무소",
  description: "비자·행정심판·법인설립·귀화 등 행정사 핵심 키워드별 가이드."
};

const KEYWORDS = [
  { term: "d-8-비자", label: "D-8 비자 (기업투자)", group: "비자" },
  { term: "d-10-비자", label: "D-10 비자 (구직)", group: "비자" },
  { term: "f-2-7-비자", label: "F-2-7 비자 (점수제 거주)", group: "비자" },
  { term: "귀화", label: "귀화 · 국적", group: "비자" },
  { term: "강제퇴거", label: "강제퇴거 대응", group: "비자" },
  { term: "행정심판", label: "행정심판", group: "심판" },
  { term: "법인설립", label: "법인 설립", group: "법인" }
] as const;

export default function KeywordIndexPage() {
  const groups = Array.from(new Set(KEYWORDS.map((k) => k.group)));
  return (
    <div className="overflow-x-clip">
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Keyword Guide</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.4rem]">키워드 가이드</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-text-muted">
              주요 행정사 검색어별로 정리한 안내 + 관련 칼럼 모음.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6">
          {groups.map((g) => (
            <div key={g}>
              <h2 className="ethos-display text-xl">{g}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {KEYWORDS.filter((k) => k.group === g).map((k) => (
                  <Link
                    key={k.term}
                    href={`/keyword/${encodeURIComponent(k.term)}`}
                    className="ethos-card ethos-card-hover ethos-card-topline group block p-5"
                  >
                    <p className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold-deep">
                      {k.group}
                    </p>
                    <p className="mt-1.5 font-serif text-base font-bold text-text-strong group-hover:text-gold-deep">
                      {k.label}
                    </p>
                    <p className="mt-2 text-xs text-text-muted">자세히 →</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
