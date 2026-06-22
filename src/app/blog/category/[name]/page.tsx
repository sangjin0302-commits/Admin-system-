import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { listBlogPosts } from "@/lib/blog-posts";
import { prisma } from "@/lib/prisma/client";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethos.kr";

type Item = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
};

async function loadCategoryPosts(category: string): Promise<Item[]> {
  const out: Item[] = [];

  const md = await listBlogPosts().catch(() => []);
  for (const p of md) {
    if (p.category.toLowerCase() === category.toLowerCase()) {
      out.push({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        date: p.date,
        category: p.category,
      });
    }
  }

  try {
    const db = await prisma.blogPost.findMany({
      where: { published: true, category: { equals: category } },
      orderBy: { publishedAt: "desc" },
      take: 100,
    });
    for (const p of db) {
      if (out.find((x) => x.slug === p.slug)) continue;
      out.push({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        date: (p.publishedAt ?? p.createdAt).toISOString().slice(0, 10),
        category: p.category,
      });
    }
  } catch {
    // ignore
  }

  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `${decoded} — 블로그 | ETHOS 행정사사무소`,
    description: `${decoded} 카테고리의 행정사 실무·법령 해설 글 모음.`,
    alternates: { canonical: `/blog/category/${name}` },
  };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const posts = await loadCategoryPosts(decoded);
  if (posts.length === 0) notFound();

  const itemListJson = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${decoded} — ETHOS 블로그`,
    itemListElement: posts.map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE_URL}/blog/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJson) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: "/" },
          { name: "블로그", url: "/blog" },
          { name: decoded, url: `/blog/category/${name}` },
        ]}
      />

      <p className="ui-kicker">Category</p>
      <h1 className="ethos-display mt-2 text-3xl sm:text-4xl">{decoded}</h1>
      <p className="mt-2 text-sm text-text-muted">
        {posts.length}개의 글 · 행정사 실무 · 법령 해설
      </p>

      <ul className="mt-8 space-y-4">
        {posts.map((p) => (
          <li key={p.slug}>
            <Card className="p-5 hover:border-text-strong">
              <Link href={`/blog/${p.slug}`} className="block">
                <p className="text-xs text-text-muted">{p.date}</p>
                <h2 className="mt-1 text-lg font-semibold text-text-strong">
                  {p.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-text-muted">
                  {p.excerpt}
                </p>
              </Link>
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link
          href="/blog"
          className="text-sm text-primary underline"
        >
          ← 블로그 전체로
        </Link>
      </div>
    </div>
  );
}
