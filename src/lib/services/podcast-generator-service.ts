/**
 * 주간 팟캐스트 시리즈 자동화.
 *
 * 1) 지난 7일 발행 블로그 요약 + 법률 뉴스 (SiteSetting `podcast.news.recent` JSON 저장 시 사용, 없으면 skip)
 * 2) Haiku 로 10분 스크립트 생성
 * 3) OpenAI TTS → public/generated/podcast/{episode}.mp3
 * 4) 에피소드 목록 SiteSetting `podcast.episodes` JSON 저장
 * 5) 공용 RSS 피드로 배포
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { callHaiku, synthesizeMp3 } from "@/lib/services/marketing-tts-helper";
import { promises as fs } from "fs";
import path from "path";

const KEY_EPISODES = "podcast.episodes";
const KEY_NEWS = "podcast.news.recent";

export type PodcastEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  script: string;
  audioUrl: string | null;
  durationSec: number | null;
  publishedAt: string;
  tts: "openai" | "none";
  sources: { blogPostIds: string[]; newsHeadlines: string[] };
};

const SYSTEM_PROMPT =
  "You are a Korean podcast script writer for an administrative-law firm. Write a natural spoken script (~1400-1600 Korean characters, ≈10 minutes) with: warm intro, 3-5 topical segments from provided blog summaries and news, plain-language explainers, and a closing that invites listeners to ETHOS 행정사사무소. Output ONLY the plain script text — no headings, no JSON, no markdown.";

async function readEpisodes(): Promise<PodcastEpisode[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY_EPISODES } });
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value) as PodcastEpisode[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveEpisodes(list: PodcastEpisode[]): Promise<void> {
  const json = JSON.stringify(list.slice(0, 200));
  await prisma.siteSetting.upsert({
    where: { key: KEY_EPISODES },
    create: { key: KEY_EPISODES, value: json },
    update: { value: json },
  });
}

async function readRecentNews(): Promise<string[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY_NEWS } });
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export async function listEpisodes(): Promise<PodcastEpisode[]> {
  return readEpisodes();
}

export async function generateWeeklyEpisode(opts?: { force?: boolean }): Promise<
  | { ok: true; episode: PodcastEpisode; created: boolean }
  | { ok: false; reason: "NO_CONTENT" | "AI_UNAVAILABLE" }
> {
  const now = new Date();
  const weekTag = `${now.getUTCFullYear()}-W${Math.ceil(
    ((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7,
  )}`;
  const episodes = await readEpisodes();
  const existing = episodes.find((e) => e.id === weekTag);
  if (existing && !opts?.force) return { ok: true, episode: existing, created: false };

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const posts = await prisma.blogPost.findMany({
    where: { published: true, publishedAt: { gte: sevenDaysAgo } },
    select: { id: true, title: true, excerpt: true, body: true },
    orderBy: { publishedAt: "desc" },
    take: 8,
  });
  const news = await readRecentNews();
  if (posts.length === 0 && news.length === 0) return { ok: false, reason: "NO_CONTENT" };

  const summariesUser = [
    posts.length
      ? `이번 주 블로그:\n${posts
          .map(
            (p) =>
              `- ${p.title}: ${(p.excerpt || p.body.replace(/<[^>]+>/g, " ")).slice(0, 250)}`,
          )
          .join("\n")}`
      : "",
    news.length ? `법률 뉴스 헤드라인:\n${news.map((n) => `- ${n}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const script = await callHaiku({ system: SYSTEM_PROMPT, user: summariesUser, maxTokens: 3500 });
  if (!script) return { ok: false, reason: "AI_UNAVAILABLE" };

  const nextEpisodeNumber = existing
    ? existing.episodeNumber
    : (episodes[0]?.episodeNumber ?? 0) + 1;
  const title = `ETHOS 위클리 브리핑 #${nextEpisodeNumber}`;
  const tts = await synthesizeMp3({ feature: "podcast", id: weekTag, text: script });

  // 대략적인 재생시간 추정 (한글 3자/초 가정)
  const durationSec = Math.round(script.replace(/\s/g, "").length / 3);

  const episode: PodcastEpisode = {
    id: weekTag,
    episodeNumber: nextEpisodeNumber,
    title,
    script,
    audioUrl: tts.audioUrl,
    durationSec,
    publishedAt: now.toISOString(),
    tts: tts.audioUrl ? "openai" : "none",
    sources: {
      blogPostIds: posts.map((p) => p.id),
      newsHeadlines: news,
    },
  };

  const nextList = existing
    ? episodes.map((e) => (e.id === weekTag ? episode : e))
    : [episode, ...episodes];
  await saveEpisodes(nextList);
  return { ok: true, episode, created: !existing };
}

/** iTunes 호환 RSS 를 생성한다. */
export function buildRssFeed(episodes: PodcastEpisode[], baseUrl: string): string {
  const items = episodes
    .filter((e) => e.audioUrl)
    .map((e) => {
      const audioAbs = new URL(e.audioUrl!, baseUrl).toString();
      return `
    <item>
      <title>${escapeXml(e.title)}</title>
      <description>${escapeXml(e.script.slice(0, 400))}</description>
      <pubDate>${new Date(e.publishedAt).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(audioAbs)}" type="audio/mpeg" length="0"/>
      <guid isPermaLink="false">${escapeXml(e.id)}</guid>
      <itunes:duration>${e.durationSec ?? 600}</itunes:duration>
      <itunes:episode>${e.episodeNumber}</itunes:episode>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>ETHOS 위클리 브리핑</title>
    <link>${escapeXml(baseUrl)}</link>
    <language>ko-KR</language>
    <description>매주 수요일 발행되는 행정업무 팟캐스트</description>
    <itunes:author>ETHOS 행정사사무소</itunes:author>
    <itunes:category text="News"/>
    <itunes:explicit>false</itunes:explicit>
    ${items}
  </channel>
</rss>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** public/generated/podcast 에 mp3 가 남아있는지 헬스체크. */
export async function verifyEpisodeFiles(): Promise<{ ok: boolean; missing: string[] }> {
  const list = await readEpisodes();
  const missing: string[] = [];
  for (const e of list) {
    if (!e.audioUrl) continue;
    const rel = e.audioUrl.replace(/^\//, "");
    const abs = path.join(process.cwd(), "public", rel);
    try {
      await fs.access(abs);
    } catch {
      missing.push(e.id);
    }
  }
  if (missing.length) logger.warn("[podcast] 누락된 mp3", missing);
  return { ok: missing.length === 0, missing };
}
