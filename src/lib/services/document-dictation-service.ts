/**
 * 음성 서면 받아쓰기 — 구술 내용을 정형화된 법률 서면으로 변환.
 */

import { logger } from "@/lib/utils/logger";

export type DocumentType = "의견서" | "청구서" | "이의신청서";

const TYPE_PROMPTS: Record<DocumentType, string> = {
  의견서: "법률 의견서 형식 (제목·전제사실·법률적 판단·결론).",
  청구서: "행정심판 청구서 형식 (제목·청구인·청구취지·청구원인·결론).",
  이의신청서: "행정처분 이의신청서 형식 (제목·처분내용·이의사유·결론)."
};

export async function formalizeDictation(
  transcript: string,
  documentType: DocumentType
): Promise<{ text: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { text: fallback(transcript, documentType) };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: `You are a Korean administrative attorney. Convert casual spoken dictation into a formal legal document. Preserve the speaker's intent; add proper structure and formal language.\n\n형식: ${TYPE_PROMPTS[documentType]}`,
        messages: [{ role: "user", content: `[구술 내용]\n${transcript}` }]
      })
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? fallback(transcript, documentType);
    return { text };
  } catch (err) {
    logger.error("[dictation] formalize failed", err);
    return { text: fallback(transcript, documentType) };
  }
}

function fallback(transcript: string, documentType: DocumentType): string {
  return `${documentType}\n\n1. 전제사실\n${transcript}\n\n2. 결론\n(수동 정리 필요)`;
}
