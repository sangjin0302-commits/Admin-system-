import { prisma } from "@/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { extractTags } from "@/lib/services/blog-tag-extractor";

export async function BlogTagCloud({ lang = "ko" }: { lang?: "ko" | "en" }) {
  const posts = await prisma.blogPost.findMany({
    where: { published: true, source: NAVER_BLOG_SOURCE },
    select: { title: true, excerpt: true, body: true },
    take: 200
  }).catch(() => [] as Array<{ title: string; excerpt: string | null; body: string | null }>);

  const counts: Record<string, number> = {};
  for (const p of posts) {
    const tags = extractTags(`${p.title}\n${p.excerpt ?? ""}\n${(p.body ?? "").slice(0, 3000)}`, { max: 5 });
    for (const t of tags) counts[t] = (counts[t] ?? 0) + 1;
  }

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 24);
  if (entries.length === 0) return null;

  const max = entries[0][1];

  return (
    <section className="ethos-band ethos-band-soft py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-deep">Tags</p>
        <h3 className="ethos-display mt-2 text-xl">{lang === "en" ? "Frequent topics" : "자주 다룬 주제"}</h3>
        <div className="mt-5 flex flex-wrap gap-2">
          {entries.map(([tag, count]) => {
            const ratio = count / max;
            const size = ratio > 0.66 ? "text-base" : ratio > 0.33 ? "text-sm" : "text-xs";
            const weight = ratio > 0.5 ? "font-bold" : "font-semibold";
            return (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 rounded-full border border-gold/30 bg-surface px-3 py-1 ${size} ${weight} text-primary`}
              >
                {tag}
                <span className="text-[10px] text-text-muted">×{count}</span>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
