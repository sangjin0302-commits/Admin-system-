/**
 * 블로그 글 description meta 자동 생성.
 * Anthropic Haiku — 본문에서 SEO/SNS용 1-2줄 description 추출.
 */
import { logger } from "@/lib/utils/logger";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT =
  "You write SEO meta descriptions for Korean legal/administrative blog posts. Output 1-2 sentences in Korean, 80-160 characters, capturing the post's main practical value. Include 1-2 key terms (e.g., D-8, 행정심판). No clickbait, no 'this article explains'. Output ONLY plain text, no JSON, no markdown.";

export async function generateMetaDescription(input: { title: string; body: string }): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const userMsg = `제목: ${input.title}\n\n본문:\n${input.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000)}`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }]
      })
    });
    if (!res.ok) {
      logger.warn("[blog-meta] anthropic error", res.status);
      return null;
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim();
    if (!text) return null;
    return text.slice(0, 200);
  } catch (err) {
    logger.warn("[blog-meta] exception", err);
    return null;
  }
}
