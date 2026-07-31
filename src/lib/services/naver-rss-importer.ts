import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { translateBlogPost } from "@/lib/services/blog-translation-service";
import { classifyBlogPost } from "@/lib/services/blog-categorizer";

export const NAVER_BLOG_RSS_URL = "https://rss.blog.naver.com/attorney_jean.xml";
export const NAVER_BLOG_SOURCE = "naver_attorney_jean";

export type ParsedNaverPost = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  contentEncoded?: string;
};

function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) return null;
  return stripCdata(m[1].trim());
}

export async function fetchNaverBlogRSS(): Promise<ParsedNaverPost[]> {
  const res = await fetch(NAVER_BLOG_RSS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ETHOS-Bot/1.0)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Naver RSS fetch failed: ${res.status}`);
  }
  const xml = await res.text();
  const items: ParsedNaverPost[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title") ?? "";
    const link = extractTag(block, "link") ?? "";
    const pubDate = extractTag(block, "pubDate") ?? "";
    const description = extractTag(block, "description") ?? "";
    const contentEncoded = extractTag(block, "content:encoded") ?? undefined;
    if (!title || !link) continue;
    items.push({ title, link, pubDate, description, contentEncoded });
  }
  return items;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/** HTML 엔티티 디코드(제목·발췌에 &amp; 등이 그대로 남는 문제 대응). */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/**
 * 네이버 글 HTML 에서 커버 이미지(카드뉴스 표지) 추출.
 * 우선순위: og:image 메타 → 본문 첫 <img>. 없으면 null.
 * 프로토콜 상대경로(//...)는 https 로 보정.
 */
export function extractCoverImage(html: string | null | undefined): string | null {
  if (!html) return null;
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const first = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  const url = (og || first || "").trim();
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

function generateSlug(title: string): string {
  const base = stripHtml(title)
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `${base || "naver-post"}-${suffix}`;
}

function makeExcerpt(description: string): string {
  return stripHtml(description).slice(0, 200);
}

export async function importNaverBlogPosts(options?: {
  translate?: boolean;
}): Promise<{
  imported: number;
  skipped: number;
  translated: number;
  errors: string[];
}> {
  const translate = options?.translate ?? true;
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;
  let translated = 0;

  let posts: ParsedNaverPost[] = [];
  try {
    posts = await fetchNaverBlogRSS();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[naver-rss] fetch failed", err);
    return { imported: 0, skipped: 0, translated: 0, errors: [msg] };
  }

  for (const p of posts) {
    try {
      const existing = await prisma.blogPost.findFirst({
        where: { originalUrl: p.link },
        select: { id: true },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const title = decodeEntities(stripHtml(p.title));
      const body = p.contentEncoded ?? p.description;
      const excerpt = decodeEntities(makeExcerpt(p.description));
      const coverImage = extractCoverImage(p.contentEncoded ?? p.description);
      const publishedAt = p.pubDate ? new Date(p.pubDate) : new Date();
      const safePublishedAt = isNaN(publishedAt.getTime()) ? new Date() : publishedAt;

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

      await prisma.blogPost.create({
        data: {
          slug: generateSlug(title),
          title,
          excerpt,
          body,
          titleEn,
          excerptEn,
          bodyEn,
          category: classifyBlogPost(`${title}\n${excerpt}\n${(body ?? "").slice(0, 4000)}`),
          coverImage,
          source: NAVER_BLOG_SOURCE,
          originalUrl: p.link,
          importedAt: new Date(),
          published: true,
          publishedAt: safePublishedAt,
          authorName: "ETHOS 행정사사무소",
        },
      });
      imported++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("[naver-rss] import item failed", err, { link: p.link });
      errors.push(`${p.link}: ${msg}`);
    }
  }

  logger.info("[naver-rss] import done", { imported, skipped, translated, errorCount: errors.length });
  return { imported, skipped, translated, errors };
}
