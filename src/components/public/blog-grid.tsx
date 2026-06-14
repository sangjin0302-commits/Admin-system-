"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Reveal } from "@/components/public/reveal";

export type BlogCard = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMin: number;
};

export function BlogGrid({ posts }: { posts: readonly BlogCard[] }) {
  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category));
    return ["전체", ...Array.from(set)];
  }, [posts]);

  const [active, setActive] = useState("전체");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (active !== "전체" && p.category !== active) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    });
  }, [posts, active, query]);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                className={`rounded-full border px-4 py-1.5 font-serif text-xs font-semibold transition ${
                  active === c
                    ? "border-gold bg-primary text-white"
                    : "border-gold/40 bg-surface text-primary hover:bg-gold-soft/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="칼럼 검색 (제목 / 내용)"
            className="h-11 w-full max-w-md rounded-lg border border-gold/40 bg-surface px-4 text-sm focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-text-muted">해당 조건의 칼럼이 없습니다.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <Reveal key={p.slug} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <Link href={`/blog/${p.slug}`} className="group block h-full">
                  <div className="ethos-card ethos-card-hover ethos-card-topline flex h-full flex-col p-7">
                    <span className="self-start rounded-full bg-gold-soft/60 px-3 py-1 text-[11px] font-bold text-gold-deep">
                      {p.category}
                    </span>
                    <h3 className="ethos-display mt-5 text-lg leading-snug group-hover:text-gold-deep">{p.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-7 text-text-muted">{p.excerpt}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-gold/15 pt-4 text-xs text-text-muted">
                      <span>{p.date}</span>
                      <span>{p.readMin}분 소요</span>
                    </div>
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
