"use client";

import Link from "next/link";
import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";

export type SearchItem = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date?: string;
  href: string;
};

type Props = {
  items: readonly SearchItem[];
  placeholder?: string;
  categories?: readonly string[];
};

export function FuseSearchList({ items, placeholder = "검색", categories }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "title", weight: 0.6 },
          { name: "excerpt", weight: 0.3 },
          { name: "category", weight: 0.1 }
        ],
        threshold: 0.4,
        ignoreLocation: true
      }),
    [items]
  );

  const filtered = useMemo(() => {
    let result = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : items.slice();
    if (category) result = result.filter((i) => i.category === category);
    return result;
  }, [query, category, fuse, items]);

  const cats = categories ?? Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="space-y-6">
      {/* Search box */}
      <div className="relative mx-auto max-w-md">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-full border border-gold/40 bg-surface pl-11 pr-4 text-sm focus:border-gold focus:outline-none"
        />
        <Search className="absolute left-4 top-3 h-5 w-5 text-text-muted" />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`rounded-full border px-4 py-1.5 font-serif text-xs font-semibold ${
            category === ""
              ? "border-primary bg-primary text-white"
              : "border-gold/40 bg-surface text-primary hover:bg-gold-soft/30"
          }`}
        >
          전체
        </button>
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-1.5 font-serif text-xs font-semibold ${
              category === c
                ? "border-primary bg-primary text-white"
                : "border-gold/40 bg-surface text-primary hover:bg-gold-soft/30"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-muted">검색 결과가 없습니다.</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.slug} href={p.href} className="group">
              <Card className="flex h-full flex-col p-6 transition hover:shadow-md">
                <span className="self-start rounded-full bg-gold-soft/60 px-3 py-1 text-[11px] font-bold text-gold-deep">
                  {p.category}
                </span>
                <h3 className="mt-4 font-serif text-lg font-bold leading-snug text-primary group-hover:text-gold-deep">
                  {p.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-text-muted">{p.excerpt}</p>
                {p.date && (
                  <p className="mt-4 border-t border-gold/20 pt-3 text-xs text-text-muted">{p.date}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
