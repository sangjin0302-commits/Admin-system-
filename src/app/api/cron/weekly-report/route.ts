import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { sendEmail } from "@/lib/services/email-service";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { InquiryStatus } from "@generated/prisma-client/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 매주 일요일 21:00 KST 운영 리포트.
 * 7일 의뢰 / 블로그 신규 / 분야별 분포 텔레그램 발송.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [inquiries7d, inquiriesPrev7d, won7d, newPosts7d, byCategory, totalPosts, totalInquiries, avgResponse7d] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => 0),
    prisma.inquiry.count({ where: { createdAt: { gte: prevWeekAgo, lt: weekAgo } } }).catch(() => 0),
    prisma.inquiry.count({ where: { status: InquiryStatus.WON, updatedAt: { gte: weekAgo } } }).catch(() => 0),
    prisma.blogPost.count({
      where: { source: NAVER_BLOG_SOURCE, importedAt: { gte: weekAgo } }
    }).catch(() => 0),
    prisma.blogPost.groupBy({
      by: ["category"],
      where: { published: true, source: NAVER_BLOG_SOURCE },
      _count: { _all: true }
    }).catch(() => [] as Array<{ category: string; _count: { _all: number } }>),
    prisma.blogPost.count({ where: { published: true } }).catch(() => 0),
    prisma.inquiry.count().catch(() => 0),
    prisma.inquiry.findMany({
      where: { firstResponseAt: { not: null }, createdAt: { gte: weekAgo } },
      select: { createdAt: true, firstResponseAt: true },
      take: 200,
    }).catch(() => [] as Array<{ createdAt: Date; firstResponseAt: Date | null }>),
  ]);

  const wowPct = inquiriesPrev7d > 0
    ? Math.round(((inquiries7d - inquiriesPrev7d) / inquiriesPrev7d) * 100)
    : null;
  const winRate = inquiries7d > 0 ? Math.round((won7d / inquiries7d) * 100) : 0;
  const avgResponseHours = avgResponse7d.length > 0
    ? Math.round(
        avgResponse7d.reduce((s, r) => s + (r.firstResponseAt!.getTime() - r.createdAt.getTime()), 0) /
          avgResponse7d.length /
          (1000 * 60 * 60),
      )
    : null;

  const topCats = byCategory
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 3)
    .map((c) => `${c.category}:${c._count._all}`)
    .join(" · ");

  const wowStr = wowPct === null ? "N/A" : wowPct >= 0 ? `+${wowPct}%` : `${wowPct}%`;
  const responseStr = avgResponseHours === null ? "N/A" : `${avgResponseHours}h`;

  const lines = [
    `📊 지난 7일 의뢰: ${inquiries7d}건 (WoW ${wowStr})`,
    `🏆 WON: ${won7d}건 · 전환률 ${winRate}%`,
    `⏱ 첫 응답 평균: ${responseStr}`,
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

  let emailSent = false;
  if (await isFeatureEnabled("weekly_kpi_email").catch(() => false)) {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL?.trim();
    if (adminEmail) {
      try {
        const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
        await sendEmail({
          to: adminEmail,
          subject: `[ETHOS] 주간 KPI 리포트 (${new Date().toLocaleDateString("ko-KR")})`,
          html: `<h2>주간 KPI 리포트</h2>
<table style="border-collapse:collapse;font-size:14px">
<tr><td style="padding:6px 12px;border:1px solid #ddd">신규 의뢰</td><td style="padding:6px 12px;border:1px solid #ddd"><b>${inquiries7d}</b>건 (WoW ${wowStr})</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #ddd">WON 전환</td><td style="padding:6px 12px;border:1px solid #ddd"><b>${won7d}</b>건 · 전환률 ${winRate}%</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #ddd">첫 응답 평균</td><td style="padding:6px 12px;border:1px solid #ddd"><b>${responseStr}</b></td></tr>
<tr><td style="padding:6px 12px;border:1px solid #ddd">블로그 신규</td><td style="padding:6px 12px;border:1px solid #ddd"><b>${newPosts7d}</b>편</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #ddd">누적</td><td style="padding:6px 12px;border:1px solid #ddd">블로그 ${totalPosts}편 · 의뢰 ${totalInquiries}건</td></tr>
${topCats ? `<tr><td style="padding:6px 12px;border:1px solid #ddd">분야 top3</td><td style="padding:6px 12px;border:1px solid #ddd">${topCats}</td></tr>` : ""}
</table>
${site ? `<p style="margin-top:16px"><a href="${site}/admin/insights">전체 인사이트 보기 →</a></p>` : ""}`,
        });
        emailSent = true;
      } catch (err) {
        logger.warn("[cron/weekly-report] email failed", err);
      }
    }
  }

  logger.info("[cron/weekly-report] sent", { inquiries7d, won7d, winRate, emailSent });
  return NextResponse.json({ ok: true, inquiries7d, won7d, winRate, newPosts7d, emailSent });
}
