import Link from "next/link";
import type { Metadata } from "next";

import { BlogGrid } from "@/components/public/blog-grid";
import { NaverBlogSection } from "@/components/public/naver-blog-section";
import { Reveal } from "@/components/public/reveal";
import { listBlogPosts } from "@/lib/blog-posts";
import { fetchNaverBlogPosts } from "@/lib/services/naver-blog";
import { getSiteSetting } from "@/lib/services/site-settings";
import { prisma } from "@/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { CATEGORY_LABEL, PUBLIC_CATEGORY_LABEL, toPublicCategory, type PublicCategory, type BlogCategory } from "@/lib/services/blog-categorizer";
import { BlogTagCloud } from "@/components/public/blog-tag-cloud";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "법률 칼럼 — ETHOS 행정사사무소",
  description: "비자, 행정심판, 계약서, 인허가 관련 법률 칼럼."
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
  const naverBlogId = await getSiteSetting("naver.blogId");
  const naverPosts = naverBlogId ? await fetchNaverBlogPosts(naverBlogId, 9) : [];

  // 공개 페이지: activeCat이 visa면 visa + naturalization + refugee + social_security 등 모두 포함
  const internalForPublic: Record<PublicCategory, string[]> = {
    visa: ["visa", "naturalization", "refugee", "social_security"],
    appeal: ["appeal", "complaint", "petition"],
    contract: ["contract", "deposit"],
    license: ["license", "building_permit", "vehicle"],
    corporate: ["corporate"],
    other: ["other"]
  };
  const importedWhere = {
    published: true,
    source: NAVER_BLOG_SOURCE,
    ...(activeCat ? { category: { in: internalForPublic[activeCat] } } : {})
  };
  const importedPosts = await prisma.blogPost.findMany({
    where: importedWhere,
    orderBy: { publishedAt: "desc" },
    take: 60,
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
    },
  });

  // 카테고리별 카운트
  const catCounts = await prisma.blogPost.groupBy({
    by: ["category"],
    where: { published: true, source: NAVER_BLOG_SOURCE },
    _count: { _all: true }
  }).catch(() => [] as Array<{ category: string; _count: { _all: number } }>);

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

      {posts.length === 0 ? null : (
        <>
          <FeaturedSection post={posts[0]} />
          {posts.length > 1 && (
            <section className="py-16 sm:py-20">
              <BlogGrid
                posts={posts.slice(1).map((p) => ({
                  slug: p.slug,
                  title: p.title,
                  excerpt: p.excerpt,
                  category: p.category,
                  date: p.date,
                  readMin: p.readMin
                }))}
              />
            </section>
          )}
        </>
      )}

      {importedPosts.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="ethos-eyebrow">{lang === "en" ? "From Naver Blog" : "네이버 블로그에서"}</p>
            <h2 className="ethos-display mt-3 text-2xl sm:text-3xl">
              {lang === "en" ? "Imported Posts" : "가져온 글"}
              {activeCat && PUBLIC_CATEGORY_LABEL[activeCat] && (
                <span className="ml-3 rounded-full bg-gold-soft/60 px-3 py-1 align-middle text-sm font-bold text-gold-deep">
                  {PUBLIC_CATEGORY_LABEL[activeCat]}
                </span>
              )}
            </h2>

            {/* 카테고리 필터 */}
            {catCounts.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href={`/blog${lang === "en" ? "?lang=en" : ""}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${!activeCat ? "bg-primary text-white" : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"}`}
                >
                  전체
                </Link>
                {(Object.keys(PUBLIC_CATEGORY_LABEL) as PublicCategory[]).map((c) => {
                  // 공개 카테고리에 매핑되는 내부 카테고리도 합산
                  const internals = internalForPublic[c];
                  const count = catCounts
                    .filter((x) => internals.includes(x.category))
                    .reduce((sum, x) => sum + x._count._all, 0);
                  if (count === 0) return null;
                  const isActive = activeCat === c;
                  return (
                    <Link
                      key={c}
                      href={`/blog?cat=${c}${lang === "en" ? "&lang=en" : ""}`}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${isActive ? "bg-primary text-white" : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"}`}
                    >
                      {PUBLIC_CATEGORY_LABEL[c]} <span className="opacity-70">({count})</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {importedPosts.map((p) => {
                const title = lang === "en" ? (p.titleEn || p.title) : p.title;
                const excerpt = lang === "en" ? (p.excerptEn || p.excerpt) : p.excerpt;
                return (
                  <Link
                    key={p.id}
                    href={`/blog/${p.slug}${lang === "en" ? "?lang=en" : ""}`}
                    className="group block rounded-xl border border-gold/20 bg-surface p-5 transition hover:border-gold/50 hover:shadow-panel"
                  >
                    <span className="inline-block rounded-full bg-gold-soft/50 px-2.5 py-0.5 font-serif text-[11px] font-bold text-gold-deep">
                      {PUBLIC_CATEGORY_LABEL[toPublicCategory(p.category)]}
                    </span>
                    <h3 className="mt-3 font-serif text-sm font-bold leading-snug text-primary group-hover:text-gold-deep line-clamp-2">
                      {title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-6 text-text-muted">{excerpt}</p>
                    <p className="mt-3 text-[11px] text-text-muted">
                      {p.publishedAt?.toLocaleDateString(lang === "en" ? "en-US" : "ko-KR") ?? ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {naverPosts.length > 0 && <NaverBlogSection posts={naverPosts} blogId={naverBlogId} />}

      {/* 태그 클라우드 */}
      <BlogTagCloud />

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
              href="/intake"
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

function FeaturedSection({ post }: { post: Awaited<ReturnType<typeof listBlogPosts>>[number] }) {
  return (
    <section className="ethos-band ethos-band-dark ethos-grain py-20 sm:py-24" style={{ backgroundColor: "rgb(22 50 80)" }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <Link href={`/blog/${post.slug}`} className="group block">
            <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <span className="rounded-full bg-gold/30 px-3 py-1 text-xs font-bold text-gold-soft">FEATURED</span>
                <h2 className="ethos-display mt-6 text-3xl leading-tight text-white sm:text-[2.6rem]">
                  {post.title}
                </h2>
                <p className="mt-6 max-w-xl text-sm leading-8 text-white/75">{post.excerpt}</p>
                <div className="mt-8 flex items-center gap-4 text-xs text-white/60">
                  <span>{post.category}</span>
                  <span>·</span>
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>읽는 시간 {post.readMin}분</span>
                </div>
                <span className="mt-8 inline-flex items-center gap-2 font-serif text-sm font-bold text-gold-soft transition-colors group-hover:text-white">
                  자세히 읽기
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </div>
              <div className="hidden lg:block">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur">
                  <div className="ethos-quote text-7xl text-gold/40">&ldquo;</div>
                  <p className="ethos-quote mt-3 text-lg text-gold-soft">
                    절차에는 이성을,
                    <br />
                    사람에게는 공감을.
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
