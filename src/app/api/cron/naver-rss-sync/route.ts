import { NextResponse } from "next/server";

import { importNaverBlogPosts, NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 매일 1회 (Vercel Hobby) 네이버 블로그 RSS 자동 동기화.
 * 최신 ~10편만 가져옴. 전체 import는 admin에서 수동.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await importNaverBlogPosts({ translate: false });
  logger.info("[cron/naver-rss-sync] done", result);

  // 신규 글 있을 때만 텔레그램 알림 (admin)
  if (result.imported > 0) {
    await sendTelegramAlert({
      kind: "system",
      title: `네이버 블로그 신규 ${result.imported}편 import`,
      lines: [
        `건너뜀: ${result.skipped}건`,
        result.translated > 0 ? `번역됨: ${result.translated}건` : "번역: off"
      ],
      url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/blog` : undefined
    }).catch(() => undefined);

    // Public Telegram 채널에도 자동 share (env 설정 시)
    if (process.env.TELEGRAM_CHANNEL_ID) {
      const recent = await prisma.blogPost.findMany({
        where: { source: NAVER_BLOG_SOURCE, published: true },
        orderBy: { importedAt: "desc" },
        take: result.imported,
        select: { slug: true, title: true, excerpt: true }
      }).catch(() => []);

      for (const p of recent) {
        await sendTelegramAlert({
          channel: "public",
          kind: "system",
          title: p.title,
          lines: [p.excerpt?.slice(0, 200) ?? ""].filter(Boolean),
          url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${p.slug}` : undefined
        }).catch(() => undefined);
        await new Promise((r) => setTimeout(r, 1000)); // Telegram rate limit
      }
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
