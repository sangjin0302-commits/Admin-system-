import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { onBlogPublished } from "@/lib/services/pr-syndication-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { generateSeoMeta } from "@/lib/services/blog-seo-service";
import { ensureDisclaimer } from "@/lib/services/blog-disclaimer-service";
import { assertBlogCreateAllowed, BlogContentPolicyError } from "@/lib/services/blog-content-policy";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { parseCardNews, serializeCardNews } from "@/lib/services/card-news";

/** 빈 문자열/공백/비문자열 → null. EN 선택 필드 정규화. */
function normalizeOptionalText(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

/** 카드뉴스(JSON 문자열 or 배열)를 검증·재직렬화. 빈/깨진 값은 null. */
function normalizeCardNews(v: unknown): string | null {
  return serializeCardNews(parseCardNews(v));
}

/** 예약 게시 시각 파싱. 유효한 미래/과거 ISO 만 Date, 그 외 null. */
function parseScheduledAt(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function maybeApplyDisclaimer(body: string, published: boolean): Promise<string> {
  if (!published) return body;
  try {
    if (!(await isFeatureEnabled("auto_disclaimer"))) return body;
    return ensureDisclaimer(body);
  } catch (err) {
    logger.warn("[auto-disclaimer] 적용 실패", err);
    return body;
  }
}

async function applyBlogSeoAuto(postId: string): Promise<void> {
  try {
    if (!(await isFeatureEnabled("blog_seo_auto"))) return;
    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post || !post.published) return;
    const seo = await generateSeoMeta({
      id: post.id,
      slug: post.slug,
      title: post.title,
      body: post.body,
      excerpt: post.excerpt,
      category: post.category,
      coverImage: post.coverImage,
      authorName: post.authorName,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
    });
    // Store meta description in excerpt (reused by /blog/[slug] metadata)
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { excerpt: seo.metaDescription },
    });
    // Persist schema/OG in SiteSetting keyed per post for /blog/[slug] to consume
    await prisma.siteSetting.upsert({
      where: { key: `blog.seo.${post.slug}` },
      create: {
        key: `blog.seo.${post.slug}`,
        value: JSON.stringify({
          ogTitle: seo.ogTitle,
          ogDescription: seo.ogDescription,
          schemaOrg: seo.schemaOrg,
          generatedAt: new Date().toISOString(),
        }),
      },
      update: {
        value: JSON.stringify({
          ogTitle: seo.ogTitle,
          ogDescription: seo.ogDescription,
          schemaOrg: seo.schemaOrg,
          generatedAt: new Date().toISOString(),
        }),
      },
    });
  } catch (err) {
    logger.warn("[blog-seo-auto] generation failed", err);
  }
}

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const data = await request.json();
    // 정책: 네이버 수입글 외 임의 생성 차단.
    try {
      assertBlogCreateAllowed(data.source);
    } catch (e) {
      if (e instanceof BlogContentPolicyError) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: 403 });
      }
      throw e;
    }
    const finalBody = await maybeApplyDisclaimer(data.body ?? "", Boolean(data.published));
    const scheduledAt = parseScheduledAt(data.scheduledAt);
    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? "",
        body: finalBody,
        category: data.category ?? "other",
        tags: data.tags ?? "[]",
        published: data.published ?? false,
        publishedAt: data.published ? new Date() : null,
        pinned: Boolean(data.pinned),
        sortOrder: Math.max(0, Number.parseInt(String(data.sortOrder), 10) || 0),
        board: normalizeOptionalText(data.board),
        titleEn: normalizeOptionalText(data.titleEn),
        excerptEn: normalizeOptionalText(data.excerptEn),
        bodyEn: normalizeOptionalText(data.bodyEn),
        cardNews: normalizeCardNews(data.cardNews),
        cardNewsEn: normalizeCardNews(data.cardNewsEn),
        scheduledAt,
      },
    });
    if (post.published) {
      void onBlogPublished(post.id);
      void applyBlogSeoAuto(post.id);
    }
    return NextResponse.json(post);
  } catch (err) {
    logger.error("Blog create error:", err);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: "ID 필요" }, { status: 400 });

    const existing = await prisma.blogPost.findUnique({ where: { id: data.id } });
    const finalBody = await maybeApplyDisclaimer(data.body ?? "", Boolean(data.published));
    const post = await prisma.blogPost.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? "",
        body: finalBody,
        category: data.category ?? "other",
        tags: data.tags ?? "[]",
        published: data.published ?? false,
        publishedAt: data.published && !existing?.publishedAt ? new Date() : existing?.publishedAt,
        pinned: Boolean(data.pinned),
        sortOrder: Math.max(0, Number.parseInt(String(data.sortOrder), 10) || 0),
        board: normalizeOptionalText(data.board),
        titleEn: normalizeOptionalText(data.titleEn),
        excerptEn: normalizeOptionalText(data.excerptEn),
        bodyEn: normalizeOptionalText(data.bodyEn),
        cardNews: normalizeCardNews(data.cardNews),
        cardNewsEn: normalizeCardNews(data.cardNewsEn),
        scheduledAt: parseScheduledAt(data.scheduledAt),
      },
    });
    if (post.published && !existing?.published) {
      void onBlogPublished(post.id);
      void applyBlogSeoAuto(post.id);
    }
    return NextResponse.json(post);
  } catch (err) {
    logger.error("Blog update error:", err);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    let id = "";
    try {
      const data = await request.json();
      id = typeof data?.id === "string" ? data.id : "";
    } catch {
      id = new URL(request.url).searchParams.get("id") ?? "";
    }
    if (!id) return NextResponse.json({ error: "ID 필요" }, { status: 400 });
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Blog delete error:", err);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
