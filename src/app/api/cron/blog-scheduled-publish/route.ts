/**
 * Vercel Cron — 예약 게시 자동 발행.
 *
 * BlogPost.scheduledAt 이 현재시각 이하이고 아직 미공개(published=false)인 글을
 * 공개로 전환한다. 매시간 실행(vercel.json)해 예약 시각 근처에 발행.
 *
 * 인증: Authorization: Bearer <CRON_SECRET>.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { onBlogPublished } from "@/lib/services/pr-syndication-service";
import { logger } from "@/lib/utils/logger";

async function handle(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  try {
    const due = await prisma.blogPost.findMany({
      where: { published: false, scheduledAt: { not: null, lte: now } },
      select: { id: true, slug: true },
    });

    let publishedCount = 0;
    for (const p of due) {
      await prisma.blogPost.update({
        where: { id: p.id },
        // scheduledAt 을 비워 1회성으로 만든다(재게시 위험 방지):
        // 나중에 언퍼블리시해도 과거 scheduledAt 로 다음 실행에 재발행되지 않게.
        data: { published: true, publishedAt: now, scheduledAt: null },
      });
      publishedCount++;
      // 발행 후 신디케이션 훅(텔레그램/사이트맵 등) — best-effort.
      void onBlogPublished(p.id);
    }

    logger.info(`[cron:blog-scheduled-publish] ${publishedCount}건 발행`);
    return NextResponse.json({ ok: true, published: publishedCount });
  } catch (err) {
    logger.error("[cron:blog-scheduled-publish] 실패", err);
    return NextResponse.json({ ok: false, error: "scheduled publish failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
