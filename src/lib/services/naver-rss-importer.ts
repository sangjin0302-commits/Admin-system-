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

/** URL 인코딩(공백→`+`, `%XX`)된 제목 정규화. */
function normalizeTitle(s: string): string {
  let t = s ?? "";
  if (/%[0-9A-Fa-f]{2}/.test(t) || t.includes("+")) {
    try {
      t = decodeURIComponent(t.replace(/\+/g, " "));
    } catch {
      t = t.replace(/\+/g, " ");
    }
  }
  return t.trim();
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
  const lazy = html.match(/<img[^>]+data-lazy-src=["']([^"']+)["']/i)?.[1];
  const first = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  const url = (og || lazy || first || "").trim();
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

// ── 네이버 원문 페이지에서 본문 전문(全文) 스크레이프 ──────────────────
//
// 네이버 RSS 의 <description> 은 미리보기 요약뿐이고 <content:encoded> 는 없다.
// 그래서 전문을 얻으려면 실제 글 페이지(PostView)를 받아 본문 컨테이너를 꺼내야 한다.
// (attorney_jean 은 자사 블로그 — 자사 콘텐츠 스크레이프.)

/** 네이버 링크에서 blogId·logNo 추출. path형(/id/logNo)·query형 모두 지원. */
function parseNaverIds(link: string): { blogId: string; logNo: string } | null {
  try {
    const u = new URL(link);
    const qBlog = u.searchParams.get("blogId");
    const qLog = u.searchParams.get("logNo");
    if (qBlog && qLog) return { blogId: qBlog, logNo: qLog };
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && /^\d{6,}$/.test(parts[1])) {
      return { blogId: parts[0], logNo: parts[1] };
    }
    const logNo = link.match(/(\d{6,})/)?.[1];
    if (parts.length >= 1 && logNo) return { blogId: parts[0], logNo };
  } catch {
    /* 무시 — 아래에서 null 반환 */
  }
  return null;
}

/**
 * `<div class="...se-main-container...">` 같은 여는 태그부터 **짝이 맞는** 닫는
 * `</div>` 까지의 inner HTML 을 반환. 중첩 div 때문에 단순 정규식으론 못 잡으므로
 * div 깊이를 세며 스캔한다.
 */
function extractBalancedDiv(html: string, startRe: RegExp): string | null {
  const m = startRe.exec(html);
  if (!m) return null;
  const contentStart = m.index + m[0].length;
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = contentStart;
  let t: RegExpExecArray | null;
  while ((t = tagRe.exec(html)) !== null) {
    if (t[0].startsWith("</")) {
      depth--;
      if (depth === 0) return html.slice(contentStart, t.index);
    } else if (!t[0].endsWith("/>")) {
      depth++;
    }
  }
  return null;
}

/** 네이버 lazy 이미지(placeholder src + data-lazy-src) 를 실제 src 로 승격. */
function promoteLazyImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const lazy = tag.match(/data-lazy-src=["']([^"']+)["']/i)?.[1];
    if (!lazy) return tag;
    if (/\bsrc=["'][^"']*["']/i.test(tag)) {
      return tag.replace(/\bsrc=["'][^"']*["']/i, `src="${lazy}"`);
    }
    return tag.replace(/<img\b/i, `<img src="${lazy}"`);
  });
}

/**
 * 네이버 글 원문 페이지에서 본문 전문 HTML 을 가져온다. 실패 시 null(→ 호출부가 요약으로 폴백).
 * 모바일 PostView 가 SmartEditor 본문을 인라인으로 내려줘 파싱이 쉽다.
 */
