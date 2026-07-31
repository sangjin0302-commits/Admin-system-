import { NextResponse } from "next/server";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { prisma } from "@/lib/prisma/client";
import { translateBlogPostTo } from "@/lib/services/blog-translation-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BATCH_SIZE = 5;

export async function GET(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { id: true, slug: true, title: true, titleEn: true, bodyEn: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    // 정책: 웹은 한글+영어 고정 → EN 커버리지만 추적(중국어 제외).
    const status = posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      hasEn: Boolean(p.titleEn && p.bodyEn),
    }));

    return NextResponse.json({
      posts: status,
      pendingCount: status.filter((s) => !s.hasEn).length,
    });
  } catch (error) {
    console.error("[admin/blog-translate-batch] GET failed", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("blog_auto_translate"))) {
    return NextResponse.json({ error: "feature disabled" }, { status: 403 });
  }

  try {
    const candidates = await prisma.blogPost.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      excerpt: true,
      body: true,
      titleEn: true,
      bodyEn: true,
      excerptEn: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  const results: Array<{ postId: string; en?: boolean; error?: string }> = [];
  let processed = 0;

  for (const post of candidates) {
    if (processed >= BATCH_SIZE) break;

    // 정책: EN 만 백필(중국어 제외). 이미 EN 있으면 스킵.
    const needsEn = !(post.titleEn && post.bodyEn);
    if (!needsEn) continue;

    const input = { title: post.title, excerpt: post.excerpt, body: post.body };
    const entry: { postId: string; en?: boolean; error?: string } = { postId: post.id };

    const en = await translateBlogPostTo(input, "en");
    if (en) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { titleEn: en.title, excerptEn: en.excerpt, bodyEn: en.body },
      });
      entry.en = true;
    } else {
      entry.en = false;
      entry.error = "en translation failed";
    }

    results.push(entry);
    processed += 1;
  }

    return NextResponse.json({ processed, results });
  } catch (error) {
    console.error("[admin/blog-translate-batch] POST failed", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
