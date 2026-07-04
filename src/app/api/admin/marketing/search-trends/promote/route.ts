import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `draft-${Date.now()}`;
}

export async function POST(request: Request) {
  let term: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    term = typeof body?.term === "string" ? body.term.trim() : undefined;
  } catch {
    // ignore
  }
  if (!term) return NextResponse.json({ ok: false, error: "MISSING_TERM" }, { status: 400 });

  let slug = slugify(term);
  let suffix = 0;
  try {
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${slugify(term)}-${suffix}`;
      if (suffix > 20) break;
    }
    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: term,
        excerpt: `검색 트렌드에서 발굴된 소재: ${term}`,
        body: `# ${term}\n\n작성 예정.`,
        category: "general",
        published: false,
        source: "search-trend",
      },
    });
    return NextResponse.json({ ok: true, slug: post.slug, id: post.id });
  } catch (err) {
    logger.warn("[search-trends/promote] create failed", err);
    return NextResponse.json({ ok: false, error: "CREATE_FAILED" }, { status: 500 });
  }
}
