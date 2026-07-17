import { createHash } from "crypto";
import { smartInvoke } from "@/lib/services/smart-ai-client";
import type { TaskType } from "@/lib/services/model-router-service";
import { withCache } from "@/lib/services/cache-service";

/**
 * ⚠️ 시스템 내 유일한 "페이지 로드 트리거" AI 호출 (나머지는 전부 버튼/크론 트리거).
 * 블로그 본문은 정적이라 재생성이 불필요 → 긴 TTL.
 * 키를 본문 해시로 잡아 두면, 글을 수정했을 때만 자연히 새 요약이 생성된다.
 */
const BLOG_SUMMARY_TTL = 7 * 86400; // 7일

export async function generateBlogSummary(content: string): Promise<{ summary: string; readingTimeMin: number }> {
  const key = `blog:summary:${createHash("md5").update(content).digest("hex").slice(0, 16)}`;
  return withCache(key, BLOG_SUMMARY_TTL, async () => {
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
  });
}
