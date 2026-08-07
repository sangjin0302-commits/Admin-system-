import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { listBlogPosts } from "@/lib/blog-posts";
import { prisma } from "@/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { PUBLIC_CATEGORY_LABEL, publicCategoryLabel, toPublicCategory, type PublicCategory } from "@/lib/services/blog-categorizer";
import { compareBoardCards } from "@/lib/blog/board-sort";
import { BlogTagCloud } from "@/components/public/blog-tag-cloud";
import { NewsletterSubscribeForm } from "@/components/public/newsletter-subscribe-form";
import { getRequestLocale } from "@/lib/i18n-request";
import { localePath } from "@/lib/i18n-locale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "법률 칼럼 — 에토스 행정사사무소(ETHOS)",
  description: "비자, 행정심판, 계약서, 인허가 관련 법률 칼럼.",
  // 국문 목록과 영문 목록(?lang=en)을 hreflang 로 서로 연결한다.
  alternates: {
    canonical: "/blog",
    languages: { ko: "/blog", en: "/en/blog", "x-default": "/blog" }
  }
};

type Lang = "ko" | "en";

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string; cat?: string; board?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const lang: Lang = await getRequestLocale(sp.lang);
  // ?cat= 값은 공개 카테고리 키만 허용(잘못된 값이면 전체로 폴백).
  const activeCat: PublicCategory | null =
    sp.cat && sp.cat in PUBLIC_CATEGORY_LABEL ? (sp.cat as PublicCategory) : null;
  const activeBoard = sp.board?.trim() || null;

  const posts = await listBlogPosts();

  const importedPosts = await prisma.blogPost.findMany({
    // 네이버 수입글 + 직접 작성글(source=manual 등) 모두 노출. 예전엔 NAVER 만 조회해
    // 관리자가 직접 쓴 글이 공개 리스트에서 누락됐음.
    where: { published: true },
    orderBy: [{ pinned: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }],
    // 사실상 무제한(작성 개수 제한 없음). 표시 상한만 크게. 수천 편 이상 커지면
    // 페이지네이션이 정석이나, 현재 규모에선 전량 표시가 단순·안전.
    take: 5000,
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
      board: true,
      coverImage: true,
      tags: true,
      pinned: true,
      sortOrder: true,
    },
  }).catch(() => [] as never[]);

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
    board: string | null;
    tags: string[];
    pinned: boolean;
    sortOrder: number;
  };
  const parseTags = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    try {
      const a = JSON.parse(raw);
      if (Array.isArray(a)) return a.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    } catch {
      /* 구형 콤마문자열 폴백 */
    }
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  };
  const decodeTitle = (s: string): string => {
    if (!s.includes("%") && !s.includes("+")) return s;
    try {
      return decodeURIComponent(s.replace(/\+/g, " "));
    } catch {
      return s.replace(/\+/g, " ");
    }
  };
  const allCards: BoardCard[] = [
    ...importedPosts.map((p) => ({
      key: p.id,
      href: `/blog/${p.slug}${lang === "en" ? "?lang=en" : ""}`,
      title: decodeTitle(lang === "en" ? p.titleEn || p.title : p.title),
      excerpt: lang === "en" ? p.excerptEn || p.excerpt : p.excerpt,
      cover: p.coverImage ?? null,
      dateMs: p.publishedAt ? p.publishedAt.getTime() : 0,
      dateLabel: p.publishedAt?.toLocaleDateString(lang === "en" ? "en-US" : "ko-KR") ?? "",
      publicCat: toPublicCategory(p.category),
      board: p.board ?? null,
      tags: parseTags(p.tags),
      pinned: p.pinned,
      sortOrder: p.sortOrder,
    })),
    // DB에 같은 slug 가 있으면 마크다운 카드는 제외(이중 노출 방지).
    ...posts
      .filter((p) => !importedPosts.some((d) => d.slug === p.slug))
      .map((p) => ({
      key: `md-${p.slug}`,
      href: `/blog/${p.slug}${lang === "en" ? "?lang=en" : ""}`,
      title: decodeTitle(p.title),
      excerpt: p.excerpt,
      cover: null,
      dateMs: p.date ? new Date(p.date).getTime() : 0,
      dateLabel: p.date,
      publicCat: labelToPublic(p.category),
      board: null,
      tags: [],
      pinned: false,
      sortOrder: 0,
    })),
  ].sort(compareBoardCards);
  const boardCounts = (Object.keys(PUBLIC_CATEGORY_LABEL) as PublicCategory[])
    .map((c) => ({ cat: c, count: allCards.filter((x) => x.publicCat === c).length }))
    .filter((x) => x.count > 0);
  // 게시판(폴더) 목록 — 관리자가 지정한 board 값들. 글 수 순.
  const boardFolders = Array.from(
    allCards.reduce((m, c) => {
      if (c.board) m.set(c.board, (m.get(c.board) ?? 0) + 1);
      return m;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
  let board = allCards;
  if (activeBoard) board = board.filter((c) => c.board === activeBoard);
  if (activeCat) board = board.filter((c) => c.publicCat === activeCat);
  const featured = board[0];
  const rest = board.slice(1);

  // 인기글 위젯 — 조회수 상위(social proof). 조회 0뿐이면 숨김.
  const popularRows = await prisma.blogPost
    .findMany({
      where: { published: true, viewCount: { gt: 0 } },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { slug: true, title: true, titleEn: true, viewCount: true }
    })
    .catch(() => []);

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
                      {publicCategoryLabel(featured.publicCat, lang)}
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
                        referrerPolicy="no-referrer"
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

      {/* 단일 게시판 — 게시판(폴더) + 카테고리 필터 + 카드뉴스 커버 그리드 */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* 게시판(폴더) 필터 — 관리자가 지정한 board 폴더별. */}
          {boardFolders.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-gold-deep">
                {lang === "en" ? "Folders" : "게시판"}
              </span>
              <Link
                href={localePath("/blog", lang)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${!activeBoard ? "bg-gold-deep text-white" : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"}`}
              >
                {lang === "en" ? "All" : "전체"}
              </Link>
              {boardFolders.map(({ name, count }) => (
                <Link
                  key={name}
                  href={`${localePath("/blog", lang)}${localePath("/blog", lang).includes("?") ? "&" : "?"}board=${encodeURIComponent(name)}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${activeBoard === name ? "bg-gold-deep text-white" : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"}`}
                >
                  {name} <span className="opacity-70">({count})</span>
                </Link>
              ))}
            </div>
          )}
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
                  {publicCategoryLabel(cat, lang)} <span className="opacity-70">({count})</span>
                </Link>
              ))}
            </div>
          )}

          {board.length === 0 ? (
            <p className="mt-10 text-sm text-text-muted">
              {lang === "en" ? "No posts yet." : "아직 등록된 글이 없습니다."}
            </p>
          ) : rest.length === 0 ? null : (
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
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="inline-block w-fit rounded-full bg-gold-soft/50 px-2.5 py-0.5 font-serif text-[11px] font-bold text-gold-deep">
                      {publicCategoryLabel(c.publicCat, lang)}
                    </span>
                    <h3 className="mt-3 font-serif text-sm font-bold leading-snug text-primary group-hover:text-gold-deep line-clamp-2">
                      {c.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-6 text-text-muted">{c.excerpt}</p>
                    {c.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-gold-soft/30 px-2 py-0.5 text-[10px] font-semibold text-gold-deep">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-3 text-[11px] text-text-muted">{c.dateLabel}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 인기글 — 조회수 상위(social proof) */}
      {popularRows.length > 0 && (
        <section className="py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="ethos-eyebrow">{lang === "en" ? "Most read" : "많이 본 칼럼"}</h2>
            <ol className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
              {popularRows.map((p, i) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}${lang === "en" ? "?lang=en" : ""}`}
                    className="flex items-center gap-4 px-5 py-3 transition hover:bg-surface-muted"
                  >
                    <span className="font-serif text-lg font-bold text-gold-deep">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-strong">
                      {lang === "en" ? p.titleEn || p.title : p.title}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">{p.viewCount.toLocaleString()} views</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* 태그 클라우드 */}
      <BlogTagCloud lang={lang} />

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
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={lang === "en" ? "/intake?lang=en" : "/intake"}
                className="inline-flex h-12 items-center rounded-lg bg-primary px-8 text-sm font-bold text-white transition hover:bg-text-strong"
              >
                {lang === "en" ? "Request Consultation" : "상담 신청하기"}
              </Link>
              <Link
                href="/quick-check"
                className="inline-flex h-12 items-center rounded-lg border border-primary/40 px-8 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                {lang === "en" ? "Free AI case check" : "무료 AI 사전진단"}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
