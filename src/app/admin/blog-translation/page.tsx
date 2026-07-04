import { prisma } from "@/lib/prisma/client";
import { getTranslationStatusMap } from "@/lib/services/blog-translation-service";
import { BlogTranslationClient } from "./blog-translation-client";

export const dynamic = "force-dynamic";

export default async function BlogTranslationAdminPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      published: true,
      publishedAt: true,
      titleEn: true,
      bodyEn: true,
    },
  });

  const status = await getTranslationStatusMap(posts.map((p) => p.id));

  const rows = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? "",
    published: p.published,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    hasEn: Boolean(status[p.id]?.hasEn),
    hasZh: Boolean(status[p.id]?.hasZh),
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-line bg-surface p-6 shadow-panel">
        <h1 className="font-serif text-2xl font-bold text-primary">블로그 자동 번역</h1>
        <p className="mt-2 text-sm text-text-muted">
          Claude Haiku 기반. 한국어 원문 → 영어/중문(간체) 번역. 검토 후 게시하세요.
        </p>
      </section>

      <BlogTranslationClient posts={rows} />
    </div>
  );
}
