/**
 * 법률 뉴스 자동 요약·매칭.
 *
 * - RSS 피드에서 뉴스 수집 (env LEGAL_NEWS_RSS_URLS, 콤마 구분).
 *   기본 후보: 법제처, 법률신문, 매경 법률면.
 * - Claude Haiku 로 각 뉴스 요약(2줄) + 카테고리 분류.
 * - 활성 사건(active CaseMatter + 미종결 Inquiry)의 키워드/카테고리와 매칭.
 * - SiteSetting key "news.legal.recent" 에 최근 100건 저장.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const STORE_KEY = "news.legal.recent";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const MAX_KEEP = 100;

const DEFAULT_RSS = [
  "https://www.law.go.kr/lsSubForm.do?menuId=1&subId=RSS", // 법제처 (예시)
  "https://www.lawtimes.co.kr/rss", // 법률신문 (예시)
].join(",");

export type LegalNewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary: string; // Haiku 2줄 요약
  category: string; // Haiku 분류
  keywords: string[];
  matchedCaseIds: string[];
  matchedInquiryIds: string[];
  fetchedAt: string;
};

function newId(): string {
  return `nws_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readStore(): Promise<LegalNewsItem[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STORE_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as LegalNewsItem[]) : [];
  } catch {
    return [];
  }
}

async function writeStore(items: LegalNewsItem[]): Promise<void> {
  const value = JSON.stringify(items.slice(0, MAX_KEEP));
  await prisma.siteSetting.upsert({
    where: { key: STORE_KEY },
    create: { key: STORE_KEY, value },
    update: { value },
  });
}

/** 매우 단순한 RSS/Atom XML 파서 — item/entry title, link, pubDate/updated */
function parseRss(xml: string, source: string): Array<Omit<LegalNewsItem, "id" | "summary" | "category" | "keywords" | "matchedCaseIds" | "matchedInquiryIds" | "fetchedAt">> {
  const out: Array<{ title: string; link: string; publishedAt: string; source: string }> = [];
  const itemRegex = /<(item|entry)[\s\S]*?<\/\1>/g;
  const matches = xml.match(itemRegex) ?? [];
  for (const block of matches.slice(0, 30)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const link =
      block.match(/<link[^>]*>([^<]+)<\/link>/)?.[1] ??
      block.match(/<link[^>]*href="([^"]+)"/)?.[1] ??
      "";
    const pub =
      block.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/)?.[1] ??
      block.match(/<updated[^>]*>([^<]+)<\/updated>/)?.[1] ??
      new Date().toISOString();
    const cleanTitle = title
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    const cleanLink = link.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    if (!cleanTitle || !cleanLink) continue;
    out.push({
      title: cleanTitle,
      link: cleanLink,
      publishedAt: new Date(pub).toISOString(),
      source,
    });
  }
  return out;
}

async function fetchFeed(url: string): Promise<Array<{ title: string; link: string; publishedAt: string; source: string }>> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 ETHOS-News-Fetcher" }, next: { revalidate: 0 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const source = new URL(url).hostname;
    return parseRss(xml, source);
  } catch (err) {
    logger.warn("[legal-news] fetch fail", url, err);
    return [];
  }
}

async function summarize(title: string): Promise<{ summary: string; category: string; keywords: string[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return { summary: title.slice(0, 200), category: "일반", keywords: [] };
  }
  const prompt = `다음은 한국 법률 뉴스 제목입니다. 2줄 요약과 카테고리, 키워드 3개를 JSON으로 출력하세요.
제목: "${title}"
출력 형식만: {"summary": string, "category": string, "keywords": string[]}. 카테고리는 "출입국", "행정심판", "건축", "영업허가", "세무", "기타" 중 하나. 마크다운 금지.`;
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return { summary: title, category: "기타", keywords: [] };
    const data = await res.json();
    const raw = data?.content?.[0]?.text?.trim() ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { summary: title, category: "기타", keywords: [] };
    const p = JSON.parse(match[0]) as { summary?: string; category?: string; keywords?: string[] };
    return {
      summary: (p.summary ?? title).slice(0, 400),
      category: (p.category ?? "기타").slice(0, 20),
      keywords: Array.isArray(p.keywords) ? p.keywords.slice(0, 5).map(String) : [],
    };
  } catch (err) {
    logger.warn("[legal-news] summarize fail", err);
    return { summary: title, category: "기타", keywords: [] };
  }
}

