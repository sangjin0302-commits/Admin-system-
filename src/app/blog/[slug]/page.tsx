import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";

import { BlogToc } from "@/components/public/blog-toc";
import { ShareButtons } from "@/components/public/share-buttons";
import { BlogCta } from "@/components/public/blog-cta";
import { BlogInlineCta } from "@/components/public/blog-inline-cta";
import { RelatedKeywords } from "@/components/public/related-keywords";
import { ScrollProgress } from "@/components/public/scroll-progress";
import { BlogScrollTracker } from "@/components/public/blog-scroll-tracker";
import { BlogMidCta } from "@/components/public/blog-mid-cta";
import { BlogCategoryCta } from "@/components/public/blog-category-cta";
import { publicCategoryLabel, toPublicCategoryLoose, type PublicCategory } from "@/lib/services/blog-categorizer";

/** 공개 카테고리 → 서비스 페이지 매핑(블로그 하단 서비스별 CTA). */
const CATEGORY_SERVICE: Record<PublicCategory, { href: string; ko: string; en: string }> = {
  visa: { href: "/services/immigration", ko: "비자·체류 서비스", en: "Visa & Residence services" },
  appeal: { href: "/services/appeal", ko: "행정심판 서비스", en: "Administrative appeal services" },
  contract: { href: "/services/contract", ko: "계약·사실조사 서비스", en: "Contract & investigation services" },
  license: { href: "/services/license", ko: "인허가 서비스", en: "Licensing & permit services" },
  corporate: { href: "/services/corporate", ko: "법인설립 서비스", en: "Corporate formation services" },
  other: { href: "/services", ko: "전체 서비스", en: "All services" }
};
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { autoLinkKeywords, extractKeywords } from "@/lib/utils/keyword-linker";
import { getBlogPostBySlug, listBlogPosts } from "@/lib/blog-posts";
import { prisma } from "@/lib/prisma/client";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getRelatedBlogPosts } from "@/lib/services/blog-recommend-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { BlogSummaryCard } from "@/components/public/blog-summary-card";
import { BlogRelatedPosts } from "@/components/public/blog-related-posts";
import { generateBlogSummary } from "@/lib/services/blog-summary-service";
import { getRelatedPosts } from "@/lib/services/blog-related-service";

export const dynamic = "force-dynamic";

function extractFaqPairs(html: string): { question: string; answer: string }[] {
  const text = html.replace(/<[^>]+>/g, "\n");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const qMatch = lines[i].match(/^(?:Q[:.]|[?])\s*(.+)/);
    if (qMatch) {
      const aMatch = lines[i + 1]?.match(/^A[:.]?\s*(.+)/);
      if (aMatch) {
        pairs.push({ question: qMatch[1].trim(), answer: aMatch[1].trim() });
        i++;
      }
    }
  }
  return pairs;
}

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
  /** EN 번역본(bodyEn) 존재 여부 — hreflang 에 EN 대체본을 광고할지 판단. */
  hasEn?: boolean;
  /** 관리자가 지정한 태그(공개 표시용). db.tags(JSON) 파싱. */
  tags?: string[];
};

