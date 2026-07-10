/**
 * AI 사전 심사 — 문의 접수 후 긴급도·예상 응답시간·추천 채널을 자동 판정합니다.
 */

import { smartInvoke } from "@/lib/services/smart-ai-client";
import type { TaskType } from "@/lib/services/model-router-service";
import { logger } from "@/lib/utils/logger";

export type UrgencyLevel = "low" | "medium" | "high";

export interface PrescreenResult {
  urgencyLevel: UrgencyLevel;
  estimatedResponseTime: string;
  suggestedChannel: string;
  briefNote: string;
}

export interface PrescreenInput {
  category: string;
  description: string;
  urgencyHint?: string;
}

const SYSTEM_PROMPT = `당신은 행정사 사무소의 접수 보조입니다. 의뢰인이 제출한 문의 카테고리와 설명을 바탕으로 다음을 JSON으로 답하세요:
- urgencyLevel: "low" | "medium" | "high"
- estimatedResponseTime: 예상 회신 소요 시간 (예: "1시간 이내", "당일 중", "1-2 영업일")
- suggestedChannel: "kakao" | "email" | "phone"
- briefNote: 의뢰인에게 보여줄 1-2문장 안내 (한국어)

긴급 판정 기준:
- 비자·체류 기간 만료 임박, 행정심판 기한 → high
- 일반 허가·인허가 → medium
- 단순 문의·상담 → low`;

const TASK_TYPE: TaskType = "simple_classify";

const HIGH_CATEGORIES = new Set(["visa", "appeal", "비자", "행정심판", "체류", "출입국"]);
const MEDIUM_CATEGORIES = new Set(["permit", "license", "허가", "인허가", "등록"]);

function fallbackPrescreen(data: PrescreenInput): PrescreenResult {
  const cat = data.category.toLowerCase();

  if (HIGH_CATEGORIES.has(cat)) {
    return {
      urgencyLevel: "high",
      estimatedResponseTime: "1시간 이내",
      suggestedChannel: "kakao",
      briefNote: "긴급 사안으로 분류되었습니다. 카카오톡으로 빠르게 상담받으실 수 있습니다.",
    };
  }
  if (MEDIUM_CATEGORIES.has(cat)) {
    return {
      urgencyLevel: "medium",
      estimatedResponseTime: "당일 중",
      suggestedChannel: "kakao",
      briefNote: "접수가 완료되었습니다. 당일 중 회신드리겠습니다.",
    };
  }
  return {
    urgencyLevel: "low",
    estimatedResponseTime: "1-2 영업일",
    suggestedChannel: "email",
    briefNote: "접수가 완료되었습니다. 이메일로 상세히 안내드리겠습니다.",
  };
}

export async function prescreenInquiry(
  data: PrescreenInput,
): Promise<PrescreenResult> {
  try {
    const prompt = `카테고리: ${data.category}\n설명: ${data.description}${data.urgencyHint ? `\n긴급 힌트: ${data.urgencyHint}` : ""}`;

    const result = await smartInvoke(TASK_TYPE, prompt, {
      system: SYSTEM_PROMPT,
      maxTokens: 256,
    });

    const parsed = JSON.parse(result.text) as PrescreenResult;

    // Validate required fields
    if (
      !parsed.urgencyLevel ||
      !parsed.estimatedResponseTime ||
      !parsed.suggestedChannel ||
      !parsed.briefNote
    ) {
      throw new Error("Incomplete AI response");
    }

    return parsed;
  } catch (err) {
    logger.warn("intake-prescreen AI failed, using fallback", { error: err });
    return fallbackPrescreen(data);
  }
}
