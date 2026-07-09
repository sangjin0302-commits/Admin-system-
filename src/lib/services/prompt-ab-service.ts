import { logger } from "@/lib/utils/logger";

const PROMPT_VARIANTS: Record<string, { id: string; label: string; systemSuffix: string }[]> = {
  reply_draft: [
    {
      id: "formal",
      label: "격식체",
      systemSuffix: "격식 있고 전문적인 어조로 답변하세요. 법률 용어를 정확히 사용하되 의뢰인이 이해할 수 있게 설명하세요.",
    },
    {
      id: "empathetic",
      label: "공감형",
      systemSuffix: "의뢰인의 상황에 공감하며 따뜻하고 안심시키는 어조로 답변하세요. 해결 방향을 명확히 제시하세요.",
    },
    {
      id: "solution",
      label: "해결중심",
      systemSuffix: "간결하게 핵심 해결책부터 제시하세요. 구체적인 다음 단계와 필요 서류를 목록으로 안내하세요.",
    },
  ],
};

export function getPromptVariant(taskType: string, seed: string) {
  const variants = PROMPT_VARIANTS[taskType];
  if (!variants || variants.length === 0) return null;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % variants.length;
  const variant = variants[idx];
  logger.info(`[prompt-ab] taskType=${taskType} seed=${seed} → variant=${variant.id}`);
  return variant;
}

export function getVariantIds(taskType: string): string[] {
  return (PROMPT_VARIANTS[taskType] ?? []).map((v) => v.id);
}
