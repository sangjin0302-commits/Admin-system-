/**
 * 네이버 검색 / 데이터랩 클라이언트 (market-analyze `app/services/naver.py` 포팅)
 *
 * 크레덴셜은 반드시 **호출 시점**에 읽습니다 (모듈 top-level const 금지).
 * 이유: LAW_OC에서 top-level const로 읽었다가 Vercel 빌드 캐시가 빈 문자열을
 * 그대로 굳혀버려 런타임에 값이 들어와도 영원히 빈 값으로 남는 사고가 있었습니다.
 */

import { logger } from "@/lib/utils/logger";

const SEARCH_BASE = "https://openapi.naver.com/v1/search";
const DATALAB_URL = "https://openapi.naver.com/v1/datalab/search";
const TIMEOUT_MS = 10_000;

// ── env: 호출 시점 read (top-level const 금지 — 위 주석 참고) ──
function naverClientId(): string {
  return process.env.NAVER_CLIENT_ID || "";
}
function naverClientSecret(): string {
  return process.env.NAVER_CLIENT_SECRET || "";
}
/** 데이터랩 전용 키가 없으면 검색 키로 폴백 */
function datalabClientId(): string {
  return process.env.NAVER_DATALAB_CLIENT_ID || naverClientId();
}
function datalabClientSecret(): string {
  return process.env.NAVER_DATALAB_CLIENT_SECRET || naverClientSecret();
}

export function envReady(): boolean {
  return Boolean(naverClientId() && naverClientSecret());
}
export function datalabEnvReady(): boolean {
  return Boolean(datalabClientId() && datalabClientSecret());
}

export type NaverChannel = "blog" | "news" | "cafearticle";

export type NaverRawItem = {
  title?: string;
  description?: string;
  link?: string;
  bloggername?: string;
  bloggerlink?: string;
  originallink?: string;
  postdate?: string;
  pubDate?: string;
};

export type NormalizedItem = {
  sourceType: string;
  sourceQuery: string;
  title: string;
  snippet: string;
  url: string;
  publisherName: string;
  publisherBlogName: string;
  publishedAt: string;
};

/** 네이버 응답 title/description에는 <b> 하이라이트 태그가 섞여 옵니다. */
function stripHtml(text: string | undefined): string {
  return (text || "").replace(/<[^>]+>/g, "").trim();
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** 네이버 검색 API. 실패 시 빈 배열 (throw 하지 않음). */
export async function searchNaver(
  channel: NaverChannel,
  query: string,
  display = 20,
  start = 1,
  sort: "date" | "sim" = "date"
): Promise<NaverRawItem[]> {
  if (!envReady()) {
    logger.warn("[market-naver] NAVER_CLIENT_ID/SECRET 미설정 — 수집을 건너뜁니다.");
    return [];
  }
  const params = new URLSearchParams({
    query,
    display: String(Math.min(display, 100)),
    start: String(Math.min(start, 1000)),
    sort,
  });
  try {
    const res = await fetchWithTimeout(`${SEARCH_BASE}/${channel}.json?${params}`, {
      headers: {
        "X-Naver-Client-Id": naverClientId(),
        "X-Naver-Client-Secret": naverClientSecret(),
      },
    });
    if (!res.ok) {
      logger.warn(`[market-naver] search ${channel} 실패: HTTP ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { items?: NaverRawItem[] };
    return data.items ?? [];
  } catch (err) {
    logger.warn(`[market-naver] search ${channel} 예외: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export type DataLabGroup = { groupName: string; keywords: string[] };
export type DataLabResult = { title: string; data: { period: string; ratio: number }[] };

/** 네이버 데이터랩 검색어 트렌드. 실패 시 빈 배열. */
export async function fetchDataLabTrends(
  startDate: string,
  endDate: string,
  keywordGroups: DataLabGroup[],
  timeUnit: "date" | "week" | "month" = "date"
): Promise<DataLabResult[]> {
  if (!datalabEnvReady()) {
    logger.warn("[market-naver] DataLab 크레덴셜 미설정 — 트렌드 수집을 건너뜁니다.");
    return [];
  }
  if (keywordGroups.length === 0) return [];
  try {
    const res = await fetchWithTimeout(DATALAB_URL, {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": datalabClientId(),
        "X-Naver-Client-Secret": datalabClientSecret(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        timeUnit,
        // 데이터랩은 그룹 최대 5개
        keywordGroups: keywordGroups.slice(0, 5),
      }),
    });
    if (!res.ok) {
      logger.warn(`[market-naver] datalab 실패: HTTP ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { results?: DataLabResult[] };
    return data.results ?? [];
  } catch (err) {
    logger.warn(`[market-naver] datalab 예외: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export function normalizeNaverItem(
  item: NaverRawItem,
  sourceType: string,
  sourceQuery: string
): NormalizedItem {
  const publishedRaw = item.postdate || item.pubDate || new Date().toISOString();
  return {
    sourceType,
    sourceQuery,
    title: stripHtml(item.title),
    snippet: stripHtml(item.description),
    url: item.link || "",
    publisherName: item.bloggername || item.originallink || sourceType,
    publisherBlogName: item.bloggerlink || item.originallink || sourceType,
    publishedAt: publishedRaw,
  };
}

const COMPETITOR_BLOG_QUERY_SEEDS = [
  "행정사 사무소",
  "행정사사무소",
  "비자 행정사 사무소",
  "출입국 행정사 사무소",
  "행정심판 행정사 사무소",
  "인허가 행정사 사무소",
];

export function buildCompetitorBlogQueries(regions: string[] = [], services: string[] = []): string[] {
  const queries = new Set<string>(COMPETITOR_BLOG_QUERY_SEEDS);
  for (const region of regions) {
    queries.add(`${region} 행정사 사무소`);
    queries.add(`${region} 행정사사무소`);
  }
  for (const service of services) {
    queries.add(`${service} 행정사 사무소`);
    queries.add(`${service} 행정사사무소`);
  }
  return [...queries].sort();
}

export function isCompetitorBlogCandidate(item: {
  publisherName?: string | null;
  publisherBlogName?: string | null;
}): boolean {
  const name = (item.publisherName || "").toLowerCase();
  const key = (item.publisherBlogName || "").toLowerCase();
  return ["행정사", "행정사사무소", "행정사 사무소"].some(
    (token) => name.includes(token) || key.includes(token)
  );
}

export function buildMarketQueries(
  baseKeywords: string[],
  regions: string[] = [],
  services: string[] = []
): string[] {
  const queries = new Set<string>(baseKeywords);
  for (const region of regions) queries.add(`${region} 행정사`);
  for (const service of services) queries.add(`${service} 행정사`);
  return [...queries]
    .map((q) => q.trim())
    .filter((q) => q.length > 0)
    .sort();
}

/** postdate("20240115") / pubDate(RFC822) / ISO 를 모두 수용. 실패 시 현재 시각. */
export function parsePublishedAt(value: string | null | undefined): Date {
  if (!value) return new Date();
  if (/^\d{8}$/.test(value)) {
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6));
    const d = Number(value.slice(6, 8));
    const parsed = new Date(Date.UTC(y, m - 1, d));
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
