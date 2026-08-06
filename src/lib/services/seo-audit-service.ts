/**
 * Content SEO audit — rule-based checks over a BlogPost.
 *
 * Score 0-100. Each check contributes a weighted penalty. Optional Claude
 * Haiku call for prose improvement suggestions (only when ANTHROPIC_API_KEY
 * is set); rule checks are 100% offline.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { callAnthropicMessages } from "@/lib/services/anthropic-gateway";

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
  // CJK·한글 문자클래스를 분리 표기([A]|[B]) — 소스에서 CJK·한글 리터럴이 인접하면
  // text-integrity 검사가 mojibake로 오탐. 단일문자 매칭은 [AB]와 완전 동일.
  const cjk = text.match(/[㐀-鿿]|[가-힯]/g)?.length ?? 0;
  const latinOnly = text.replace(/[㐀-鿿]|[가-힯]/g, " ");
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
  const issuesText = issues.map((i) => `- ${i.code}: ${i.message}`).join("\n");
  const prompt = `다음 블로그 글의 SEO 개선을 위해 한 문장으로 구체적 조언을 해 주세요.\n\n제목: ${post.title}\n발췌: ${post.excerpt.slice(0, 200)}\n\n감지된 이슈:\n${issuesText}`;
  try {
    const r = await callAnthropicMessages({
      model: "claude-haiku-4-5",
      maxTokens: 200,
      prompt,
    });
    const text = r.text.trim();
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

// ============================================================================
// URL-based site audit (DIY, no external Lighthouse)
// ============================================================================

export type SeoUrlCheck = {
  key: string;
  label: string;
  pass: boolean;
  value?: string;
  detail?: string;
};

export type SeoUrlAuditResult = {
  url: string;
  fetchedAt: string;
  status: number;
  score: number; // 0..100
  checks: SeoUrlCheck[];
  issues: string[];
};

function pickAttr(re: RegExp, html: string): string | null {
  const m = html.match(re);
  return m ? (m[1] ?? "").trim() : null;
}

function countAll(re: RegExp, html: string): number {
  return (html.match(re) ?? []).length;
}

function urlCheckTitle(html: string): SeoUrlCheck {
  const title = pickAttr(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
  const len = title?.length ?? 0;
  const pass = !!title && len >= 30 && len <= 60;
  return {
    key: "title",
    label: "<title> 30-60자",
    pass,
    value: title ?? undefined,
    detail: title ? `${len}자` : "<title> 태그 없음",
  };
}

function urlCheckMetaDescription(html: string): SeoUrlCheck {
  const desc =
    pickAttr(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i, html) ??
    pickAttr(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i, html);
  const len = desc?.length ?? 0;
  const pass = !!desc && len >= 120 && len <= 160;
  return {
    key: "meta_description",
    label: "meta description 120-160자",
    pass,
    value: desc ?? undefined,
    detail: desc ? `${len}자` : "meta description 없음",
  };
}

function urlCheckH1(html: string): SeoUrlCheck {
  const count = countAll(/<h1\b[^>]*>/gi, html);
  return { key: "h1", label: "<h1> 단일 사용", pass: count === 1, detail: `${count}개 발견` };
}

function urlCheckImgAlt(html: string): SeoUrlCheck {
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  const missing = imgs.filter((tag) => !/\balt\s*=\s*["'][^"']*["']/i.test(tag)).length;
  return {
    key: "img_alt",
    label: "alt 없는 <img> 0개",
    pass: missing === 0,
    detail: `${imgs.length}개 중 ${missing}개 누락`,
  };
}

function urlCheckOpenGraph(html: string): SeoUrlCheck {
  const list = ["og:title", "og:description", "og:image", "og:url"].filter((k) =>
    new RegExp(`property=["']${k}["']`, "i").test(html),
  );
  return {
    key: "og",
    label: "Open Graph 태그",
    pass: list.length >= 3,
    detail: `발견: ${list.join(", ") || "없음"}`,
  };
}

function urlCheckCanonical(html: string): SeoUrlCheck {
  const canonical =
    pickAttr(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i, html) ??
    pickAttr(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i, html);
  return {
    key: "canonical",
    label: "Canonical URL",
    pass: !!canonical,
    value: canonical ?? undefined,
    detail: canonical ? undefined : "rel=canonical 없음",
  };
}

function urlCheckJsonLd(html: string): SeoUrlCheck {
  const count = countAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    html,
  );
  return {
    key: "json_ld",
    label: "JSON-LD 구조화 데이터",
    pass: count >= 1,
    detail: `${count}개 스크립트`,
  };
}

/**
 * DIY 사이트 SEO 감사. URL을 fetch해 정규식으로 주요 SEO 요소를 점검합니다.
 */
export async function runSeoAudit(url: string): Promise<SeoUrlAuditResult> {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    throw new Error("유효하지 않은 URL");
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error("http/https URL만 허용됩니다");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let status = 0;
  let html = "";
  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "ETHOS-SEO-Audit/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    status = res.status;
    html = await res.text();
  } finally {
    clearTimeout(timer);
  }

  const checks: SeoUrlCheck[] = [
    urlCheckTitle(html),
    urlCheckMetaDescription(html),
    urlCheckH1(html),
    urlCheckImgAlt(html),
    urlCheckOpenGraph(html),
    urlCheckCanonical(html),
    urlCheckJsonLd(html),
  ];

  const passed = checks.filter((c) => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const issues = checks
    .filter((c) => !c.pass)
    .map((c) => `${c.label}${c.detail ? ` — ${c.detail}` : ""}`);

  return {
    url: target.toString(),
    fetchedAt: new Date().toISOString(),
    status,
    score,
    checks,
    issues,
  };
}
