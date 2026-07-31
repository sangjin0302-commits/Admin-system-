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
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 신규 글만 영어로 자동 번역한다(translateBlogPost, Claude).
  //  - cron 은 기존 글을 skip 하므로 매일 번역 대상은 그날 새로 올라온 글뿐이다.
  //  - ANTHROPIC_API_KEY 가 없으면 importer 내부 가드가 번역을 건너뛴다(무해).
  //  - 가져온 글은 blog 상세에서 canonical=네이버 원문 + robots noindex 로
  //    처리되므로(page.tsx) 중복 콘텐츠 페널티 위험이 없다.
  // 주의: 한 번에 신규 글이 많으면(초기 대량 유입 등) 본문 통번역이 누적돼
  //   maxDuration(60s)을 넘길 수 있다. 그 경우 남은 글은 다음 실행에서 처리된다.
  let result: Awaited<ReturnType<typeof importNaverBlogPosts>>;
  try {
    result = await importNaverBlogPosts({ translate: true });
  } catch (error) {
    console.error("[cron/naver-rss-sync] import failed", error);
    // 실패 시 관리자 텔레그램 알림(정기 갱신 중단 감지).
    await sendTelegramAlert({
      kind: "blog_sync_failed",
      title: "네이버 블로그 동기화 실패",
      lines: [
        "RSS 가져오기 중 오류로 이번 갱신을 건너뛰었습니다.",
        error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300),
      ],
    }).catch(() => undefined);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
  logger.info("[cron/naver-rss-sync] done", result);

  // 일부 글 가져오기 실패(부분 오류) 시에도 관리자 알림.
  if (result.errors.length > 0) {
    await sendTelegramAlert({
      kind: "blog_sync_failed",
      title: `네이버 블로그 동기화 부분 오류 (${result.errors.length}건)`,
      lines: [
        `성공: ${result.imported} · 건너뜀: ${result.skipped}`,
        ...result.errors.slice(0, 3),
      ],
    }).catch(() => undefined);
  }

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

  // 뉴스레터 구독자에게 신규 글 알림(발행 즉시). best-effort — 실패해도 sync 성공 처리.
  //  - watermark 기반이라 admin 수동발행 글도 다음 sync 때 함께 커버됨.
  //  - 무료한도 가드에 걸리면 내부에서 중단(유료전환 방지).
  let notify: Awaited<ReturnType<typeof import("@/lib/services/newsletter-service").notifyNewlyPublishedPosts>> | null = null;
  try {
    const { notifyNewlyPublishedPosts } = await import("@/lib/services/newsletter-service");
    notify = await notifyNewlyPublishedPosts();
  } catch (err) {
    logger.warn("[cron/naver-rss-sync] subscriber notify failed", err);
  }

  return NextResponse.json({ ok: true, ...result, notify });
}
