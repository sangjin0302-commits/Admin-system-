import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { translateBlogPost } from "@/lib/services/blog-translation-service";

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

      const title = stripHtml(p.title);
      const body = p.contentEncoded ?? p.description;
      const excerpt = makeExcerpt(p.description);
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
          category: "naver",
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
