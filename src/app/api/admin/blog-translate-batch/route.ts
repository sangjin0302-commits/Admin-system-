import { NextResponse } from "next/server";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { prisma } from "@/lib/prisma/client";
import {
  translateBlogPostTo,
  saveBlogTranslationZh,
  getBlogTranslationZh,
} from "@/lib/services/blog-translation-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BATCH_SIZE = 5;

export async function GET(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { id: true, slug: true, title: true, titleEn: true, bodyEn: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const zhKeys = posts.map((p) => `blog.translation.zh.${p.id}`);
  const zhRows = await prisma.siteSetting.findMany({
    where: { key: { in: zhKeys } },
    select: { key: true },
  });
  const zhSet = new Set(zhRows.map((r) => r.key));

  const status = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    hasEn: Boolean(p.titleEn && p.bodyEn),
    hasZh: zhSet.has(`blog.translation.zh.${p.id}`),
  }));

  return NextResponse.json({
    posts: status,
    pendingCount: status.filter((s) => !s.hasEn || !s.hasZh).length,
  });
}

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("blog_auto_translate"))) {
    return NextResponse.json({ error: "feature disabled" }, { status: 403 });
  }

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

  const results: Array<{ postId: string; en?: boolean; zh?: boolean; error?: string }> = [];
  let processed = 0;

  for (const post of candidates) {
    if (processed >= BATCH_SIZE) break;

    const needsEn = !(post.titleEn && post.bodyEn);
    const zhExisting = await getBlogTranslationZh(post.id);
    const needsZh = !zhExisting;

    if (!needsEn && !needsZh) continue;

    const input = { title: post.title, excerpt: post.excerpt, body: post.body };
    const entry: { postId: string; en?: boolean; zh?: boolean; error?: string } = { postId: post.id };

    if (needsEn) {
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
    }

    if (needsZh) {
      const zh = await translateBlogPostTo(input, "zh");
      if (zh) {
        await saveBlogTranslationZh(post.id, zh);
        entry.zh = true;
      } else {
        entry.zh = false;
        entry.error = (entry.error ? entry.error + "; " : "") + "zh translation failed";
      }
    }

    results.push(entry);
    processed += 1;
  }

  return NextResponse.json({ processed, results });
}
