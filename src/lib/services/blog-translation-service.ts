import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export type TargetLang = "en" | "zh";

const SYSTEM_PROMPTS: Record<TargetLang, string> = {
  en:
    "You translate Korean legal/administrative blog posts to natural English. Preserve HTML tags, images, links. Translate idiomatically not literally. Keep proper nouns and legal terms accurate (e.g. 행정사 = administrative agent, 비자 = visa). Output ONLY valid JSON with keys title, excerpt, body — no markdown fences, no commentary.",
  zh:
    "你是把韩国行政/法律博客翻译成简体中文的专家。保留所有 HTML 标签、图片、链接。意译而非直译。专有名词和法律术语要准确(例:행정사 = 行政士,비자 = 签证)。仅输出有效 JSON,含 title、excerpt、body 三个字段。不要 markdown 代码围栏,不要额外说明。",
};

export type TranslateInput = {
  title: string;
  excerpt: string;
  body: string;
};

/** Legacy shape kept for existing English-only callers. */
export type TranslateOutput = {
  titleEn: string;
  excerptEn: string;
  bodyEn: string;
};

export type TranslatedContent = {
  title: string;
  excerpt: string;
  body: string;
  targetLang: TargetLang;
  translatedAt: string;
};

async function callClaude(
  input: TranslateInput,
  targetLang: TargetLang
): Promise<{ title: string; excerpt: string; body: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.warn("[blog-translate] ANTHROPIC_API_KEY not set, skipping");
    return null;
  }

  const userMessage =
    targetLang === "en"
      ? `Translate the following Korean blog post to English. Return JSON only with keys title, excerpt, body.

TITLE:
${input.title}

EXCERPT:
${input.excerpt}

BODY (HTML — preserve all tags, images, links):
${input.body}`
      : `请把下面这篇韩语博客翻译成简体中文。只输出 JSON,字段为 title / excerpt / body。

TITLE:
${input.title}

EXCERPT:
${input.excerpt}

BODY (HTML — 保留所有标签/图片/链接):
${input.body}`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPTS[targetLang],
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.error("[blog-translate] API error", { status: res.status, targetLang, body: errText.slice(0, 500) });
      return null;
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { title?: string; excerpt?: string; body?: string; titleEn?: string; excerptEn?: string; bodyEn?: string };
    // Accept both legacy (titleEn) and new (title) shapes
    const title = parsed.title ?? parsed.titleEn ?? "";
    const excerpt = parsed.excerpt ?? parsed.excerptEn ?? "";
    const body = parsed.body ?? parsed.bodyEn ?? "";
    if (!title || !body) {
      logger.warn("[blog-translate] invalid response shape", { targetLang });
      return null;
    }
    return { title, excerpt, body };
  } catch (err) {
    logger.error("[blog-translate] failed", err);
    return null;
  }
}

/**
 * Generic translation entry point.
 * Preserves HTML structure. Returns null on failure.
 */
export async function translateBlogPostTo(
  input: TranslateInput,
  targetLang: TargetLang
): Promise<TranslatedContent | null> {
  const result = await callClaude(input, targetLang);
  if (!result) return null;
  return {
    title: result.title,
    excerpt: result.excerpt,
    body: result.body,
    targetLang,
    translatedAt: new Date().toISOString(),
  };
}

/** Legacy English-only signature kept for existing callers. */
export async function translateBlogPost(input: TranslateInput): Promise<TranslateOutput | null> {
  const r = await translateBlogPostTo(input, "en");
  if (!r) return null;
  return { titleEn: r.title, excerptEn: r.excerpt, bodyEn: r.body };
}

// ── Persistence for non-English translations (SiteSetting-backed, no schema change) ──

function zhKey(postId: string): string {
  return `blog.translation.zh.${postId}`;
}

export async function getBlogTranslationZh(postId: string): Promise<TranslatedContent | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: zhKey(postId) } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value) as TranslatedContent;
    if (parsed && typeof parsed.title === "string" && typeof parsed.body === "string") {
      return { ...parsed, targetLang: "zh" };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveBlogTranslationZh(postId: string, content: TranslatedContent): Promise<void> {
  const value = JSON.stringify({ ...content, targetLang: "zh" });
  await prisma.siteSetting.upsert({
    where: { key: zhKey(postId) },
    create: { key: zhKey(postId), value },
    update: { value },
  });
}

export async function deleteBlogTranslationZh(postId: string): Promise<void> {
  try {
    await prisma.siteSetting.delete({ where: { key: zhKey(postId) } });
  } catch { /* ignore */ }
}

// ── Utility: list translation status for a set of posts ──
export type BlogTranslationStatus = {
  postId: string;
  hasEn: boolean;
  hasZh: boolean;
};

export async function getTranslationStatusMap(postIds: string[]): Promise<Record<string, BlogTranslationStatus>> {
  const out: Record<string, BlogTranslationStatus> = {};
  if (postIds.length === 0) return out;
  const posts = await prisma.blogPost.findMany({
    where: { id: { in: postIds } },
    select: { id: true, titleEn: true, bodyEn: true },
  });
  const zhKeys = postIds.map(zhKey);
  const zhRows = await prisma.siteSetting.findMany({
    where: { key: { in: zhKeys } },
    select: { key: true },
  });
  const zhSet = new Set(zhRows.map((r) => r.key));
  for (const p of posts) {
    out[p.id] = {
      postId: p.id,
      hasEn: Boolean(p.titleEn && p.bodyEn),
      hasZh: zhSet.has(zhKey(p.id)),
    };
  }
  return out;
}
