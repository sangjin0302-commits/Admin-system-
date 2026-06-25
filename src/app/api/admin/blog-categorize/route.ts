import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import { prisma } from "@/lib/prisma/client";
import { classifyBlogPost } from "@/lib/services/blog-categorizer";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const onlyNaver = url.searchParams.get("onlyNaver") !== "0";
  const force = url.searchParams.get("force") === "1";

  const where = onlyNaver
    ? { source: NAVER_BLOG_SOURCE, ...(force ? {} : { category: "naver" }) }
    : force
      ? {}
      : { OR: [{ category: "naver" }, { category: "" }, { category: null as never }] };

  const posts = await prisma.blogPost.findMany({
    where,
    select: { id: true, title: true, excerpt: true, body: true }
  });

  let updated = 0;
  const counts: Record<string, number> = {};
  for (const p of posts) {
    const text = `${p.title}\n${p.excerpt ?? ""}\n${(p.body ?? "").slice(0, 4000)}`;
    const cat = classifyBlogPost(text);
    counts[cat] = (counts[cat] ?? 0) + 1;
    await prisma.blogPost.update({ where: { id: p.id }, data: { category: cat } });
    updated++;
  }

  return NextResponse.json({ ok: true, updated, counts });
}
