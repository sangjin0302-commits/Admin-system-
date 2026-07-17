/**
 * 시장·경쟁사 데이터 수집 (market-analyze `collector_v2.py` + `pipeline.rebuild_competitor_profiles` 포팅)
 *
 * 네이버 수집 → 분류 → MarketDocument upsert → 경쟁사 프로파일 재계산 → 데이터랩 트렌드.
 * 외부 서비스(Railway 등) 불필요 — 전부 admin-system 내부에서 처리합니다.
 */

import { createHash } from "crypto";

import { prisma } from "@/lib/prisma/client";
import {
  classifyDocument,
  isExamRelated,
  normalizeCompetitorKey,
  popularityScore,
} from "@/lib/services/market-classifier-service";
import {
  buildCompetitorBlogQueries,
  buildMarketQueries,
  fetchDataLabTrends,
  envReady,
  isCompetitorBlogCandidate,
  normalizeNaverItem,
  parsePublishedAt,
  searchNaver,
  type DataLabGroup,
  type NaverChannel,
  type NormalizedItem,
} from "@/lib/services/market-naver-client";
import { logger } from "@/lib/utils/logger";

const MARKET_CHANNELS: NaverChannel[] = ["blog", "news", "cafearticle"];
const CONCURRENCY = 4;

const BASE_KEYWORDS = [
  "행정사",
  "행정사 후기",
  "행정사 추천",
  "행정사 비용",
  "행정사 상담",
  "행정사 사무소",
  "행정사사무소",
];

const DEFAULT_TREND_KEYWORDS = ["행정사", "비자 행정사", "행정심판", "인허가 행정사", "귀화 신청"];

function hashDocument(url: string, title: string): string {
  return createHash("sha256").update(`${url}::${title}`).digest("hex");
}

/** 동시 실행 상한을 둔 map — 네이버 API rate limit 보호. */
async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function toJson(value: unknown): string {
  return JSON.stringify(value ?? []);
}
function fromJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export type CollectResult = {
  ok: boolean;
  skipped?: string;
  queries: number;
  fetched: number;
  upserted: number;
  skippedExam: number;
};

