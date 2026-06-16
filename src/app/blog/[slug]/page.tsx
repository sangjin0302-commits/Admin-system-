import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { BlogToc } from "@/components/public/blog-toc";
import { ShareButtons } from "@/components/public/share-buttons";
import { getBlogPostBySlug, listBlogPosts } from "@/lib/blog-posts";

export async function generateStaticParams() {
  const posts = await listBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "글을 찾을 수 없습니다" };
  return {
    title: `${post.title} — 법률 칼럼 | ETHOS`,
    description: post.excerpt
  };
}

export default async function BlogDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  // 관련 글 (같은 카테고리 우선, 현재 제외, 최대 3)
  const all = await listBlogPosts();
  const related = [
    ...all.filter((p) => p.slug !== post.slug && p.category === post.category),
    ...all.filter((p) => p.slug !== post.slug && p.category !== post.category)
  ].slice(0, 3);

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      {/* 데스크탑 우측 목차 (xl 이상) */}
      <div className="absolute left-full top-20 hidden h-full pl-10 xl:block">
        <div className="w-56">
          <BlogToc />
        </div>
      </div>

      <Link href="/blog" className="font-serif text-xs text-text-muted hover:text-primary">
        ← 법률 칼럼 목록
      </Link>

      <article className="mt-8">
        <span className="rounded-full bg-gold-soft/60 px-3 py-1 font-serif text-xs font-bold text-gold-deep">
          {post.category}
        </span>
        <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readMin}분 소요</span>
        </div>

        <div className="ethos-rule my-8">{post.category}</div>

        <div
          className="prose prose-sm max-w-none font-serif text-base leading-8 text-text [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-2 [&>p:first-of-type]:first-letter:font-serif [&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:font-extrabold [&>p:first-of-type]:first-letter:leading-[0.8] [&>p:first-of-type]:first-letter:text-gold-deep [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:text-primary"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <ShareButtons title={post.title} />
      </article>

      {/* 관련 글 */}
      {related.length > 0 && (
        <section className="mt-14 border-t border-gold/20 pt-10">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">관련 칼럼</p>
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

      <Card className="mt-12 bg-primary p-7 text-center text-white">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-soft">관련 사안 상담</p>
        <h2 className="mt-3 font-serif text-xl font-bold">사실관계를 함께 확인합니다</h2>
        <Link
          href="/intake"
          className="mt-5 inline-flex h-11 items-center rounded-lg bg-gold px-6 font-serif text-sm font-bold text-primary hover:bg-gold-soft"
        >
          상담 신청
        </Link>
      </Card>

      <p className="mt-8 rounded-lg border border-gold/30 bg-surface-muted/40 px-4 py-3 text-xs italic text-text-muted">
        ※ 본 칼럼은 일반적 안내이며, 개별 사안에 대한 법률 자문이 아닙니다.
      </p>
    </div>
  );
}