/** blogPost.tags(JSON 문자열)를 표시용 배열로 파싱. */
function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const a = JSON.parse(raw);
    if (Array.isArray(a)) return a.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    /* 구형 콤마문자열 폴백 */
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** %-인코딩된 제목(과거 수입 데이터 오류)을 방어적 디코드. 실패 시 원문. */
function decodeTitle(s: string): string {
  if (!s.includes("%") && !s.includes("+")) return s;
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s.replace(/\+/g, " ");
  }
}

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
      // 마크다운 글은 EN 번역본이 없다 → EN 요청 시 한글 원문임을 배너로 알린다(무단 한글 노출 방지).
      translationMissing: lang === "en",
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
    title: decodeTitle(useEn && titleEn ? titleEn : db.title),
    excerpt: useEn && excerptEn ? excerptEn : db.excerpt,
    contentHtml: useEn && bodyEn ? bodyEn : db.body,
    category: db.category,
    date: (db.publishedAt ?? db.createdAt).toISOString().slice(0, 10),
    readMin: Math.max(1, Math.round(db.body.length / 800)),
    originalUrl: db.originalUrl,
    translationMissing: wantEn && !bodyEn,
    hasEn: !!bodyEn,
    tags: parseTags(db.tags),
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
  const slugPath = `/blog/${slug}`;
  const enPath = `${slugPath}?lang=en`;
  const isImported = Boolean(post.originalUrl);
  // 네이버 수입글의 EN 번역은 네이버에 없는 고유 콘텐츠 → 구글 색인 허용(국제 유입).
  // 반대로 KO 수입글은 네이버 원문과 중복 → noindex + canonical 을 네이버로.
  const enIndexable = isImported && lang === "en" && !post.translationMissing;

  if (isImported && !enIndexable) {
    // 한국어 수입글(또는 EN 번역 없음): 정본은 네이버, 색인 제외.
    return {
      title: `${post.title} — 법률 칼럼 | ETHOS`,
      description: post.excerpt,
      alternates: { canonical: post.originalUrl ?? slugPath },
      robots: { index: false, follow: true }
    };
  }

  // 색인 대상: (1) 자체 작성 원본글, (2) 수입글의 EN 번역.
  const canonical = enIndexable ? enPath : slugPath;
  // EN 번역본이 실제로 있을 때만 en 대체본을 광고(없으면 구글에 잘못된 대체 URL 신호 방지).
  const languages = isImported
    ? { en: enPath, ko: post.originalUrl ?? slugPath, "x-default": enPath } // 수입글: 한국어 정본은 네이버
    : post.hasEn
      ? { ko: slugPath, en: enPath, "x-default": slugPath }
      : { ko: slugPath, "x-default": slugPath };
  return {
    title: `${post.title} — 법률 칼럼 | ETHOS`,
    description: post.excerpt,
    alternates: { canonical, languages },
    robots: undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      locale: lang === "en" ? "en_US" : "ko_KR",
      alternateLocale: lang === "en" ? ["ko_KR"] : ["en_US"],
      // 언어별 OG 이미지 — 파일 컨벤션은 ?lang 을 못 받아 항상 한글이라, 쿼리를 읽는
      // 라우트(/blog/[slug]/og)로 지정해 EN 공유카드가 영문 제목으로 나오게 한다.
      images: [{ url: `${slugPath}/og?lang=${lang}`, width: 1200, height: 630 }]
    },
    twitter: {
      card: "summary_large_image",
      images: [`${slugPath}/og?lang=${lang}`]
    }
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

  // 조회수 증가(인기글 위젯용) — DB 글만, 렌더 비차단(best-effort).
  if (post.source === "db") {
    after(async () => {
      try {
        await prisma.blogPost.update({ where: { slug }, data: { viewCount: { increment: 1 } } });
      } catch {
        /* best-effort */
      }
    });
  }

  const all = await listBlogPosts();
  const [blogRelatedAutoEnabled, faqSchemaAutoEnabled, blogSeoAutoEnabled] = await Promise.all([
    isFeatureEnabled("blog_related_auto"),
    isFeatureEnabled("faq_schema_auto"),
    isFeatureEnabled("blog_seo_auto"),
  ]);
  let blogPostingSchema: Record<string, unknown> | null = null;
  if (blogSeoAutoEnabled) {
    const row = await prisma.siteSetting
      .findUnique({ where: { key: `blog.seo.${post.slug}` } })
      .catch(() => null);
    if (row?.value) {
      try {
        const parsed = JSON.parse(row.value) as { schemaOrg?: Record<string, unknown> };
        if (parsed.schemaOrg) blogPostingSchema = parsed.schemaOrg;
      } catch {
        /* ignore */
      }
    }
  }
  const faqPairs = faqSchemaAutoEnabled ? extractFaqPairs(post.contentHtml) : [];
  const dbRelated = blogRelatedAutoEnabled
    ? await getRelatedBlogPosts(post.category).catch(() => [])
    : [];

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
      <BlogScrollTracker slug={post.slug} />
      <BlogMidCta category={publicCategoryLabel(toPublicCategoryLoose(post.category), lang)} lang={lang} />
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        url={lang === "en" ? `/blog/${post.slug}?lang=en` : `/blog/${post.slug}`}
        publishedAt={post.date}
        inLanguage={lang === "en" ? "en" : "ko"}
      />
      {blogPostingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema).replace(/</g, "\\u003c") }}
        />
      )}
      <BreadcrumbJsonLd
        items={[
          { name: lang === "en" ? "Home" : "홈", url: lang === "en" ? "/?lang=en" : "/" },
          { name: lang === "en" ? "Blog" : "블로그", url: lang === "en" ? "/blog?lang=en" : "/blog" },
          { name: post.title, url: `/blog/${post.slug}${lang === "en" ? "?lang=en" : ""}` },
        ]}
      />
      {faqPairs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqPairs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
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

      {await isFeatureEnabled("blog_ai_summary") && await (async () => {
        const summaryData = await generateBlogSummary(post.contentHtml);
        return <BlogSummaryCard summary={summaryData.summary} readingTimeMin={summaryData.readingTimeMin} />;
      })()}

      <article className="mt-8">
        <span className="rounded-full bg-gold-soft/60 px-3 py-1 font-serif text-xs font-bold text-gold-deep">
          {publicCategoryLabel(toPublicCategoryLoose(post.category), lang)}
        </span>
        <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readMin}{lang === "en" ? " min read" : "분 소요"}</span>
        </div>

        {/* 관리자 지정 태그 — 저장된 tags 를 공개 표시(링크 없음, 국·영 공통) */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {post.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-gold-soft/40 px-2.5 py-0.5 text-[11px] font-semibold text-gold-deep"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 글 키워드 badges — /keyword/* 는 국문 전용이라 EN 에선 숨김 */}
        {lang !== "en" && (() => {
          const kw = extractKeywords(`${post.title} ${post.contentHtml}`);
          if (kw.length === 0) return null;
          return (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold-deep">키워드</span>
              {kw.map((k) => (
                <Link
                  key={k.term}
                  href={`/keyword/${encodeURIComponent(k.term)}`}
                  data-funnel="blog_top_keyword"
                  className="inline-flex items-center rounded-full border border-gold/40 bg-gold-soft/30 px-2.5 py-0.5 text-[11px] font-bold text-gold-deep transition hover:bg-gold-soft/60"
                >
                  #{k.label}
                </Link>
              ))}
            </div>
          );
        })()}

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
              {lang === "en" ? "View original (Naver Blog) ↗" : "원본 보기 (Naver Blog) ↗"}
            </a>
          </p>
        )}

        <div className="ethos-rule my-8">{publicCategoryLabel(toPublicCategoryLoose(post.category), lang)}</div>

        <div
          className="prose prose-sm max-w-none font-serif text-base leading-8 text-text [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-2 [&>p:first-of-type]:first-letter:font-serif [&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:font-extrabold [&>p:first-of-type]:first-letter:leading-[0.8] [&>p:first-of-type]:first-letter:text-gold-deep [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:text-primary"
          dangerouslySetInnerHTML={{ __html: autoLinkKeywords(sanitizeHtml(post.contentHtml)) }}
        />

        <BlogInlineCta category={post.category} lang={lang} />

        {dbRelated.length > 0 && (
          <section className="my-10 rounded-xl border border-gold/20 bg-surface p-5">
            <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-gold-deep">
              {lang === "en" ? "Related posts" : "관련 글"}
            </p>
            <ul className="mt-3 space-y-2">
              {dbRelated.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}${lang === "en" ? "?lang=en" : ""}`}
                    className="text-sm font-medium text-primary hover:text-gold-deep hover:underline"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ShareButtons title={post.title} />

        {/* 하단 서비스별 CTA — 이 글 분야의 서비스 페이지 + 상담 연결 */}
        {(() => {
          const svc = CATEGORY_SERVICE[toPublicCategoryLoose(post.category)];
          return (
            <div className="mt-10 rounded-2xl border border-gold/30 bg-gold-soft/10 p-6 text-center">
              <p className="ethos-eyebrow text-gold-deep">
                {lang === "en" ? "Need help with this?" : "이 분야, 도움이 필요하세요?"}
              </p>
              <h3 className="ethos-display mt-2 text-xl text-primary sm:text-2xl">
                {lang === "en" ? svc.en : svc.ko}
              </h3>
              <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={lang === "en" ? "/intake?lang=en" : "/intake"}
                  className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-bold text-white transition hover:bg-text-strong"
                >
                  {lang === "en" ? "Free review" : "무료 검토 신청"}
                </Link>
                <Link
                  href={lang === "en" ? `${svc.href}?lang=en` : svc.href}
                  className="inline-flex h-11 items-center rounded-lg border border-primary/40 px-6 text-sm font-semibold text-primary transition hover:bg-primary/5"
                >
                  {lang === "en" ? "See service →" : `${svc.ko} 보기 →`}
                </Link>
              </div>
            </div>
          );
        })()}
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
                href={`/blog/${r.slug}${lang === "en" ? "?lang=en" : ""}`}
                className="group block rounded-xl border border-gold/20 bg-surface p-5 transition hover:border-gold/50 hover:shadow-panel"
              >
                <span className="inline-block rounded-full bg-gold-soft/50 px-2.5 py-0.5 font-serif text-[11px] font-bold text-gold-deep">
                  {publicCategoryLabel(toPublicCategoryLoose(r.category), lang)}
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

      {await isFeatureEnabled("blog_related_posts") && await (async () => {
        const relatedPosts = await getRelatedPosts(post.slug, post.category);
        return <BlogRelatedPosts posts={relatedPosts} lang={lang} />;
      })()}

      <RelatedKeywords category={post.category} lang={lang} />
      <BlogCta category={post.category} lang={lang} />
      <BlogCategoryCta category={post.category} lang={lang} />

      <p className="mt-8 rounded-lg border border-gold/30 bg-surface-muted/40 px-4 py-3 text-xs italic text-text-muted">
        {lang === "en"
          ? "* This column is general information, not legal advice for a specific case."
          : "※ 본 칼럼은 일반적 안내이며, 개별 사안에 대한 법률 자문이 아닙니다."}
      </p>
    </div>
  );
}
