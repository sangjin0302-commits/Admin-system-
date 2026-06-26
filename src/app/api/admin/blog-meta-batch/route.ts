import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import { prisma } from "@/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { generateMetaDescription } from "@/lib/services/blog-meta-generator";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 블로그 글 description meta 일괄 생성 (Anthropic Haiku).
 * /api/admin/blog-meta-batch?max=50&onlyMissing=1
 */
export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY 미설정" }, { status: 400 });
  }

  const url = new URL(request.url);
  const max = Math.min(100, Math.max(1, Number(url.searchParams.get("max") ?? 30)));
  const onlyMissing = url.searchParams.get("onlyMissing") !== "0";

  // excerpt가 짧거나 (< 50자) 없는 글만
  const where = onlyMissing
    ? {
        published: true,
        source: NAVER_BLOG_SOURCE,
        OR: [{ excerpt: null as never }, { excerpt: "" }]
      }
    : { published: true, source: NAVER_BLOG_SOURCE };

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: max,
    select: { id: true, title: true, excerpt: true, body: true }
  });

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const p of posts) {
    // 조건: 기존 excerpt가 짧으면 재생성
    if (onlyMissing && p.excerpt && p.excerpt.length >= 50) {
      skipped++;
      continue;
    }
    try {
      const desc = await generateMetaDescription({ title: p.title, body: p.body });
      if (!desc) {
        errors.push(`${p.id}: no output`);
        continue;
      }
      await prisma.blogPost.update({
        where: { id: p.id },
        data: { excerpt: desc }
      });
      updated++;
      await new Promise((r) => setTimeout(r, 600)); // Anthropic rate
    } catch (err) {
      errors.push(`${p.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  logger.info("[blog-meta-batch] done", { updated, skipped, errors: errors.length });
  return NextResponse.json({ ok: true, updated, skipped, errors });
}
