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

        <div className="my-8 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gold" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          <span className="h-px w-12 bg-gold" />
        </div>

        <div
          className="prose prose-sm max-w-none font-serif text-base leading-8 text-text [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:text-primary"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <ShareButtons title={post.title} />
      </article>

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
