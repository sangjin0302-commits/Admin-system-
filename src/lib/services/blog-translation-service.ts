import { logger } from "@/lib/utils/logger";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT =
  "You translate Korean legal/administrative blog posts to natural English. Preserve HTML tags, images, links. Translate idiomatically not literally. Keep proper nouns and legal terms accurate (e.g. 행정사 = administrative agent, 비자 = visa). Output ONLY valid JSON with keys titleEn, excerptEn, bodyEn — no markdown fences, no commentary.";

export type TranslateInput = {
  title: string;
  excerpt: string;
  body: string;
};

export type TranslateOutput = {
  titleEn: string;
  excerptEn: string;
  bodyEn: string;
};

export async function translateBlogPost(
  input: TranslateInput
): Promise<TranslateOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.warn("[blog-translate] ANTHROPIC_API_KEY not set, skipping");
    return null;
  }

  const userMessage = `Translate the following Korean blog post to English. Return JSON only.

TITLE:
${input.title}

EXCERPT:
${input.excerpt}

BODY (HTML — preserve all tags, images, links):
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
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.error("[blog-translate] API error", { status: res.status, body: errText.slice(0, 500) });
      return null;
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as TranslateOutput;
    if (
      typeof parsed.titleEn !== "string" ||
      typeof parsed.excerptEn !== "string" ||
      typeof parsed.bodyEn !== "string"
    ) {
      logger.warn("[blog-translate] invalid response shape");
      return null;
    }
    return parsed;
  } catch (err) {
    logger.error("[blog-translate] failed", err);
    return null;
  }
}
