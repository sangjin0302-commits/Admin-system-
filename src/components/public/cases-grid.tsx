"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Reveal } from "@/components/public/reveal";

type CaseCard = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  summary: string;
  outcome: string;
  duration: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  VISA_STAY: "bg-emerald-100 text-emerald-800",
  ADMIN_APPEAL: "bg-amber-100 text-amber-800",
  CONTRACT_INVESTIGATION: "bg-sky-100 text-sky-800",
  LICENSE_PERMIT: "bg-violet-100 text-violet-800"
};

const FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "VISA_STAY", label: "비자/체류" },
  { key: "ADMIN_APPEAL", label: "행정심판" },
  { key: "CONTRACT_INVESTIGATION", label: "계약서/사실조사" },
  { key: "LICENSE_PERMIT", label: "인허가" }
] as const;

export function CasesGrid({ cases }: { cases: readonly CaseCard[] }) {
  const [active, setActive] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (active !== "ALL" && c.category !== active) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [cases, active, query]);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-wrap justify-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setActive(f.key)}
                className={`rounded-full border px-4 py-1.5 font-serif text-xs font-semibold transition ${
                  active === f.key
                    ? "border-gold bg-primary text-white"
                    : "border-gold/40 bg-surface text-primary hover:bg-gold-soft/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="사례 검색 (제목 / 분야)"
            className="h-11 w-full max-w-md rounded-lg border border-gold/40 bg-surface px-4 text-sm focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-text-muted">해당 조건의 사례가 없습니다.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, idx) => (
              <Reveal key={c.slug} delay={((idx % 3) + 1) as 1 | 2 | 3}>
                <Link href={`/cases/${c.slug}`} className="group block h-full">
                  <div className="ethos-card ethos-card-hover ethos-card-topline ethos-cta-shine flex h-full flex-col p-7">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${CATEGORY_COLORS[c.category]}`}>
                        {c.categoryLabel}
                      </span>
                      <span className="ethos-quote text-xs text-text-muted">
                        CASE {String(idx + 1).padStart(3, "0")}
                      </span>
                    </div>
                    <h3 className="ethos-display mt-6 text-xl leading-snug group-hover:text-gold-deep">{c.title}</h3>
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
        )}
      </div>
    </>
  );
}
