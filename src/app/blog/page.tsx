import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { listBlogPosts } from "@/lib/blog-posts";
import { prisma } from "@/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { PUBLIC_CATEGORY_LABEL, toPublicCategory, type PublicCategory } from "@/lib/services/blog-categorizer";
import { BlogTagCloud } from "@/components/public/blog-tag-cloud";
import { NewsletterSubscribeForm } from "@/components/public/newsletter-subscribe-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "법률 칼럼 — 에토스 행정사사무소(ETHOS)",
  description: "비자, 행정심판, 계약서, 인허가 관련 법률 칼럼.",
  // 국문 목록과 영문 목록(?lang=en)을 hreflang 로 서로 연결한다.
  alternates: {
    canonical: "/blog",
    languages: { ko: "/blog", en: "/blog?lang=en", "x-default": "/blog" }
  }
};

type Lang = "ko" | "en";

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string; cat?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const lang: Lang = sp.lang === "en" ? "en" : "ko";
  const activeCat = (sp.cat as PublicCategory | undefined) ?? null;

  const posts = await listBlogPosts();

  const importedPosts = await prisma.blogPost.findMany({
    where: { published: true, source: NAVER_BLOG_SOURCE },
    orderBy: { publishedAt: "desc" },
    take: 120,
    select: {
      id: true,
      slug: true,
      title: true,
      titleEn: true,
      excerpt: true,
      excerptEn: true,
      publishedAt: true,
      source: true,
      originalUrl: true,
      category: true,
      coverImage: true,
    },
  });

  // ── 단일 게시판: 네이버 수입글 + 레거시 마크다운글을 하나로 통합 ──
  const labelToPublic = (label: string): PublicCategory => {
    const found = (Object.entries(PUBLIC_CATEGORY_LABEL) as [PublicCategory, string][]).find(
      ([, v]) => v === label
    );
    return found?.[0] ?? "other";
  };
  type BoardCard = {
    key: string;
    href: string;
    title: string;
    excerpt: string;
    cover: string | null;
    dateMs: number;
    dateLabel: string;
    publicCat: PublicCategory;
  };
  const allCards: BoardCard[] = [
    ...importedPosts.map((p) => ({
      key: p.id,
      href: `/blog/${p.slug}${lang === "en" ? "?lang=en" : ""}`,
      title: lang === "en" ? p.titleEn || p.title : p.title,
      excerpt: lang === "en" ? p.excerptEn || p.excerpt : p.excerpt,
      cover: p.coverImage ?? null,
      dateMs: p.publishedAt ? p.publishedAt.getTime() : 0,
      dateLabel: p.publishedAt?.toLocaleDateString(lang === "en" ? "en-US" : "ko-KR") ?? "",
      publicCat: toPublicCategory(p.category),
    })),
    ...posts.map((p) => ({
      key: `md-${p.slug}`,
      href: `/blog/${p.slug}${lang === "en" ? "?lang=en" : ""}`,
      title: p.title,
      excerpt: p.excerpt,
      cover: null,
      dateMs: p.date ? new Date(p.date).getTime() : 0,
      dateLabel: p.date,
      publicCat: labelToPublic(p.category),
    })),
  ].sort((a, b) => b.dateMs - a.dateMs);
  const boardCounts = (Object.keys(PUBLIC_CATEGORY_LABEL) as PublicCategory[])
    .map((c) => ({ cat: c, count: allCards.filter((x) => x.publicCat === c).length }))
    .filter((x) => x.count > 0);
  const board = activeCat ? allCards.filter((c) => c.publicCat === activeCat) : allCards;
  const featured = board[0];
  const rest = board.slice(1);

  return (
    <div className="overflow-x-clip">
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Legal Column</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">
              {lang === "en" ? "Legal Columns" : "법률 칼럼"}
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-text-muted">
              {lang === "en"
                ? "Practical insights on visa, administrative appeals, contracts, and licenses."
                : "비자, 행정심판, 계약서, 인허가 관련 실무 정보를 정리합니다."}
              <br />
              {lang === "en"
                ? "* General information; not legal advice for specific cases."
                : "※ 일반적 안내이며, 개별 사안에 대한 법률 자문이 아닙니다."}
            </p>
          </Reveal>
          <div className="mt-6 inline-flex rounded-full border border-line bg-surface p-1 text-xs">
            <Link
              href="/blog?lang=ko"
              className={`px-3 py-1 rounded-full ${lang === "ko" ? "bg-primary text-white" : "text-text-muted"}`}
            >
              KR
            </Link>
            <Link
              href="/blog?lang=en"
              className={`px-3 py-1 rounded-full ${lang === "en" ? "bg-primary text-white" : "text-text-muted"}`}
            >
              EN
            </Link>
          </div>
        </div>
      </section>

      {/* 대표글 (단일 게시판 최신) — 네이버 카드뉴스 커버 노출 */}
      {featured && (
        <section
          className="ethos-band ethos-band-dark ethos-grain py-16 sm:py-20"
          style={{ backgroundColor: "rgb(22 50 80)" }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <Link href={featured.href} className="group block">
                <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <span className="rounded-full bg-gold/30 px-3 py-1 text-xs font-bold text-gold-soft">
                      {PUBLIC_CATEGORY_LABEL[featured.publicCat]}
                    </span>
                    <h2 className="ethos-display mt-6 text-3xl leading-tight text-white sm:text-[2.4rem] line-clamp-3">
                      {featured.title}
                    </h2>
                    <p className="mt-5 max-w-xl text-sm leading-8 text-white/75 line-clamp-3">
                      {featured.excerpt}
                    </p>
                    <div className="mt-6 text-xs text-white/60">{featured.dateLabel}</div>
                    <span className="mt-6 inline-flex items-center gap-2 font-serif text-sm font-bold text-gold-soft transition-colors group-hover:text-white">
                      {lang === "en" ? "Read more" : "자세히 읽기"}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                  {featured.cover && (
                    <div className="hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featured.cover}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* 단일 게시판 — 카테고리 필터 + 카드뉴스 커버 그리드 */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {boardCounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/blog${lang === "en" ? "?lang=en" : ""}`}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${!activeCat ? "bg-primary text-white" : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"}`}
              >
                {lang === "en" ? "All" : "전체"}
              </Link>
              {boardCounts.map(({ cat, count }) => (
                <Link
                  key={cat}
                  href={`/blog?cat=${cat}${lang === "en" ? "&lang=en" : ""}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${activeCat === cat ? "bg-primary text-white" : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"}`}
                >
                  {PUBLIC_CATEGORY_LABEL[cat]} <span className="opacity-70">({count})</span>
                </Link>
              ))}
            </div>
          )}

          {rest.length === 0 ? (
            <p className="mt-10 text-sm text-text-muted">
              {lang === "en" ? "No posts yet." : "아직 등록된 글이 없습니다."}
            </p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((c) => (
                <Link
                  key={c.key}
                  href={c.href}
                  className="group flex flex-col overflow-hidden rounded-xl border border-gold/20 bg-surface transition hover:border-gold/50 hover:shadow-panel"
                >
                  {c.cover && (
                    <div className="aspect-[16/9] overflow-hidden bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.cover}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="inline-block w-fit rounded-full bg-gold-soft/50 px-2.5 py-0.5 font-serif text-[11px] font-bold text-gold-deep">
                      {PUBLIC_CATEGORY_LABEL[c.publicCat]}
                    </span>
                    <h3 className="mt-3 font-serif text-sm font-bold leading-snug text-primary group-hover:text-gold-deep line-clamp-2">
                      {c.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-6 text-text-muted">{c.excerpt}</p>
                    <p className="mt-3 text-[11px] text-text-muted">{c.dateLabel}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 태그 클라우드 */}
      <BlogTagCloud />

      {/* 뉴스레터 구독 */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="rounded-3xl border border-line bg-surface-muted/50 px-6 py-12 sm:px-12">
              <NewsletterSubscribeForm lang={lang} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="ethos-band ethos-band-soft py-24 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Have a question?</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">
              {lang === "en" ? "Have a specific case?" : "궁금한 사안이 있으신가요?"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-text-muted">
              {lang === "en"
                ? "Columns are general guidance. Individual cases are reviewed after consultation."
                : "칼럼은 일반 안내이며, 개별 사안은 상담 신청 후 사실관계를 확인하며 검토합니다."}
            </p>
            <Link
              href={lang === "en" ? "/intake?lang=en" : "/intake"}
              className="mt-9 inline-flex h-12 items-center rounded-lg bg-primary px-8 text-sm font-bold text-white transition hover:bg-text-strong"
            >
              {lang === "en" ? "Request Consultation" : "상담 신청하기"}
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
