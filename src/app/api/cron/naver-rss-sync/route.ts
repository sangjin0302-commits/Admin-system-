import { NextResponse } from "next/server";

import { importNaverBlogPosts } from "@/lib/services/naver-rss-importer";
import { logger } from "@/lib/utils/logger";

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
  return NextResponse.json({ ok: true, ...result });
}
