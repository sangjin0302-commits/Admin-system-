import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import {
  translateBlogPost,
  translateBlogPostTo,
  getBlogTranslationZh,
  saveBlogTranslationZh,
} from "@/lib/services/blog-translation-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

function isZhEnabled(): boolean {
  const raw = process.env.BLOG_TRANSLATE_ZH?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 400 });
  }

  // ── English pass ────────────────────────────────────────────
  const untranslated = await prisma.blogPost.findMany({
    where: {
      published: true,
      OR: [{ titleEn: null }, { titleEn: "" }],
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
    select: { id: true, title: true, excerpt: true, body: true, slug: true },
  });

  let enCount = 0;
  const enErrors: string[] = [];
  for (const post of untranslated) {
    try {
      const result = await translateBlogPost({
        title: post.title,
        excerpt: post.excerpt || "",
        body: post.body,
      });
      if (result) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            titleEn: result.titleEn,
            excerptEn: result.excerptEn,
            bodyEn: result.bodyEn,
          },
        });
        enCount++;
      }
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      logger.warn("[blog-translate] EN failed", { slug: post.slug, err });
      enErrors.push(post.slug);
    }
  }

  // ── Chinese pass (opt-in) ───────────────────────────────────
  let zhCount = 0;
  const zhErrors: string[] = [];
  let zhCandidates = 0;
  if (isZhEnabled()) {
    const publishedPosts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: { id: true, title: true, excerpt: true, body: true, slug: true },
    });

    const pending: typeof publishedPosts = [];
    for (const p of publishedPosts) {
      const existing = await getBlogTranslationZh(p.id);
      if (!existing) pending.push(p);
      if (pending.length >= 5) break;
    }
    zhCandidates = pending.length;

    for (const post of pending) {
      try {
        const result = await translateBlogPostTo(
          { title: post.title, excerpt: post.excerpt || "", body: post.body },
          "zh"
        );
        if (result) {
          await saveBlogTranslationZh(post.id, result);
          zhCount++;
        }
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        logger.warn("[blog-translate] ZH failed", { slug: post.slug, err });
        zhErrors.push(post.slug);
      }
    }
  }

  const totalTranslated = enCount + zhCount;
  const hasErrors = enErrors.length > 0 || zhErrors.length > 0;

  // 커버리지: 이번 실행 후 아직 영어 번역이 없는 공개 글 수.
  const [publishedTotal, enRemaining] = await Promise.all([
    prisma.blogPost.count({ where: { published: true } }),
    prisma.blogPost.count({
      where: { published: true, OR: [{ titleEn: null }, { titleEn: "" }] },
    }),
  ]);
  const enDone = publishedTotal - enRemaining;
  const coveragePct = publishedTotal > 0 ? Math.round((enDone / publishedTotal) * 100) : 100;

  // 성공했을 때뿐 아니라 실패가 있을 때도 반드시 알린다(과거엔 실패가 조용히 묻혔다).
  if (totalTranslated > 0 || hasErrors) {
    const lines: string[] = [];
    if (untranslated.length) lines.push(`EN 번역: ${enCount}/${untranslated.length}`);
    if (isZhEnabled()) lines.push(`ZH 번역: ${zhCount}/${zhCandidates}`);
    lines.push(`EN 커버리지: ${enDone}/${publishedTotal} (${coveragePct}%) · 미번역 ${enRemaining}편`);
    if (enErrors.length) lines.push(`⚠️ EN 실패: ${enErrors.join(", ")}`);
    if (zhErrors.length) lines.push(`⚠️ ZH 실패: ${zhErrors.join(", ")}`);
    await sendTelegramAlert({
      kind: "system",
      title: hasErrors
        ? `⚠️ 블로그 자동 번역 — 실패 ${enErrors.length + zhErrors.length}건 (성공 ${totalTranslated}편)`
        : `🌐 블로그 자동 번역 완료 (총 ${totalTranslated}편)`,
      lines,
    }).catch(() => {});
  }

  return NextResponse.json({
    en: { translated: enCount, total: untranslated.length, errors: enErrors },
    zh: isZhEnabled()
      ? { translated: zhCount, total: zhCandidates, errors: zhErrors }
      : { skipped: true, hint: "set BLOG_TRANSLATE_ZH=1 to enable" },
    coverage: { enDone, publishedTotal, enRemaining, coveragePct },
  });
}
