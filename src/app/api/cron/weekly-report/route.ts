import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 매주 일요일 21:00 KST 운영 리포트.
 * 7일 의뢰 / 블로그 신규 / 분야별 분포 텔레그램 발송.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [inquiries7d, newPosts7d, byCategory, totalPosts, totalInquiries] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => 0),
    prisma.blogPost.count({
      where: { source: NAVER_BLOG_SOURCE, importedAt: { gte: weekAgo } }
    }).catch(() => 0),
    prisma.blogPost.groupBy({
      by: ["category"],
      where: { published: true, source: NAVER_BLOG_SOURCE },
      _count: { _all: true }
    }).catch(() => [] as Array<{ category: string; _count: { _all: number } }>),
    prisma.blogPost.count({ where: { published: true } }).catch(() => 0),
    prisma.inquiry.count().catch(() => 0)
  ]);

  const topCats = byCategory
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 3)
    .map((c) => `${c.category}:${c._count._all}`)
    .join(" · ");

  const lines = [
    `📊 지난 7일 의뢰: ${inquiries7d}건`,
    `📝 신규 블로그 import: ${newPosts7d}편`,
    `📚 누적 블로그: ${totalPosts}편 / 누적 의뢰: ${totalInquiries}건`,
    topCats ? `🏷 분야 top3: ${topCats}` : ""
  ].filter(Boolean);

  await sendTelegramAlert({
    kind: "system",
    title: "주간 운영 리포트",
    lines,
    url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/insights` : undefined
  });

  logger.info("[cron/weekly-report] sent");
  return NextResponse.json({ ok: true, inquiries7d, newPosts7d });
}
