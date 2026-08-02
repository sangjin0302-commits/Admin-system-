import Link from "next/link";

import { publicCategoryLabel, toPublicCategory } from "@/lib/services/blog-categorizer";

/** %-인코딩된 제목(과거 수입 데이터 오류)을 표시용으로 방어적 디코드. 실패 시 원문. */
function decodeTitle(s: string): string {
  if (!s.includes("%") && !s.includes("+")) return s;
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s.replace(/\+/g, " ");
  }
}

export type ShowcasePost = {
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string;
  excerptEn: string | null;
  category: string;
  coverImage: string | null;
};

/**
 * 홈 블로그 쇼케이스 — 네이버 자동수입 최신글을 카드뉴스 커버와 함께 노출.
 * 자사 도메인(/blog/[slug])으로 링크해 SEO 자산·체류시간·전환을 키운다.
 * (라이브 네이버 위젯과 달리 방문자를 네이버로 내보내지 않음.)
 */
export function HomeBlogShowcase({
  posts,
  lang = "ko"
}: {
  posts: ShowcasePost[];
  lang?: "ko" | "en";
}) {
  if (posts.length === 0) return null;
  const en = lang === "en";

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ethos-eyebrow">Legal Column</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">
              {en ? "Latest legal columns" : "최신 법률 칼럼"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-muted">
              {en
                ? "Practical insights on visas, appeals, and permits — updated regularly."
                : "비자·행정심판·인허가 실무 인사이트를 꾸준히 업데이트합니다."}
            </p>
          </div>
          <Link
            href={en ? "/blog?lang=en" : "/blog"}
            className="inline-flex h-11 w-fit items-center rounded-full border border-line bg-surface px-6 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            {en ? "View all columns →" : "칼럼 전체보기 →"}
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => {
            const title = decodeTitle(en ? p.titleEn || p.title : p.title);
            const excerpt = en ? p.excerptEn || p.excerpt : p.excerpt;
            return (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}${en ? "?lang=en" : ""}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gold/20 bg-surface transition hover:border-gold/50 hover:shadow-floating"
              >
                {p.coverImage ? (
                  <div className="aspect-[16/9] overflow-hidden bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.coverImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-primary/5">
                    <span className="ethos-quote text-5xl text-gold/40">&ldquo;</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <span className="inline-block w-fit rounded-full bg-gold-soft/50 px-2.5 py-0.5 font-serif text-[11px] font-bold text-gold-deep">
                    {publicCategoryLabel(toPublicCategory(p.category), lang)}
                  </span>
                  <h3 className="mt-3 font-serif text-base font-bold leading-snug text-primary group-hover:text-gold-deep line-clamp-2">
                    {title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-6 text-text-muted">{excerpt}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
