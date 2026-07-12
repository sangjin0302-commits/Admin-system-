import { smartInvoke } from "@/lib/services/smart-ai-client";
import type { TaskType } from "@/lib/services/model-router-service";

export async function generateBlogSummary(content: string): Promise<{ summary: string; readingTimeMin: number }> {
  const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readingTimeMin = Math.max(1, Math.round(wordCount / 200));

  try {
    const result = await smartInvoke(
      "simple_classify" as TaskType,
      "You are a Korean blog summarizer. Given article content, produce a 2-3 sentence summary in Korean. Return ONLY the summary text, nothing else.\n\n" + content.slice(0, 3000),
      { system: "You are a Korean blog summarizer." },
    );
    return { summary: result.text.trim() || "요약을 생성할 수 없습니다.", readingTimeMin };
  } catch {
    return { summary: "요약을 생성할 수 없습니다.", readingTimeMin };
  }
}
