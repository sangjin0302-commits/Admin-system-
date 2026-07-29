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

  // 커버리지 요약 — 게시된 글 기준 영어 번역 비율(외국인 마케팅 노출 지표).
  const publishedRows = rows.filter((r) => r.published);
  const pubTotal = publishedRows.length;
  const enDone = publishedRows.filter((r) => r.hasEn).length;
  const enPct = pubTotal > 0 ? Math.round((enDone / pubTotal) * 100) : 100;
  const enRemaining = pubTotal - enDone;

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-line bg-surface p-6 shadow-panel">
        <h1 className="font-serif text-2xl font-bold text-primary">블로그 자동 번역</h1>
        <p className="mt-2 text-sm text-text-muted">
          Claude Haiku 기반. 한국어 원문 → 영어/중문(간체) 번역. 검토 후 게시하세요.
        </p>

        {/* 영어 커버리지 요약 */}
        <div className="mt-5 rounded-xl border border-line bg-surface-muted/40 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-text-strong">영어 번역 커버리지</span>
            <span className="font-serif text-sm text-text-muted">
              {enDone}/{pubTotal}편 · 미번역 {enRemaining}편
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full transition-all ${enPct >= 90 ? "bg-emerald-500" : enPct >= 60 ? "bg-gold" : "bg-warning"}`}
              style={{ width: `${enPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs font-bold text-primary">{enPct}%</p>
          <p className="mt-1 text-[11px] text-text-muted">
            최근 100편 기준. 자동 번역 크론(content-sync, 매일 13:00 KST)이 하루 5편씩 채웁니다.
          </p>
        </div>
      </section>

      <BlogTranslationClient posts={rows} />
    </div>
  );
}
