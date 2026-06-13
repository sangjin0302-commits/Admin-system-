import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { listBlogPosts } from "@/lib/blog-posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "법률 칼럼 — ETHOS 행정사사무소",
  description: "비자, 행정심판, 계약서, 인허가 관련 법률 칼럼."
};

export default async function BlogPage() {
  const posts = await listBlogPosts();

  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Legal Column</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-primary">법률 칼럼</h1>
        <p className="mt-6 text-sm text-text-muted">아직 게시된 칼럼이 없습니다.</p>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6 sm:py-20">
      <section className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Legal Column</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-primary sm:text-5xl">법률 칼럼</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
          비자, 행정심판, 계약서, 인허가 관련 실무 정보를 정리합니다.
          ※ 일반적 안내이며, 개별 사안에 대한 법률 자문이 아닙니다.
        </p>
      </section>

      {/* Featured */}
      <Card className="overflow-hidden p-0">
        <Link href={`/blog/${featured.slug}`} className="grid lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-gradient-to-br from-primary via-primary to-text-strong p-10 text-white sm:p-12">
            <span className="rounded-full bg-gold/30 px-3 py-1 text-xs font-bold text-gold-soft">FEATURED</span>
            <h2 className="mt-5 font-serif text-3xl font-bold leading-tight sm:text-4xl">{featured.title}</h2>
            <p className="mt-5 text-sm leading-7 text-white/80">{featured.excerpt}</p>
            <div className="mt-8 flex items-center gap-4 text-xs text-white/70">
              <span>{featured.category}</span>
              <span>·</span>
              <span>{featured.date}</span>
              <span>·</span>
              <span>읽는 시간 {featured.readMin}분</span>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-serif text-sm font-bold text-gold-soft">
              자세히 읽기 →
            </span>
          </div>
          <div className="hidden bg-gold-soft/40 p-10 lg:flex lg:items-center lg:justify-center">
            <div className="text-center">
              <div className="font-serif text-7xl font-bold italic text-primary/30">"</div>
              <p className="font-serif text-xl italic text-primary">
                절차에는 이성을,<br />사람에게는 공감을.
              </p>
            </div>
          </div>
        </Link>
      </Card>

      {/* 칼럼 목록 */}
      {rest.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group">
              <Card className="flex h-full flex-col p-6 transition hover:shadow-md">
                <span className="self-start rounded-full bg-gold-soft/60 px-3 py-1 text-[11px] font-bold text-gold-deep">
                  {p.category}
                </span>
                <h3 className="mt-4 font-serif text-lg font-bold leading-snug text-primary group-hover:text-gold-deep">
                  {p.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-text-muted">{p.excerpt}</p>
                <div className="mt-5 flex items-center justify-between border-t border-gold/20 pt-4 text-xs text-text-muted">
                  <span>{p.date}</span>
                  <span>{p.readMin}분 소요</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* CTA */}
      <section className="rounded-2xl border border-gold/30 bg-surface-muted/40 p-10 text-center sm:p-12">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Have a question?</p>
        <h2 className="mt-3 font-serif text-2xl font-bold text-primary sm:text-3xl">궁금한 사안이 있으신가요?</h2>
        <Link
          href="/intake"
          className="mt-6 inline-flex h-12 items-center rounded-lg bg-primary px-6 font-bold text-white hover:bg-text-strong"
        >
          상담 신청하기
        </Link>
      </section>
    </div>
  );
}
