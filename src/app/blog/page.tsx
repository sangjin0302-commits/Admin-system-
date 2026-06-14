import Link from "next/link";
import type { Metadata } from "next";

import { BlogGrid } from "@/components/public/blog-grid";
import { Reveal } from "@/components/public/reveal";
import { listBlogPosts } from "@/lib/blog-posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "법률 칼럼 — ETHOS 행정사사무소",
  description: "비자, 행정심판, 계약서, 인허가 관련 법률 칼럼."
};

export default async function BlogPage() {
  const posts = await listBlogPosts();

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Legal Column</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">법률 칼럼</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-text-muted">
              비자, 행정심판, 계약서, 인허가 관련 실무 정보를 정리합니다.
              <br />※ 일반적 안내이며, 개별 사안에 대한 법률 자문이 아닙니다.
            </p>
          </Reveal>
        </div>
      </section>

      {posts.length === 0 ? (
        <section className="pb-24">
          <p className="text-center text-sm text-text-muted">아직 게시된 칼럼이 없습니다.</p>
        </section>
      ) : (
        <>
          {/* Featured — DARK band */}
          <FeaturedSection post={posts[0]} />

          {/* 나머지 칼럼 — 필터 + 검색 */}
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

      {/* CTA */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Have a question?</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">궁금한 사안이 있으신가요?</h2>
            <p className="mt-4 text-sm leading-7 text-text-muted">
              칼럼은 일반 안내이며, 개별 사안은 상담 신청 후 사실관계를 확인하며 검토합니다.
            </p>
            <Link
              href="/intake"
              className="mt-9 inline-flex h-12 items-center rounded-lg bg-primary px-8 text-sm font-bold text-white transition hover:bg-text-strong"
            >
              상담 신청하기
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function FeaturedSection({ post }: { post: Awaited<ReturnType<typeof listBlogPosts>>[number] }) {
  return (
    <section className="ethos-band ethos-band-dark ethos-grain py-20 sm:py-24">
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
