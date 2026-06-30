import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { translateBlogPost } from "@/lib/services/blog-translation-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 400 });
  }

  // Find published posts without English translation
  const untranslated = await prisma.blogPost.findMany({
    where: {
      published: true,
      OR: [
        { titleEn: null },
        { titleEn: "" },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 5, // Process 5 per run to stay within limits
    select: { id: true, title: true, excerpt: true, body: true, slug: true },
  });

  if (untranslated.length === 0) {
    return NextResponse.json({ translated: 0, message: "All posts translated" });
  }

  let translated = 0;
  const errors: string[] = [];

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
        translated++;
      }

      // Rate limit: wait 1s between API calls
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      logger.warn("[blog-translate] failed", { slug: post.slug, err });
      errors.push(post.slug);
    }
  }

  // Report to Telegram
  if (translated > 0) {
    await sendTelegramAlert({
      kind: "system",
      title: `🌐 블로그 자동 번역: ${translated}/${untranslated.length}편 완료`,
      lines: errors.length > 0 ? [`실패: ${errors.join(", ")}`] : undefined,
    }).catch(() => {});
  }

  return NextResponse.json({ translated, total: untranslated.length, errors });
}
