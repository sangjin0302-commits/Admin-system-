/**
 * 블로그 글 description meta 자동 생성.
 * Anthropic Haiku — 본문에서 SEO/SNS용 1-2줄 description 추출.
 */
import { logger } from "@/lib/utils/logger";
import { callAnthropicMessages } from "@/lib/services/anthropic-gateway";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT =
  "You write SEO meta descriptions for Korean legal/administrative blog posts. Output 1-2 sentences in Korean, 80-160 characters, capturing the post's main practical value. Include 1-2 key terms (e.g., D-8, 행정심판). No clickbait, no 'this article explains'. Output ONLY plain text, no JSON, no markdown.";

export async function generateMetaDescription(input: { title: string; body: string }): Promise<string | null> {
  const userMsg = `제목: ${input.title}\n\n본문:\n${input.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000)}`;

  try {
    const r = await callAnthropicMessages({
      model: MODEL,
      maxTokens: 200,
      system: SYSTEM_PROMPT,
      prompt: userMsg,
    });
    const text = r.text.trim();
    if (!text) return null;
    return text.slice(0, 200);
  } catch (err) {
    logger.warn("[blog-meta] exception", err);
    return null;
  }
}
