import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { logSearch } from "@/lib/services/search-log-service";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";

// q 쿼리 읽기 + logSearch 부작용 있어 동적. 캐시는 아래 Cache-Control 헤더가 담당
// (q 없으면 CDN 300초, q 있으면 no-store). revalidate 는 force-dynamic 과 모순이라 제거.
export const dynamic = "force-dynamic";

/**
 * 블로그 글 검색 인덱스.
 * - q 없음: 최신 300건 인덱스 (클라이언트 Fuse.js)
 * - q 있음: server-side title/excerpt contains 우선 (한글 형태소 X, 빠른 부분일치)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const baseWhere = { published: true, source: NAVER_BLOG_SOURCE };
  const where = q
    ? {
        ...baseWhere,
        OR: [
          { title: { contains: q } },
          { excerpt: { contains: q } },
          { body: { contains: q } }
        ]
      }
    : baseWhere;

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: q ? 50 : 300,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      publishedAt: true
    }
  }).catch(() => []);

  if (q) {
    // Non-blocking: never delay the response on log-write failures.
    void logSearch(q, posts.length);
  }

  return NextResponse.json(
    {
      ok: true,
      q,
      posts: posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        category: p.category,
        date: p.publishedAt?.toISOString().slice(0, 10) ?? ""
      }))
    },
    { headers: { "Cache-Control": q ? "no-store" : "public, max-age=300, s-maxage=300" } }
  );
}
