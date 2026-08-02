import Link from "next/link";

import { publicCategoryLabel, toPublicCategoryLoose } from "@/lib/services/blog-categorizer";

interface RelatedPost { slug: string; title: string; excerpt: string | null; category: string | null; }

export function BlogRelatedPosts({ posts, lang = "ko" }: { posts: RelatedPost[]; lang?: "ko" | "en" }) {
  if (posts.length === 0) return null;
  const qs = lang === "en" ? "?lang=en" : "";
  return (
    <section className="mt-16 border-t border-gold/20 pt-10">
      <h3 className="text-lg font-bold text-primary">{lang === "en" ? "Related posts" : "관련 글"}</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {posts.map(p => (
          <Link key={p.slug} href={`/blog/${p.slug}${qs}`} className="group rounded-xl border p-5 transition hover:border-gold/50 hover:shadow-sm">
            {p.category && <span className="text-xs font-bold text-gold-deep">{publicCategoryLabel(toPublicCategoryLoose(p.category), lang)}</span>}
            <h4 className="mt-1 font-semibold text-primary group-hover:text-gold-deep">{p.title}</h4>
            {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-text-muted">{p.excerpt}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}
