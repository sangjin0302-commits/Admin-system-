/**
 * 네이버 블로그 대량 import.
 * PostTitleListAsync (pagination) → logNo 수집 → 각 글의 본문(mobile view) fetch → DB 저장.
 *
 * RSS는 최신 ~10편만 제공 → 50편+ 가져오려면 이 경로 필요.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { translateBlogPost } from "@/lib/services/blog-translation-service";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { classifyBlogPost } from "@/lib/services/blog-categorizer";

const BASE = "https://blog.naver.com";
const MOBILE_BASE = "https://m.blog.naver.com";

type ListEntry = {
  logNo: string;
  title: string;
  addDate: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

async function fetchTitleList(blogId: string, page: number): Promise<ListEntry[]> {
  const url = `${BASE}/PostTitleListAsync.naver?blogId=${encodeURIComponent(blogId)}&viewdate=&currentPage=${page}&categoryNo=&parentCategoryNo=&countPerPage=30`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json, text/plain, */*",
      Referer: `${BASE}/${blogId}`
    },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Naver list fetch failed: ${res.status}`);
  const text = await res.text();
  // 응답은 JSON-like string with single quotes 또는 정상 JSON. parse 안전 시도.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // single quote → double quote 변환 후 재시도
    try {
      parsed = JSON.parse(text.replace(/'/g, '"'));
    } catch {
      logger.warn("[naver-bulk] failed to parse list response", text.slice(0, 200));
      return [];
    }
  }
  const obj = parsed as { postList?: Array<{ logNo: string; title: string; addDate: string }> };
  const list = obj.postList ?? [];
  return list.map((p) => ({
    logNo: String(p.logNo),
    title: decodeEntities(p.title ?? ""),
    addDate: p.addDate ?? ""
  }));
}

async function fetchPostBody(blogId: string, logNo: string): Promise<string> {
  const url = `${MOBILE_BASE}/PostView.naver?blogId=${encodeURIComponent(blogId)}&logNo=${encodeURIComponent(logNo)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store"
  });
  if (!res.ok) return "";
  const html = await res.text();
  // 본문 영역 추출 — se-main-container 또는 postViewArea
  const main = html.match(/<div[^>]+class="[^"]*se-main-container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|<\/section|<\/article)/i)?.[1]
    ?? html.match(/<div[^>]+id="postViewArea[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1]
    ?? "";
  return main;
}

function makeExcerpt(body: string): string {
  return stripHtml(body).slice(0, 200);
}

function generateSlug(title: string, logNo: string): string {
  const base = stripHtml(title)
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  return `${base || "naver-post"}-${logNo}`;
}

export async function bulkImportNaverBlog(options: {
  blogId: string;
  maxPosts?: number;
  translate?: boolean;
}): Promise<{ imported: number; skipped: number; translated: number; errors: string[] }> {
  const { blogId } = options;
  const maxPosts = options.maxPosts ?? 100;
  const translate = options.translate ?? false; // 50편 번역은 API 비용 큼 → 기본 끔
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;
  let translated = 0;

  let allEntries: ListEntry[] = [];
  for (let page = 1; page <= 10; page++) {
    try {
      const batch = await fetchTitleList(blogId, page);
      if (batch.length === 0) break;
      allEntries.push(...batch);
      if (allEntries.length >= maxPosts) break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`page ${page}: ${msg}`);
      break;
    }
  }
  allEntries = allEntries.slice(0, maxPosts);

  logger.info(`[naver-bulk] ${allEntries.length} entries to process`);

  for (const entry of allEntries) {
    try {
      const link = `${BASE}/${blogId}/${entry.logNo}`;
      const existing = await prisma.blogPost.findFirst({
        where: { originalUrl: link },
        select: { id: true }
      });
      if (existing) {
        skipped++;
        continue;
      }

      const body = await fetchPostBody(blogId, entry.logNo);
      if (!body) {
        skipped++;
        continue;
      }

      const title = stripHtml(entry.title);
      const excerpt = makeExcerpt(body);
      const publishedAt = entry.addDate ? new Date(entry.addDate) : new Date();
      const safePublishedAt = Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

      let titleEn: string | null = null;
      let excerptEn: string | null = null;
      let bodyEn: string | null = null;
      if (translate && process.env.ANTHROPIC_API_KEY) {
        const t = await translateBlogPost({ title, excerpt, body });
        if (t) {
          titleEn = t.titleEn;
          excerptEn = t.excerptEn;
          bodyEn = t.bodyEn;
          translated++;
        }
      }

      const category = classifyBlogPost(`${title}\n${excerpt}\n${body.slice(0, 4000)}`);
      await prisma.blogPost.create({
        data: {
          slug: generateSlug(title, entry.logNo),
          title,
          excerpt,
          body,
          titleEn,
          excerptEn,
          bodyEn,
          category,
          source: NAVER_BLOG_SOURCE,
          originalUrl: link,
          importedAt: new Date(),
          published: true,
          publishedAt: safePublishedAt,
          authorName: "행정사 지상진"
        }
      });
      imported++;

      // 짧은 sleep — 네이버 rate limit 회피
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("[naver-bulk] item failed", err, { logNo: entry.logNo });
      errors.push(`${entry.logNo}: ${msg}`);
    }
  }

  logger.info("[naver-bulk] done", { imported, skipped, translated, errors: errors.length });
  return { imported, skipped, translated, errors };
}
