import { logger } from "@/lib/utils/logger";
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
      return await generateWithAI(apiKey, title, body, category);
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
  apiKey: string,
  title: string,
  body: string,
  category: string,
): Promise<BlogSEOMeta> {
  const truncatedBody = body.slice(0, 2000);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system:
        "You are an SEO specialist for ETHOS 행정사사무소 (Korean administrative agent office). Generate optimized SEO metadata in Korean for blog posts. Respond ONLY with JSON.",
      messages: [
        {
          role: "user",
          content: `다음 블로그 글에 대한 SEO 메타데이터를 JSON으로 생성해 주세요.

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
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");

  return JSON.parse(match[0]) as BlogSEOMeta;
}
