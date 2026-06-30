import { NextResponse } from "next/server";

import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 주간 블로그 성과 리포트 — Telegram 알림.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [newPosts, totalPosts, topPosts, newInquiries] = await Promise.all([
    prisma.blogPost.count({
      where: { published: true, createdAt: { gte: weekAgo } },
    }),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { title: true, slug: true, viewCount: true, category: true },
    }),
    prisma.inquiry.count({
      where: { createdAt: { gte: weekAgo } },
    }),
  ]);

  const topLines = topPosts.map(
    (p, i) =>
      `${i + 1}. ${p.title.slice(0, 30)}${p.title.length > 30 ? "…" : ""} (${p.viewCount ?? 0}뷰)`,
  );

  try {
    await sendTelegramAlert({
      kind: "system",
      title: "📊 주간 블로그 성과 리포트",
      lines: [
        `신규 발행: ${newPosts}편 (누적 ${totalPosts}편)`,
        `신규 의뢰: ${newInquiries}건`,
        "",
        "🏆 조회수 TOP 5:",
        ...topLines,
      ],
    });
  } catch (err) {
    logger.warn("[blog-performance] telegram failed", err);
  }

  logger.info("[cron/blog-performance] done", { newPosts, totalPosts, newInquiries });

  return NextResponse.json({
    ok: true,
    newPosts,
    totalPosts,
    newInquiries,
    topPostsCount: topPosts.length,
  });
}
