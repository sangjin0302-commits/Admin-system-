import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";

export const dynamic = "force-dynamic";
export const revalidate = 300;

/**
 * 블로그 글 검색 인덱스 (경량). 클라이언트에서 Fuse.js로 매칭.
 */
export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true, source: NAVER_BLOG_SOURCE },
    orderBy: { publishedAt: "desc" },
    take: 300,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      publishedAt: true
    }
  }).catch(() => []);

  return NextResponse.json(
    {
      ok: true,
      posts: posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        category: p.category,
        date: p.publishedAt?.toISOString().slice(0, 10) ?? ""
      }))
    },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
  );
}
