import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { onBlogPublished } from "@/lib/services/pr-syndication-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { generateSeoMeta } from "@/lib/services/blog-seo-service";

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
  try {
    const data = await request.json();
    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? "",
        body: data.body,
        category: data.category ?? "general",
        tags: data.tags ?? "[]",
        published: data.published ?? false,
        publishedAt: data.published ? new Date() : null,
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
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: "ID 필요" }, { status: 400 });

    const existing = await prisma.blogPost.findUnique({ where: { id: data.id } });
    const post = await prisma.blogPost.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? "",
        body: data.body,
        category: data.category ?? "general",
        tags: data.tags ?? "[]",
        published: data.published ?? false,
        publishedAt: data.published && !existing?.publishedAt ? new Date() : existing?.publishedAt,
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
