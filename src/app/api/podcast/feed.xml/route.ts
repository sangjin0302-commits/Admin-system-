/**
 * 공개 팟캐스트 RSS 피드 (iTunes 호환).
 * 팟캐스트 플랫폼(Spotify/Apple) 에서 이 URL 을 구독한다.
 */

import { NextResponse } from "next/server";
import { buildRssFeed, listEpisodes } from "@/lib/services/podcast-generator-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isFeatureEnabled("podcast_series"))) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const episodes = await listEpisodes();
  const xml = buildRssFeed(episodes, baseUrl);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
