import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import {
  translateBlogPostTo,
  getBlogTranslationZh,
  saveBlogTranslationZh,
  type TargetLang,
  type TranslatedContent,
} from "@/lib/services/blog-translation-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isTargetLang(v: unknown): v is TargetLang {
  return v === "en" || v === "zh";
}

export async function POST(req: Request) {
  let body: { postId?: string; targetLang?: string; publish?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const postId = body.postId?.trim();
  const targetLang = body.targetLang;
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });
  if (!isTargetLang(targetLang)) {
    return NextResponse.json({ error: "targetLang must be en or zh" }, { status: 400 });
  }

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { id: true, title: true, excerpt: true, body: true },
  });
  if (!post) return NextResponse.json({ error: "post_not_found" }, { status: 404 });

  const result = await translateBlogPostTo(
    { title: post.title, excerpt: post.excerpt || "", body: post.body },
    targetLang
  );
  if (!result) {
    return NextResponse.json({ error: "translation_failed" }, { status: 502 });
  }

  // Persist by language
  if (targetLang === "en") {
    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        titleEn: result.title,
        excerptEn: result.excerpt,
        bodyEn: result.body,
      },
    });
  } else {
    await saveBlogTranslationZh(post.id, result);
  }

  return NextResponse.json({ ok: true, postId: post.id, targetLang, content: result });
}

export async function PUT(req: Request) {
  let body: { postId?: string; targetLang?: string; title?: string; excerpt?: string; content?: string; publish?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const postId = body.postId?.trim();
  const targetLang = body.targetLang;
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });
  if (!isTargetLang(targetLang)) {
    return NextResponse.json({ error: "targetLang must be en or zh" }, { status: 400 });
  }
  const title = (body.title ?? "").toString();
  const excerpt = (body.excerpt ?? "").toString();
  const content = (body.content ?? "").toString();
  if (!title.trim() || !content.trim()) {
    return NextResponse.json({ error: "title_and_content_required" }, { status: 400 });
  }

  try {
    if (targetLang === "en") {
      await prisma.blogPost.update({
        where: { id: postId },
        data: { titleEn: title, excerptEn: excerpt, bodyEn: content },
      });
    } else {
      const payload: TranslatedContent = {
        title,
        excerpt,
        body: content,
        targetLang: "zh",
        translatedAt: new Date().toISOString(),
      };
      await saveBlogTranslationZh(postId, payload);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[blog-translation] save failed", err);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const postId = url.searchParams.get("postId")?.trim();
  const targetLang = url.searchParams.get("targetLang");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });
  if (!isTargetLang(targetLang)) {
    return NextResponse.json({ error: "targetLang must be en or zh" }, { status: 400 });
  }
  if (targetLang === "en") {
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { titleEn: true, excerptEn: true, bodyEn: true },
    });
    if (!post || !post.titleEn) return NextResponse.json({ ok: true, content: null });
    return NextResponse.json({
      ok: true,
      content: {
        title: post.titleEn,
        excerpt: post.excerptEn ?? "",
        body: post.bodyEn ?? "",
        targetLang: "en" as const,
        translatedAt: "",
      },
    });
  }
  const zh = await getBlogTranslationZh(postId);
  return NextResponse.json({ ok: true, content: zh });
}
