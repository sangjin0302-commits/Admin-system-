import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BlogToc } from "@/components/public/blog-toc";
import { ShareButtons } from "@/components/public/share-buttons";
import { BlogCta } from "@/components/public/blog-cta";
import { RelatedKeywords } from "@/components/public/related-keywords";
import { ScrollProgress } from "@/components/public/scroll-progress";
import { PUBLIC_CATEGORY_LABEL, toPublicCategory } from "@/lib/services/blog-categorizer";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { autoLinkKeywords } from "@/lib/utils/keyword-linker";
import { getBlogPostBySlug, listBlogPosts } from "@/lib/blog-posts";
import { prisma } from "@/lib/prisma/client";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

type Lang = "ko" | "en";

type ResolvedPost = {
  source: "markdown" | "db";
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  category: string;
  date: string;
  readMin: number;
  originalUrl?: string | null;
  translationMissing?: boolean;
};

async function resolvePost(slug: string, lang: Lang): Promise<ResolvedPost | null> {
  const md = await getBlogPostBySlug(slug);
  if (md) {
    return {
      source: "markdown",
      slug: md.slug,
      title: md.title,
      excerpt: md.excerpt,
      contentHtml: md.contentHtml,
      category: md.category,
      date: md.date,
      readMin: md.readMin,
    };
  }
  const db = await prisma.blogPost.findUnique({ where: { slug } });
  if (!db || !db.published) return null;
  const wantEn = lang === "en";
  const titleEn = db.titleEn;
  const bodyEn = db.bodyEn;
  const excerptEn = db.excerptEn;
  const useEn = wantEn && !!bodyEn;
  return {
    source: "db",
    slug: db.slug,
    title: useEn && titleEn ? titleEn : db.title,
    excerpt: useEn && excerptEn ? excerptEn : db.excerpt,
    contentHtml: useEn && bodyEn ? bodyEn : db.body,
    category: db.category,
    date: (db.publishedAt ?? db.createdAt).toISOString().slice(0, 10),
    readMin: Math.max(1, Math.round(db.body.length / 800)),
    originalUrl: db.originalUrl,
    translationMissing: wantEn && !bodyEn,
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const lang: Lang = sp.lang === "en" ? "en" : "ko";
  const post = await resolvePost(slug, lang);
  if (!post) return { title: "글을 찾을 수 없습니다" };
  return {
    title: `${post.title} — 법률 칼럼 | ETHOS`,
    description: post.excerpt,
    // 네이버 블로그에서 import된 글은 원본을 canonical로 → 중복 콘텐츠 SEO 패널티 방지
    alternates: post.originalUrl ? { canonical: post.originalUrl } : undefined,
    robots: post.originalUrl ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const lang: Lang = sp.lang === "en" ? "en" : "ko";
  const post = await resolvePost(slug, lang);
  if (!post) notFound();

  const all = await listBlogPosts();

  // Fuse 유사도 — 제목+요약+카테고리 매칭, 폴백은 카테고리
  const FuseMod = await import("fuse.js").then((m) => m.default).catch(() => null);
  let related: typeof all = [];
  if (FuseMod) {
    const candidates = all.filter((p) => p.slug !== post.slug);
    const fuse = new FuseMod(candidates, {
      keys: ["title", "excerpt", "category"],
      threshold: 0.45,
      ignoreLocation: true,
    });
    const q = `${post.title} ${post.excerpt}`;
    const hits = fuse.search(q).slice(0, 3).map((h) => h.item);
    if (hits.length >= 3) related = hits;
  }
  if (related.length < 3) {
    const fill = [
      ...all.filter((p) => p.slug !== post.slug && p.category === post.category),
      ...all.filter((p) => p.slug !== post.slug && p.category !== post.category),
    ].filter((p) => !related.find((r) => r.slug === p.slug));
    related = [...related, ...fill].slice(0, 3);
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <ScrollProgress />
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        url={`/blog/${post.slug}`}
        publishedAt={post.date}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: "/" },
          { name: "블로그", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ]}
      />
      <div className="absolute left-full top-20 hidden h-full pl-10 xl:block">
        <div className="w-56">
          <BlogToc />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/blog${lang === "en" ? "?lang=en" : ""}`} className="font-serif text-xs text-text-muted hover:text-primary">
          ← {lang === "en" ? "Back to columns" : "법률 칼럼 목록"}
        </Link>
        <div className="inline-flex rounded-full border border-line bg-surface p-1 text-xs">
          <Link
            href={`/blog/${post.slug}?lang=ko`}
            className={`px-2.5 py-0.5 rounded-full ${lang === "ko" ? "bg-primary text-white" : "text-text-muted"}`}
          >
            KR
          </Link>
          <Link
            href={`/blog/${post.slug}?lang=en`}
            className={`px-2.5 py-0.5 rounded-full ${lang === "en" ? "bg-primary text-white" : "text-text-muted"}`}
          >
            EN
          </Link>
        </div>
      </div>

      <article className="mt-8">
        <span className="rounded-full bg-gold-soft/60 px-3 py-1 font-serif text-xs font-bold text-gold-deep">
          {PUBLIC_CATEGORY_LABEL[toPublicCategory(post.category)]}
        </span>
        <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readMin}{lang === "en" ? " min read" : "분 소요"}</span>
        </div>

        {post.translationMissing && (
          <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            번역 준비 중 / Translation in progress — showing Korean original.
          </p>
        )}

        {post.originalUrl && (
          <p className="mt-4 text-xs">
            <a
              href={post.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              원본 보기 (Naver Blog) ↗
            </a>
          </p>
        )}

        <div className="ethos-rule my-8">{post.category}</div>

        <div
          className="prose prose-sm max-w-none font-serif text-base leading-8 text-text [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-2 [&>p:first-of-type]:first-letter:font-serif [&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:font-extrabold [&>p:first-of-type]:first-letter:leading-[0.8] [&>p:first-of-type]:first-letter:text-gold-deep [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:text-primary"
          dangerouslySetInnerHTML={{ __html: autoLinkKeywords(sanitizeHtml(post.contentHtml)) }}
        />

        <ShareButtons title={post.title} />
      </article>

      {related.length > 0 && (
        <section className="mt-14 border-t border-gold/20 pt-10">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">
            {lang === "en" ? "Related columns" : "관련 칼럼"}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group block rounded-xl border border-gold/20 bg-surface p-5 transition hover:border-gold/50 hover:shadow-panel"
              >
                <span className="inline-block rounded-full bg-gold-soft/50 px-2.5 py-0.5 font-serif text-[11px] font-bold text-gold-deep">
                  {r.category}
                </span>
                <h3 className="mt-3 font-serif text-sm font-bold leading-snug text-primary group-hover:text-gold-deep">
                  {r.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-6 text-text-muted">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <RelatedKeywords category={post.category} />
      <BlogCta category={post.category} />

      <p className="mt-8 rounded-lg border border-gold/30 bg-surface-muted/40 px-4 py-3 text-xs italic text-text-muted">
        ※ 본 칼럼은 일반적 안내이며, 개별 사안에 대한 법률 자문이 아닙니다.
      </p>
    </div>
  );
}
