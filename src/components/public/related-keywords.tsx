import Link from "next/link";

import { toPublicCategory } from "@/lib/services/blog-categorizer";

const CAT_KEYWORDS: Record<string, Array<{ term: string; label: string }>> = {
  visa: [
    { term: "d-8-비자", label: "D-8 비자" },
    { term: "d-10-비자", label: "D-10 비자" },
    { term: "f-2-7-비자", label: "F-2-7 비자" },
    { term: "귀화", label: "귀화 · 국적" },
    { term: "강제퇴거", label: "강제퇴거 대응" }
  ],
  appeal: [
    { term: "행정심판", label: "행정심판" },
    { term: "강제퇴거", label: "강제퇴거 대응" }
  ],
  contract: [{ term: "법인설립", label: "법인 설립" }],
  license: [{ term: "법인설립", label: "법인 설립" }],
  corporate: [
    { term: "법인설립", label: "법인 설립" },
    { term: "d-8-비자", label: "D-8 비자" }
  ],
  other: [
    { term: "행정심판", label: "행정심판" },
    { term: "d-8-비자", label: "D-8 비자" }
  ]
};

export function RelatedKeywords({ category }: { category: string }) {
  const pub = toPublicCategory(category);
  const items = CAT_KEYWORDS[pub] ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border border-gold/30 bg-gold-soft/15 p-5">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-deep">
        Related Keyword Guides
      </p>
      <h3 className="ethos-display mt-2 text-base">관련 키워드 가이드</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((k) => (
          <Link
            key={k.term}
            href={`/keyword/${encodeURIComponent(k.term)}`}
            data-funnel="blog_to_keyword"
            data-funnel-cat={pub}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-surface px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-gold-soft/40 hover:border-gold/70"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {k.label} →
          </Link>
        ))}
      </div>
    </section>
  );
}