export async function fetchNaverPostBody(link: string): Promise<string | null> {
  const ids = parseNaverIds(link);
  if (!ids) return null;
  const timeoutMs = Number(process.env.NAVER_FETCH_TIMEOUT_MS ?? "10000");

  // 모바일 PostView 가 SmartEditor 본문을 인라인으로 내려 파싱이 쉽지만, 봇차단/마크업
  // 변화로 종종 실패한다. 모바일 → 데스크톱 순으로 시도해 성공률을 높인다.
  const candidates = [
    `https://m.blog.naver.com/PostView.naver?blogId=${encodeURIComponent(ids.blogId)}&logNo=${encodeURIComponent(ids.logNo)}`,
    `https://blog.naver.com/PostView.naver?blogId=${encodeURIComponent(ids.blogId)}&logNo=${encodeURIComponent(ids.logNo)}`,
  ];

  for (const url of candidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
          Accept: "text/html,application/xhtml+xml,*/*",
          "Accept-Language": "ko-KR,ko;q=0.9",
          // Referer 없으면 네이버가 빈 셸을 주는 경우가 있어 blogId 홈을 지정.
          Referer: `https://m.blog.naver.com/${encodeURIComponent(ids.blogId)}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) {
        logger.warn("[naver-rss] post body fetch non-ok", res.status, { url });
        continue;
      }
      const html = await res.text();
      // SmartEditor(se-main-container/se_component) · 구형(postViewArea) · iframe 셸 순.
      const inner =
        extractBalancedDiv(html, /<div[^>]*class=["'][^"']*se-main-container[^"']*["'][^>]*>/i) ??
        extractBalancedDiv(html, /<div[^>]*class=["'][^"']*se_component_wrap[^"']*["'][^>]*>/i) ??
        extractBalancedDiv(html, /<div[^>]*id=["']postViewArea["'][^>]*>/i) ??
        extractBalancedDiv(html, /<div[^>]*class=["'][^"']*post-view[^"']*["'][^>]*>/i) ??
        extractBalancedDiv(html, /<div[^>]*id=["']viewTypeSelector["'][^>]*>/i);
      if (!inner) continue;
      const cleaned = promoteLazyImages(inner).trim();
      if (stripHtml(cleaned).length > 0) return cleaned;
    } catch (err) {
      logger.warn("[naver-rss] post body fetch failed", err, { url });
    } finally {
      clearTimeout(timeoutId);
    }
  }
  return null;
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
      // 중복 판정: logNo 기준 + 제목 fallback. logNo 추출/URL 포맷이 실행마다
      // 달라져 dedup 을 놓치면 랜덤 slug 로 재수입돼 "두 개씩" 중복이 쌓였음
      // → 같은 글은 제목이 같으므로 제목 매칭을 OR 로 추가해 확실히 스킵한다.
      const logNo = p.link.match(/(\d{6,})/)?.[1];
      const title = normalizeTitle(decodeEntities(stripHtml(p.title)));
      const existing = await prisma.blogPost.findFirst({
        where: {
          OR: [
            logNo ? { originalUrl: { contains: logNo } } : { originalUrl: p.link },
            { source: NAVER_BLOG_SOURCE, title },
          ],
        },
        select: { id: true },
      });
      if (existing) {
        skipped++;
        continue;
      }

      // 전문 확보 우선순위: RSS content:encoded → 원문 페이지 스크레이프 → description(요약).
      // 네이버 RSS 는 요약만 주므로, 짧으면 실제 글 페이지에서 전문을 가져온다.
      let body = p.contentEncoded ?? null;
      if (!body || stripHtml(body).length < 400) {
        const full = await fetchNaverPostBody(p.link);
        if (full) body = full;
      }
      if (!body) body = p.description;
      const excerpt = decodeEntities(makeExcerpt(p.description || stripHtml(body)));
      const coverImage = extractCoverImage(body) ?? extractCoverImage(p.description);
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
          // 본문(스크레이프)은 사이드바·관련글 등 비자 도배 chrome 이 섞여 분류를
          // 오염시킴(계약/심판 글도 visa 로 뒤집힘) → 제목+요약만으로 분류.
          category: classifyBlogPost(`${title}\n${excerpt}`, title),
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

/**
 * 기존 잘린 본문 백필.
 *
 * 이미 저장된 네이버 수입글 중 본문이 짧은(요약만 저장된) 것들을 골라, 원문 페이지에서
 * 전문을 다시 가져와 갱신한다. 재수입은 logNo 중복으로 스킵되므로 기존 글은 이 도구로만 고쳐진다.
 * 서버 시간제한 때문에 1회 처리량을 제한 — 여러 번 실행하면 계속 이어서 처리된다.
 */
export async function backfillNaverPostBodies(options?: {
  max?: number;
}): Promise<{ scanned: number; updated: number; remaining: number; errors: string[] }> {
  const max = Math.min(20, Math.max(1, options?.max ?? 8));
  const errors: string[] = [];
  let updated = 0;
  let scanned = 0;

  const candidates = await prisma.blogPost.findMany({
    where: { source: NAVER_BLOG_SOURCE },
    orderBy: { publishedAt: "desc" },
    select: { id: true, body: true, originalUrl: true, coverImage: true },
    take: 500,
  });
  // 본문이 짧은(≈요약뿐인) 글만 대상.
  const short = candidates.filter(
    (c) => c.originalUrl && stripHtml(c.body ?? "").length < 400
  );

  for (const c of short) {
    if (scanned >= max) break;
    scanned++;
    try {
      const full = await fetchNaverPostBody(c.originalUrl as string);
      // 더 길어질 때만 교체(스크레이프 실패·역효과 방지).
      if (!full || stripHtml(full).length <= stripHtml(c.body ?? "").length) continue;
      await prisma.blogPost.update({
        where: { id: c.id },
        data: { body: full, coverImage: c.coverImage ?? extractCoverImage(full) },
      });
      updated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${c.originalUrl}: ${msg}`);
    }
  }

  const remaining = Math.max(0, short.length - scanned);
  logger.info("[naver-rss] body backfill done", { scanned, updated, remaining, errorCount: errors.length });
  return { scanned, updated, remaining, errors };
}
