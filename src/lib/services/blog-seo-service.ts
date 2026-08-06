import { logger } from "@/lib/utils/logger";
import { getSiteUrl } from "@/lib/utils/site-url";
import { smartInvoke } from "./smart-ai-client";
import { callAnthropicMessages } from "@/lib/services/anthropic-gateway";

export type BlogSEOMeta = {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  canonicalSlug: string;
};

export async function generateBlogSEO(
  title: string,
  body: string,
  category: string,
): Promise<BlogSEOMeta> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      return await generateWithAI(title, body, category);
    } catch (err) {
      logger.error("AI SEO generation failed, falling back:", err);
    }
  }

  return generateFallback(title, body, category);
}

function generateFallback(
  title: string,
  body: string,
  category: string,
): BlogSEOMeta {
  const plainBody = body.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const metaDescription = plainBody.slice(0, 160);

  // Extract Korean nouns (2+ char sequences of Hangul)
  const koreanWords = plainBody.match(/[가-힣]{2,}/g) ?? [];
  const wordFreq = new Map<string, number>();
  for (const w of koreanWords) {
    wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
  }
  const keywords = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

  return {
    metaTitle: `${title} | ETHOS 행정사사무소`,
    metaDescription,
    keywords,
    ogTitle: title,
    ogDescription: metaDescription,
    canonicalSlug: slug,
  };
}

async function generateWithAI(
  title: string,
  body: string,
  category: string,
): Promise<BlogSEOMeta> {
  const truncatedBody = body.slice(0, 2000);

  const r = await callAnthropicMessages({
    model: "claude-haiku-4-5-20251001",
    maxTokens: 500,
    system:
      "You are an SEO specialist for ETHOS 행정사사무소 (Korean administrative agent office). Generate optimized SEO metadata in Korean for blog posts. Respond ONLY with JSON.",
    prompt: `다음 블로그 글에 대한 SEO 메타데이터를 JSON으로 생성해 주세요.

제목: ${title}
카테고리: ${category}
본문 (일부): ${truncatedBody}

JSON 형식:
{
  "metaTitle": "SEO 최적화된 제목 (60자 이내)",
  "metaDescription": "메타 설명 (160자 이내)",
  "keywords": ["키워드1", "키워드2", ...최대 8개],
  "ogTitle": "OG 제목",
  "ogDescription": "OG 설명 (120자 이내)",
  "canonicalSlug": "url-friendly-slug"
}`,
  });

  const text = r.text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");

  return JSON.parse(match[0]) as BlogSEOMeta;
}

// ---------------------------------------------------------------------------
// III5: blog_seo_auto — generateSeoMeta(post) → { metaDescription, ogTitle, ogDescription, schemaOrg }
// ---------------------------------------------------------------------------

export type BlogPostSeoInput = {
  id?: string;
  slug: string;
  title: string;
  body: string;
  excerpt?: string | null;
  category?: string | null;
  coverImage?: string | null;
  authorName?: string | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export type BlogSeoMeta = {
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  schemaOrg: Record<string, unknown>;
};

const HAIKU_MODEL = "claude-haiku-4-5-20251001";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function generateMetaDescription(post: BlogPostSeoInput): Promise<string> {
  const plain = stripHtml(post.body).slice(0, 3000);
  const prompt = [
    "다음 법률 블로그 글의 메타 설명을 한국어 140-155자로 작성합니다.",
    "- 검색 결과 스니펫 용도 (SEO)",
    "- 핵심 키워드 포함, 클릭 유도",
    "- 따옴표·이모지·번호 없이 한 문단",
    "",
    `제목: ${post.title}`,
    `본문: ${plain}`,
    "",
    "메타 설명만 출력:",
  ].join("\n");

  // Try smartInvoke first (routes to Haiku for summarize)
  try {
    const res = await smartInvoke("summarize", prompt, { maxTokens: 300 });
    const text = res.text?.trim();
    if (text) return text.replace(/^["'`]|["'`]$/g, "").slice(0, 160);
  } catch (err) {
    logger.warn("[blog-seo] smartInvoke failed, falling back to Haiku direct", err);
  }

  // Direct Haiku fallback
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const resp = await callAnthropicMessages({
        model: HAIKU_MODEL,
        maxTokens: 300,
        prompt,
      });
      const text = resp.text.trim();
      if (text) return text.replace(/^["'`]|["'`]$/g, "").slice(0, 160);
    } catch (err) {
      logger.warn("[blog-seo] Haiku direct fallback failed", err);
    }
  }

  const src = post.excerpt?.trim() || stripHtml(post.body);
  return src.slice(0, 155).trim();
}

function buildBlogPostingSchema(
  post: BlogPostSeoInput,
  description: string
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/${post.slug}`;
  const datePublished = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : post.createdAt
    ? new Date(post.createdAt).toISOString()
    : new Date().toISOString();

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    datePublished,
    dateModified: datePublished,
    author: {
      "@type": "Organization",
      name: post.authorName ?? "ETHOS 행정사사무소",
    },
    publisher: {
      "@type": "Organization",
      name: "ETHOS 행정사사무소",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
  if (post.coverImage) {
    schema.image = post.coverImage.startsWith("http")
      ? post.coverImage
      : `${siteUrl}${post.coverImage.startsWith("/") ? "" : "/"}${post.coverImage}`;
  }
  return schema;
}

export async function generateSeoMeta(post: BlogPostSeoInput): Promise<BlogSeoMeta> {
  const metaDescription = await generateMetaDescription(post);
  const ogTitle = post.title.length > 70 ? `${post.title.slice(0, 67)}...` : post.title;
  return {
    metaDescription,
    ogTitle,
    ogDescription: metaDescription,
    schemaOrg: buildBlogPostingSchema(post, metaDescription),
  };
}

