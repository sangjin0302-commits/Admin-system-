/**
 * Content SEO audit — rule-based checks over a BlogPost.
 *
 * Score 0-100. Each check contributes a weighted penalty. Optional Claude
 * Haiku call for prose improvement suggestions (only when ANTHROPIC_API_KEY
 * is set); rule checks are 100% offline.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type SeoIssue = {
  code: string;
  severity: "critical" | "warning" | "info";
  message: string;
};

export type SeoAudit = {
  slug: string;
  title: string;
  score: number; // 0-100
  issues: SeoIssue[];
  suggestions: string[];
  metrics: {
    titleLength: number;
    excerptLength: number;
    wordCount: number;
    h1Count: number;
    h2Count: number;
    imageCount: number;
    imagesMissingAlt: number;
    internalLinks: number;
    externalLinks: number;
    avgSentenceLength: number;
    keywordDensityTop: { word: string; density: number }[];
  };
};

export type BlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category?: string;
  published?: boolean;
};

/**
 * Strip HTML tags and collapse whitespace for text metrics.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(html: string, re: RegExp): number {
  const m = html.match(re);
  return m ? m.length : 0;
}

function countWords(text: string): number {
  if (!text) return 0;
  // Handle CJK: each CJK char counts as one word; latin words split on whitespace.
  const cjk = text.match(/[㐀-鿿가-힯]/g)?.length ?? 0;
  const latinOnly = text.replace(/[㐀-鿿가-힯]/g, " ");
  const latin = latinOnly.split(/\s+/).filter(Boolean).length;
  return cjk + latin;
}

function avgSentenceLen(text: string): number {
  const sentences = text.split(/[.!?。！？\n]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  const totalWords = sentences.reduce((acc, s) => acc + countWords(s), 0);
  return totalWords / sentences.length;
}

function keywordDensity(text: string, top: number = 5): { word: string; density: number }[] {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (words.length === 0) return [];
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, density: count / words.length }))
    .sort((a, b) => b.density - a.density)
    .slice(0, top);
}

export async function auditBlogPost(post: BlogPostInput): Promise<SeoAudit> {
  const issues: SeoIssue[] = [];
  const suggestions: string[] = [];

  const titleLength = post.title.trim().length;
  const excerptLength = post.excerpt.trim().length;
  const text = stripHtml(post.body);
  const wordCount = countWords(text);
  const h1Count = countMatches(post.body, /<h1(\s|>)/gi) + countMatches(post.body, /^#\s/gm);
  const h2Count = countMatches(post.body, /<h2(\s|>)/gi) + countMatches(post.body, /^##\s/gm);
  const imgTags = post.body.match(/<img\b[^>]*>/gi) ?? [];
  const imageCount = imgTags.length;
  const imagesMissingAlt = imgTags.filter((tag) => !/\balt\s*=\s*"[^"]+"/i.test(tag)).length;
  const links = post.body.match(/<a\s[^>]*href\s*=\s*"([^"]+)"/gi) ?? [];
  let internalLinks = 0;
  let externalLinks = 0;
  for (const link of links) {
    const m = link.match(/href\s*=\s*"([^"]+)"/i);
    const href = m?.[1] ?? "";
    if (!href) continue;
    if (/^https?:\/\//i.test(href)) externalLinks += 1;
    else internalLinks += 1;
  }
  const avgSent = avgSentenceLen(text);
  const density = keywordDensity(text, 5);

  let score = 100;

  if (titleLength < 30) {
    score -= 10;
    issues.push({ code: "TITLE_TOO_SHORT", severity: "warning", message: `제목이 짧습니다 (${titleLength}자, 권장 30-60자)` });
  } else if (titleLength > 60) {
    score -= 5;
    issues.push({ code: "TITLE_TOO_LONG", severity: "warning", message: `제목이 깁니다 (${titleLength}자, 권장 30-60자)` });
  }

  if (excerptLength < 120) {
    score -= 10;
    issues.push({ code: "META_TOO_SHORT", severity: "warning", message: `메타 설명(excerpt)이 짧습니다 (${excerptLength}자, 권장 120-160자)` });
  } else if (excerptLength > 160) {
    score -= 5;
    issues.push({ code: "META_TOO_LONG", severity: "info", message: `메타 설명(excerpt)이 깁니다 (${excerptLength}자, 권장 120-160자)` });
  }

  if (wordCount < 800) {
    score -= 15;
    issues.push({ code: "WORD_COUNT_LOW", severity: "critical", message: `본문이 짧습니다 (${wordCount}자/단어, 권장 800+)` });
  }

  if (h1Count > 1) {
    score -= 5;
    issues.push({ code: "MULTIPLE_H1", severity: "warning", message: `H1이 ${h1Count}개 있습니다 (1개 권장)` });
  }
  if (h2Count === 0 && wordCount > 400) {
    score -= 8;
    issues.push({ code: "NO_H2", severity: "warning", message: "H2 구조가 없습니다 (섹션 나누기 권장)" });
  }

  if (imageCount > 0 && imagesMissingAlt > 0) {
    score -= Math.min(15, imagesMissingAlt * 3);
    issues.push({
      code: "IMG_MISSING_ALT",
      severity: "warning",
      message: `이미지 alt 누락 ${imagesMissingAlt}/${imageCount}개`,
    });
  }

  if (internalLinks < 2) {
    score -= 8;
    issues.push({ code: "INTERNAL_LINKS_LOW", severity: "warning", message: `내부 링크가 ${internalLinks}개입니다 (2+ 권장)` });
  }

  if (externalLinks === 0 && wordCount > 500) {
    score -= 3;
    issues.push({ code: "NO_EXTERNAL_LINKS", severity: "info", message: "외부 참조 링크가 없습니다" });
  }

  if (avgSent > 30) {
    score -= 6;
    issues.push({
      code: "SENTENCES_LONG",
      severity: "info",
      message: `평균 문장 길이가 ${avgSent.toFixed(1)}단어입니다 (짧게 쪼개면 가독성이 개선됩니다)`,
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Rule-based suggestions
  for (const iss of issues) {
    switch (iss.code) {
      case "TITLE_TOO_SHORT":
        suggestions.push("제목에 핵심 키워드 + 부가 설명을 결합해 30-60자로 다시 작성해 보세요.");
        break;
      case "META_TOO_SHORT":
        suggestions.push("발췌문(excerpt)을 120-160자로 늘려 검색 결과 스니펫을 채우세요.");
        break;
      case "WORD_COUNT_LOW":
        suggestions.push("사례, FAQ, 배경 설명을 추가해 본문을 800단어 이상으로 확장해 보세요.");
        break;
      case "NO_H2":
        suggestions.push("주요 섹션마다 H2 헤더를 넣어 목차 구조를 만들면 SEO에 유리합니다.");
        break;
      case "IMG_MISSING_ALT":
        suggestions.push("모든 이미지에 alt 텍스트를 추가해 접근성과 이미지 검색 유입을 확보하세요.");
        break;
      case "INTERNAL_LINKS_LOW":
        suggestions.push("관련 서비스 페이지 / 다른 블로그 글로 향하는 내부 링크를 2개 이상 넣으세요.");
        break;
    }
  }

  // Optional Haiku call (best-effort, non-fatal). Only when API key present.
  if (process.env.ANTHROPIC_API_KEY && issues.length > 0) {
    try {
      const haikuSuggestion = await tryHaikuSuggestion(post, issues);
      if (haikuSuggestion) suggestions.push(haikuSuggestion);
    } catch (err) {
      logger.warn("[seo-audit] haiku suggestion failed", err);
    }
  }

  return {
    slug: post.slug,
    title: post.title,
    score,
    issues,
    suggestions,
    metrics: {
      titleLength,
      excerptLength,
      wordCount,
      h1Count,
      h2Count,
      imageCount,
      imagesMissingAlt,
      internalLinks,
      externalLinks,
      avgSentenceLength: Number(avgSent.toFixed(2)),
      keywordDensityTop: density,
    },
  };
}

async function tryHaikuSuggestion(
  post: BlogPostInput,
  issues: SeoIssue[]
): Promise<string | null> {
  // Minimal fetch-based call to keep this file dependency-light.
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const issuesText = issues.map((i) => `- ${i.code}: ${i.message}`).join("\n");
  const prompt = `다음 블로그 글의 SEO 개선을 위해 한 문장으로 구체적 조언을 해 주세요.\n\n제목: ${post.title}\n발췌: ${post.excerpt.slice(0, 200)}\n\n감지된 이슈:\n${issuesText}`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    return text ? `AI 제안: ${text}` : null;
  } catch {
    return null;
  }
}

export async function auditBySlug(slug: string): Promise<SeoAudit | null> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { slug: true, title: true, excerpt: true, body: true, category: true, published: true },
  });
  if (!post) return null;
  return auditBlogPost(post);
}

export async function auditAllPublished(): Promise<SeoAudit[]> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 500,
    select: { slug: true, title: true, excerpt: true, body: true, category: true, published: true },
  });
  const results: SeoAudit[] = [];
  for (const p of posts) {
    // Skip Haiku on bulk audit to avoid cost / rate limits.
    const audit = await auditBlogPostOffline(p);
    results.push(audit);
  }
  return results;
}

/**
 * Same as auditBlogPost but skips the optional Haiku call — used for bulk
 * list rendering where per-row API calls would be prohibitive.
 */
export async function auditBlogPostOffline(post: BlogPostInput): Promise<SeoAudit> {
  const prev = process.env.ANTHROPIC_API_KEY;
  try {
    delete process.env.ANTHROPIC_API_KEY;
    return await auditBlogPost(post);
  } finally {
    if (prev !== undefined) process.env.ANTHROPIC_API_KEY = prev;
  }
}
