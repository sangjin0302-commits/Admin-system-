/**
 * 실시간 감정 분석 (통화·메시지).
 *
 * - 들어오는 메시지 하나를 즉시 분석 (Claude Haiku).
 * - 감지 감정: 분노, 좌절, 실망, 만족, 안심, 혼란
 * - 감정 흐름을 SiteSetting key = "client.emotion.<inquiryId>" 로 누적 저장.
 * - 위기 감정(분노 급증)일 때 alert 반환.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const KEY_PREFIX = "client.emotion.";
const MAX_TRACE_ENTRIES = 40;

export type EmotionLabel = "분노" | "좌절" | "실망" | "만족" | "안심" | "혼란" | "중립";

export type EmotionAnalysis = {
  emotion: EmotionLabel;
  intensity: number; // 0-1
  suggestedTone: string;
  reasoning: string;
  source: "ai" | "heuristic";
  at: string;
};

export type EmotionTrace = {
  inquiryId: string;
  entries: EmotionAnalysis[];
  current: EmotionAnalysis | null;
  alert: null | { level: "warn" | "critical"; message: string };
};

function traceKey(inquiryId: string): string {
  return `${KEY_PREFIX}${inquiryId}`;
}

const KEYWORDS: Record<EmotionLabel, string[]> = {
  분노: ["화나", "짜증", "말도 안", "환불", "고소", "말이 안", "왜 이렇게", "짜증나"],
  좌절: ["안 되", "포기", "지쳤", "힘들", "안 됩니다"],
  실망: ["실망", "기대했", "믿었는데"],
  만족: ["감사", "고맙", "만족", "훌륭", "좋습니다"],
  안심: ["다행", "안심", "괜찮"],
  혼란: ["모르겠", "잘 모르", "이해가", "혼란", "뭐죠"],
  중립: [],
};

const TONE_BY_EMOTION: Record<EmotionLabel, string> = {
  분노: "차분·공감 우선, 즉각 해결책 제시, 사과 필요 시 명시",
  좌절: "공감·구체적 다음 단계 안내, 부담 축소",
  실망: "정중한 인정·개선책 즉시 공유",
  만족: "감사 표현·다음 단계 자연스러운 연결",
  안심: "간결한 확인·후속 일정 명확화",
  혼란: "단계별 재설명·시각화·확인 질문",
  중립: "표준 존댓말·간결한 사실 전달",
};

function heuristicAnalyze(message: string): EmotionAnalysis {
  let winner: EmotionLabel = "중립";
  let bestHits = 0;
  for (const [label, terms] of Object.entries(KEYWORDS) as Array<[EmotionLabel, string[]]>) {
    const hits = terms.filter((t) => message.includes(t)).length;
    if (hits > bestHits) {
      bestHits = hits;
      winner = label;
    }
  }
  const intensity = winner === "중립" ? 0.2 : Math.min(1, 0.4 + bestHits * 0.2);
  return {
    emotion: winner,
    intensity,
    suggestedTone: TONE_BY_EMOTION[winner],
    reasoning: `키워드 매칭 (${bestHits}회) 기반 휴리스틱 판단.`,
    source: "heuristic",
    at: new Date().toISOString(),
  };
}

async function aiAnalyze(apiKey: string, message: string): Promise<EmotionAnalysis | null> {
  const prompt = `You are analyzing the emotion of a Korean-language client message.

Return ONLY JSON:
{"emotion":"분노|좌절|실망|만족|안심|혼란|중립","intensity":0-1,"reasoning":"한국어 1문장"}

Message:
${message.slice(0, 1000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]);
  const allowed: EmotionLabel[] = ["분노", "좌절", "실망", "만족", "안심", "혼란", "중립"];
  const emotion: EmotionLabel = allowed.includes(parsed.emotion) ? parsed.emotion : "중립";
  const rawInt = typeof parsed.intensity === "number" ? parsed.intensity : Number(parsed.intensity);
  const intensity = Number.isFinite(rawInt) ? Math.max(0, Math.min(1, rawInt)) : 0.5;
  return {
    emotion,
    intensity,
    suggestedTone: TONE_BY_EMOTION[emotion],
    reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "AI 판단",
    source: "ai",
    at: new Date().toISOString(),
  };
}

async function loadTrace(inquiryId: string): Promise<EmotionAnalysis[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: traceKey(inquiryId) } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (Array.isArray(parsed)) return parsed as EmotionAnalysis[];
    return [];
  } catch {
    return [];
  }
}

async function saveTrace(inquiryId: string, entries: EmotionAnalysis[]): Promise<void> {
  const trimmed = entries.slice(-MAX_TRACE_ENTRIES);
  await prisma.siteSetting.upsert({
    where: { key: traceKey(inquiryId) },
    create: { key: traceKey(inquiryId), value: JSON.stringify(trimmed) },
    update: { value: JSON.stringify(trimmed) },
  });
}

function computeAlert(entries: EmotionAnalysis[]): EmotionTrace["alert"] {
  if (entries.length === 0) return null;
  const recent = entries.slice(-3);
  const angryCount = recent.filter((e) => e.emotion === "분노" && e.intensity >= 0.6).length;
  if (angryCount >= 2) {
    return { level: "critical", message: "분노 감정 연속 감지 — 관리자 에스컬레이션 권장." };
  }
  const last = entries[entries.length - 1];
  if (last && (last.emotion === "분노" || last.emotion === "좌절") && last.intensity >= 0.7) {
    return { level: "warn", message: `${last.emotion} 강도 높음 — 즉시 개입 검토.` };
  }
  return null;
}

/**
 * 신규 메시지 분석 후 감정 추적에 append.
 */
export async function analyzeIncomingMessage(
  inquiryId: string,
  message: string
): Promise<EmotionTrace> {
  const enabled = await isFeatureEnabled("live_emotion_analyzer");
  if (!enabled) throw new Error("live_emotion_analyzer 기능이 비활성화되어 있습니다.");
  if (!message.trim()) throw new Error("메시지가 비어 있습니다.");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let analysis: EmotionAnalysis | null = null;
  if (apiKey) {
    try {
      analysis = await aiAnalyze(apiKey, message);
    } catch (err) {
      logger.warn("[live-emotion-analyzer] AI 실패 — heuristic fallback", err);
    }
  }
  if (!analysis) analysis = heuristicAnalyze(message);

  const entries = await loadTrace(inquiryId);
  entries.push(analysis);
  await saveTrace(inquiryId, entries);

  return {
    inquiryId,
    entries,
    current: analysis,
    alert: computeAlert(entries),
  };
}

export async function getEmotionTrace(inquiryId: string): Promise<EmotionTrace> {
  const entries = await loadTrace(inquiryId);
  return {
    inquiryId,
    entries,
    current: entries[entries.length - 1] ?? null,
    alert: computeAlert(entries),
  };
}