async function matchToActiveCases(
  keywords: string[],
  category: string
): Promise<{ caseIds: string[]; inquiryIds: string[] }> {
  if (keywords.length === 0) return { caseIds: [], inquiryIds: [] };
  const cases = await prisma.caseMatter.findMany({
    where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
    select: { id: true, title: true, summary: true, internalMemo: true, category: true },
    take: 200,
    orderBy: { updatedAt: "desc" },
  }).catch(() => [] as Array<{ id: string; title: string; summary: string | null; internalMemo: string | null; category: string }>);
  const inquiries = await prisma.inquiry.findMany({
    where: { status: { notIn: ["WON", "CLOSED"] } },
    select: { id: true, title: true, description: true },
    take: 200,
    orderBy: { updatedAt: "desc" },
  }).catch(() => [] as Array<{ id: string; title: string; description: string }>);

  const kwLower = keywords.map((k) => k.toLowerCase()).filter(Boolean);
  const caseIds: string[] = [];
  for (const c of cases) {
    const hay = `${c.title} ${c.summary ?? ""} ${c.internalMemo ?? ""} ${c.category}`.toLowerCase();
    if (kwLower.some((k) => hay.includes(k))) caseIds.push(c.id);
  }
  const inquiryIds: string[] = [];
  for (const i of inquiries) {
    const hay = `${i.title} ${i.description}`.toLowerCase();
    if (kwLower.some((k) => hay.includes(k))) inquiryIds.push(i.id);
  }
  return { caseIds: caseIds.slice(0, 10), inquiryIds: inquiryIds.slice(0, 10) };
}

/** 크론에서 호출. RSS 페치 → 요약 → 매칭 → 저장. */
export async function fetchAndProcess(): Promise<{ fetched: number; new: number; matched: number }> {
  const rssEnv = process.env.LEGAL_NEWS_RSS_URLS?.trim() || DEFAULT_RSS;
  const urls = rssEnv.split(",").map((s) => s.trim()).filter(Boolean);
  if (urls.length === 0) return { fetched: 0, new: 0, matched: 0 };

  const existing = await readStore();
  const seen = new Set(existing.map((e) => e.link));
  const allRaw: Array<{ title: string; link: string; publishedAt: string; source: string }> = [];
  for (const u of urls) {
    const items = await fetchFeed(u);
    allRaw.push(...items);
  }
  const fresh = allRaw.filter((r) => !seen.has(r.link)).slice(0, 30);

  const processed: LegalNewsItem[] = [];
  let matched = 0;
  for (const r of fresh) {
    const { summary, category, keywords } = await summarize(r.title);
    const match = await matchToActiveCases(keywords, category);
    if (match.caseIds.length > 0 || match.inquiryIds.length > 0) matched++;
    processed.push({
      id: newId(),
      title: r.title,
      link: r.link,
      source: r.source,
      publishedAt: r.publishedAt,
      summary,
      category,
      keywords,
      matchedCaseIds: match.caseIds,
      matchedInquiryIds: match.inquiryIds,
      fetchedAt: new Date().toISOString(),
    });
  }
  const combined = [...processed, ...existing].slice(0, MAX_KEEP);
  await writeStore(combined);
  return { fetched: allRaw.length, new: processed.length, matched };
}

export async function listRecentNews(limit = 50): Promise<LegalNewsItem[]> {
  const all = await readStore();
  return all.slice(0, limit);
}

export async function listCriticalMatches(): Promise<LegalNewsItem[]> {
  const all = await readStore();
  return all.filter((n) => n.matchedCaseIds.length > 0 || n.matchedInquiryIds.length > 0).slice(0, 20);
}