/** 네이버 수집 → 분류 → MarketDocument upsert. */
export async function collectMarket(
  options: { limitPerQuery?: number } = {}
): Promise<CollectResult> {
  const limitPerQuery = options.limitPerQuery ?? 10;
  const empty: CollectResult = { ok: false, queries: 0, fetched: 0, upserted: 0, skippedExam: 0 };

  if (!envReady()) {
    logger.warn("[market-collect] 네이버 크레덴셜 미설정 — 수집 건너뜀");
    return { ...empty, skipped: "naver_env_missing" };
  }

  try {
    const marketQueries = buildMarketQueries(BASE_KEYWORDS);
    const competitorQueries = buildCompetitorBlogQueries();

    // (channel, query) 조합 — 경쟁사 쿼리는 블로그 채널만 대상
    const jobs: { channel: NaverChannel; query: string; coverage: number }[] = [];
    for (const channel of MARKET_CHANNELS) {
      for (const query of marketQueries) {
        jobs.push({ channel, query, coverage: channel === "blog" ? 0.75 : 0.65 });
      }
    }
    for (const query of competitorQueries) {
      jobs.push({ channel: "blog", query, coverage: 0.9 });
    }

    const batches = await mapLimited(jobs, CONCURRENCY, async (job) => {
      const items = await searchNaver(job.channel, job.query, limitPerQuery);
      return items.map((raw) => ({
        raw,
        normalized: normalizeNaverItem(raw, job.channel, job.query),
        coverage: job.coverage,
      }));
    });

    const flat = batches.flat();

    // URL 기준 dedupe (동일 글이 여러 쿼리에 걸림)
    const byUrl = new Map<string, (typeof flat)[number]>();
    for (const entry of flat) {
      if (!entry.normalized.url) continue;
      if (!byUrl.has(entry.normalized.url)) byUrl.set(entry.normalized.url, entry);
    }

    let upserted = 0;
    let skippedExam = 0;

    for (const { raw, normalized, coverage } of byUrl.values()) {
      const exam = isExamRelated(
        normalized.title,
        normalized.snippet,
        normalized.sourceQuery,
        normalized.publisherName
      );
      if (exam) skippedExam++;

      const classification = classifyDocument({
        title: normalized.title,
        snippet: normalized.snippet,
        publisher: normalized.publisherName,
        publisherBlogName: normalized.publisherBlogName,
        sourceType: normalized.sourceType,
      });
      const publishedAt = parsePublishedAt(normalized.publishedAt);
      const score = popularityScore({
        publishedAt,
        sourceType: normalized.sourceType,
        queryCoverage: coverage,
      });

      const data = {
        orgId: "default",
        sourceType: normalized.sourceType,
        sourceQuery: normalized.sourceQuery,
        title: normalized.title,
        snippet: normalized.snippet,
        publisherName: normalized.publisherName,
        publisherBlogName: normalized.publisherBlogName,
        publishedAt,
        collectedAt: new Date(),
        dedupeHash: hashDocument(normalized.url, normalized.title),
        isExamRelated: exam,
        isRelevant: !exam && classification.isRelevant,
        rawMetadata: toJson(raw),
        docType: classification.docType,
        sentiment: classification.sentiment,
        topics: toJson(classification.topics),
        regions: toJson(classification.regions),
        riskFlags: toJson(classification.riskFlags),
        popularityScore: score,
      };

      try {
        await prisma.marketDocument.upsert({
          where: { url: normalized.url },
          create: { url: normalized.url, ...data },
          update: data,
        });
        upserted++;
      } catch (err) {
        logger.warn(
          `[market-collect] upsert 실패 url=${normalized.url}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    logger.debug(`[market-collect] queries=${jobs.length} fetched=${flat.length} upserted=${upserted}`);
    return { ok: true, queries: jobs.length, fetched: flat.length, upserted, skippedExam };
  } catch (err) {
    logger.error("[market-collect] 수집 실패", err);
    return { ...empty, skipped: "collect_failed" };
  }
}

export type RebuildResult = { ok: boolean; competitors: number };

/**
 * 경쟁사 프로파일 재계산.
 * 관련 문서 중 경쟁사 후보(발행처에 "행정사" 포함)를 publisherBlogName 기준 그룹핑.
 */
export async function rebuildCompetitorProfiles(): Promise<RebuildResult> {
  try {
    const since = new Date(Date.now() - 90 * 86_400_000);
    const docs = await prisma.marketDocument.findMany({
      where: { isRelevant: true, sourceType: "blog", collectedAt: { gte: since } },
      select: {
        publisherName: true,
        publisherBlogName: true,
        publishedAt: true,
        topics: true,
        regions: true,
        popularityScore: true,
      },
    });

    const now = Date.now();
    const groups = new Map<
      string,
      {
        displayName: string;
        blogNames: Set<string>;
        topics: Map<string, number>;
        regions: Set<string>;
        freq7d: number;
        freq30d: number;
        scores: number[];
      }
    >();

    for (const doc of docs) {
      if (!isCompetitorBlogCandidate(doc)) continue;
      const key = normalizeCompetitorKey(doc.publisherBlogName, doc.publisherName);
      if (!key) continue;

      let group = groups.get(key);
      if (!group) {
        group = {
          displayName: doc.publisherName || key,
          blogNames: new Set(),
          topics: new Map(),
          regions: new Set(),
          freq7d: 0,
          freq30d: 0,
          scores: [],
        };
        groups.set(key, group);
      }
      if (doc.publisherBlogName) group.blogNames.add(doc.publisherBlogName);
      for (const t of fromJson<string[]>(doc.topics, [])) {
        group.topics.set(t, (group.topics.get(t) ?? 0) + 1);
      }
      for (const r of fromJson<string[]>(doc.regions, [])) group.regions.add(r);
      group.scores.push(doc.popularityScore);

      if (doc.publishedAt) {
        const ageDays = (now - doc.publishedAt.getTime()) / 86_400_000;
        if (ageDays <= 7) group.freq7d++;
        if (ageDays <= 30) group.freq30d++;
      }
    }

    let count = 0;
    for (const [key, group] of groups) {
      const avgScore =
        group.scores.length > 0 ? group.scores.reduce((a, b) => a + b, 0) / group.scores.length : 0;
      // visibility: 게시량(30일) + 평균 인기도. engagement: 최근 7일 활동 비중.
      const visibilityScore =
        Math.round(Math.min(group.freq30d / 30, 1) * 0.6 * 10000 + avgScore * 0.4 * 10000) / 10000;
      const engagementScore =
        Math.round((group.freq30d > 0 ? group.freq7d / group.freq30d : 0) * 10000) / 10000;

      const mainTopics = [...group.topics.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([t]) => t);

      const data = {
        orgId: "default",
        displayName: group.displayName,
        blogNames: toJson([...group.blogNames]),
        mainTopics: toJson(mainTopics),
        postingFreq7d: group.freq7d,
        postingFreq30d: group.freq30d,
        visibilityScore,
        engagementScore,
        regionTags: toJson([...group.regions].sort()),
        serviceTags: toJson(mainTopics),
      };

      await prisma.marketCompetitor.upsert({
        where: { competitorKey: key },
        create: { competitorKey: key, ...data },
        update: data,
      });
      count++;
    }

    logger.debug(`[market-collect] 경쟁사 프로파일 ${count}건 갱신`);
    return { ok: true, competitors: count };
  } catch (err) {
    logger.error("[market-collect] 경쟁사 프로파일 재계산 실패", err);
    return { ok: false, competitors: 0 };
  }
}

export type TrendResult = { ok: boolean; skipped?: string; points: number };

/** 데이터랩 검색어 트렌드 수집 → MarketTrendSnapshot upsert. */
export async function collectTrends(keywords: string[] = DEFAULT_TREND_KEYWORDS): Promise<TrendResult> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 29 * 86_400_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const groups: DataLabGroup[] = keywords.slice(0, 5).map((kw) => ({ groupName: kw, keywords: [kw] }));
    const results = await fetchDataLabTrends(fmt(start), fmt(end), groups);
    if (results.length === 0) return { ok: false, skipped: "datalab_unavailable", points: 0 };

    let points = 0;
    for (const entry of results) {
      for (const point of entry.data ?? []) {
        const period = String(point.period ?? "").slice(0, 10);
        if (!period) continue;
        const ratio = Number(point.ratio ?? 0) || 0;
        await prisma.marketTrendSnapshot.upsert({
          where: { keyword_period: { keyword: entry.title, period } },
          create: { orgId: "default", keyword: entry.title, period, ratio },
          update: { ratio, capturedAt: new Date() },
        });
        points++;
      }
    }
    return { ok: true, points };
  } catch (err) {
    logger.error("[market-collect] 트렌드 수집 실패", err);
    return { ok: false, skipped: "trends_failed", points: 0 };
  }
}

export type MarketDashboard = {
  totals: { documents: number; relevant: number; competitors: number };
  lastCollectedAt: string | null;
  sentimentBreakdown: { sentiment: string; count: number }[];
  topCompetitors: {
    competitorKey: string;
    displayName: string;
    postingFreq7d: number;
    postingFreq30d: number;
    visibilityScore: number;
    mainTopics: string[];
    regionTags: string[];
  }[];
  risingTopics: { topic: string; count: number }[];
  recentRisks: { title: string; url: string; riskFlags: string[]; collectedAt: string }[];
};

/** 대시보드 집계 — 카운트 / 상위 경쟁사 / 여론 분포 / 급상승 주제 / 최근 위험 신호. */
export async function getMarketDashboard(): Promise<MarketDashboard> {
  const empty: MarketDashboard = {
    totals: { documents: 0, relevant: 0, competitors: 0 },
    lastCollectedAt: null,
    sentimentBreakdown: [],
    topCompetitors: [],
    risingTopics: [],
    recentRisks: [],
  };

  try {
    const since30 = new Date(Date.now() - 30 * 86_400_000);

    const [documents, relevant, competitors, latest, sentiments, competitorRows, recentDocs] =
      await Promise.all([
        prisma.marketDocument.count(),
        prisma.marketDocument.count({ where: { isRelevant: true } }),
        prisma.marketCompetitor.count(),
        prisma.marketDocument.findFirst({
          orderBy: { collectedAt: "desc" },
          select: { collectedAt: true },
        }),
        prisma.marketDocument.groupBy({
          by: ["sentiment"],
          where: { isRelevant: true },
          _count: { _all: true },
        }),
        prisma.marketCompetitor.findMany({
          orderBy: [{ visibilityScore: "desc" }, { postingFreq30d: "desc" }],
          take: 10,
        }),
        prisma.marketDocument.findMany({
          where: { isRelevant: true, collectedAt: { gte: since30 } },
          select: { topics: true, riskFlags: true, title: true, url: true, collectedAt: true },
          orderBy: { collectedAt: "desc" },
          take: 500,
        }),
      ]);

    const topicCounts = new Map<string, number>();
    const recentRisks: MarketDashboard["recentRisks"] = [];
    for (const doc of recentDocs) {
      for (const t of fromJson<string[]>(doc.topics, [])) {
        topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
      }
      const flags = fromJson<string[]>(doc.riskFlags, []);
      if (flags.length > 0 && recentRisks.length < 20) {
        recentRisks.push({
          title: doc.title,
          url: doc.url,
          riskFlags: flags,
          collectedAt: doc.collectedAt.toISOString(),
        });
      }
    }

    return {
      totals: { documents, relevant, competitors },
      lastCollectedAt: latest?.collectedAt.toISOString() ?? null,
      sentimentBreakdown: sentiments.map((s) => ({ sentiment: s.sentiment, count: s._count._all })),
      topCompetitors: competitorRows.map((c) => ({
        competitorKey: c.competitorKey,
        displayName: c.displayName,
        postingFreq7d: c.postingFreq7d,
        postingFreq30d: c.postingFreq30d,
        visibilityScore: c.visibilityScore,
        mainTopics: fromJson<string[]>(c.mainTopics, []),
        regionTags: fromJson<string[]>(c.regionTags, []),
      })),
      risingTopics: [...topicCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count })),
      recentRisks,
    };
  } catch (err) {
    logger.error("[market-collect] 대시보드 집계 실패", err);
    return empty;
  }
}

export type CompetitorDetail = {
  competitor: {
    competitorKey: string;
    displayName: string;
    blogNames: string[];
    mainTopics: string[];
    postingFreq7d: number;
    postingFreq30d: number;
    visibilityScore: number;
    engagementScore: number;
    regionTags: string[];
    updatedAt: string;
  } | null;
  documents: { title: string; url: string; snippet: string; publishedAt: string | null; sentiment: string }[];
};

/** 경쟁사 목록 */
export async function listCompetitors(limit = 50) {
  try {
    const rows = await prisma.marketCompetitor.findMany({
      orderBy: [{ visibilityScore: "desc" }, { postingFreq30d: "desc" }],
      take: Math.min(limit, 200),
    });
    return rows.map((c) => ({
      competitorKey: c.competitorKey,
      displayName: c.displayName,
      mainTopics: fromJson<string[]>(c.mainTopics, []),
      regionTags: fromJson<string[]>(c.regionTags, []),
      postingFreq7d: c.postingFreq7d,
      postingFreq30d: c.postingFreq30d,
      visibilityScore: c.visibilityScore,
      engagementScore: c.engagementScore,
    }));
  } catch (err) {
    logger.error("[market-collect] 경쟁사 목록 조회 실패", err);
    return [];
  }
}

/** 경쟁사 상세 + 해당 경쟁사 문서 목록 */
export async function getCompetitor(competitorKey: string): Promise<CompetitorDetail> {
  try {
    const competitor = await prisma.marketCompetitor.findUnique({ where: { competitorKey } });
    if (!competitor) return { competitor: null, documents: [] };

    const blogNames = fromJson<string[]>(competitor.blogNames, []);
    const documents = await prisma.marketDocument.findMany({
      where: {
        isRelevant: true,
        OR: [
          ...(blogNames.length > 0 ? [{ publisherBlogName: { in: blogNames } }] : []),
          { publisherName: competitor.displayName },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: { title: true, url: true, snippet: true, publishedAt: true, sentiment: true },
    });

    return {
      competitor: {
        competitorKey: competitor.competitorKey,
        displayName: competitor.displayName,
        blogNames,
        mainTopics: fromJson<string[]>(competitor.mainTopics, []),
        postingFreq7d: competitor.postingFreq7d,
        postingFreq30d: competitor.postingFreq30d,
        visibilityScore: competitor.visibilityScore,
        engagementScore: competitor.engagementScore,
        regionTags: fromJson<string[]>(competitor.regionTags, []),
        updatedAt: competitor.updatedAt.toISOString(),
      },
      documents: documents.map((d) => ({
        title: d.title,
        url: d.url,
        snippet: d.snippet,
        publishedAt: d.publishedAt?.toISOString() ?? null,
        sentiment: d.sentiment,
      })),
    };
  } catch (err) {
    logger.error("[market-collect] 경쟁사 상세 조회 실패", err);
    return { competitor: null, documents: [] };
  }
}

/** 문서 목록 (여론 탭 등에서 sentiment 필터로 사용) */
export async function listDocuments(
  options: { sentiment?: string; limit?: number } = {}
) {
  try {
    const rows = await prisma.marketDocument.findMany({
      where: {
        isRelevant: true,
        ...(options.sentiment ? { sentiment: options.sentiment } : {}),
      },
      orderBy: { collectedAt: "desc" },
      take: Math.min(options.limit ?? 30, 100),
      select: {
        title: true,
        url: true,
        snippet: true,
        sourceType: true,
        sentiment: true,
        docType: true,
        topics: true,
        riskFlags: true,
        publisherName: true,
        publishedAt: true,
      },
    });
    return rows.map((d) => ({
      title: d.title,
      url: d.url,
      snippet: d.snippet,
      sourceType: d.sourceType,
      sentiment: d.sentiment,
      docType: d.docType,
      topics: fromJson<string[]>(d.topics, []),
      riskFlags: fromJson<string[]>(d.riskFlags, []),
      publisherName: d.publisherName,
      publishedAt: d.publishedAt?.toISOString() ?? null,
    }));
  } catch (err) {
    logger.error("[market-collect] 문서 목록 조회 실패", err);
    return [];
  }
}

/** 저장된 데이터랩 트렌드 조회 — 키워드별 시계열 */
export async function getTrends() {
  try {
    const rows = await prisma.marketTrendSnapshot.findMany({
      orderBy: [{ keyword: "asc" }, { period: "asc" }],
      take: 500,
    });
    const byKeyword = new Map<string, { period: string; ratio: number }[]>();
    for (const row of rows) {
      const list = byKeyword.get(row.keyword) ?? [];
      list.push({ period: row.period, ratio: row.ratio });
      byKeyword.set(row.keyword, list);
    }
    return [...byKeyword.entries()].map(([keyword, points]) => {
      const first = points[0]?.ratio ?? 0;
      const last = points[points.length - 1]?.ratio ?? 0;
      return {
        keyword,
        points,
        latest: last,
        change: first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0,
      };
    });
  } catch (err) {
    logger.error("[market-collect] 트렌드 조회 실패", err);
    return [];
  }
}
