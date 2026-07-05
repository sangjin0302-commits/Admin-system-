/**
 * AI 감정 분석 (Sentiment) — 고객 메시지에서 위험 신호 감지.
 * Claude Haiku 사용. SiteSetting key "sentiment.<inquiryId>"에 저장.
 */
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type SentimentLabel = "positive" | "neutral" | "negative" | "critical";

export interface SentimentResult {
  sentiment: SentimentLabel;
  riskFactors: string[];
  suggestedAction: string;
  confidence: number;
  analyzedAt: string;
  sampleExcerpt?: string;
}

const KEY_PREFIX = "sentiment.";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a Korean customer support sentiment analyst for a legal/administrative service.
Analyze the message and return ONE JSON object:
{
  "sentiment": "positive" | "neutral" | "negative" | "critical",
  "riskFactors": string[],  // Korean short phrases, e.g. ["환불 요구", "감정적 분노"]
  "suggestedAction": string, // Korean, one sentence, actionable
  "confidence": number       // 0..1
}
- "critical" = 법적 위협·환불/취소·언론·이탈 임박.
- "negative" = 불만·불신·지연 항의.
- Output ONLY the JSON. No markdown, no prose.`;

function keyFor(inquiryId: string): string {
  return `${KEY_PREFIX}${inquiryId}`;
}

function heuristicFallback(text: string): SentimentResult {
  const t = text.toLowerCase();
  const critical =
    /환불|취소해|고소|소송|언론|기자|블로그.*폭로|악플|별점.*1/.test(t) ||
    /(사기|기망|배임|고발)/.test(t);
  const negative = /불만|화나|짜증|지연|늦|답답|실망|답장.*없/.test(t);
  if (critical) {
    return {
      sentiment: "critical",
      riskFactors: ["법적 위협/환불 언급 감지"],
      suggestedAction: "즉시 담당자 지정 후 1시간 내 유선 응대",
      confidence: 0.55,
      analyzedAt: new Date().toISOString(),
      sampleExcerpt: text.slice(0, 120),
    };
  }
  if (negative) {
    return {
      sentiment: "negative",
      riskFactors: ["감정 격화 어휘 감지"],
      suggestedAction: "공감 응대 스크립트 사용, 3시간 내 진행 상황 재공유",
      confidence: 0.5,
      analyzedAt: new Date().toISOString(),
      sampleExcerpt: text.slice(0, 120),
    };
  }
  return {
    sentiment: "neutral",
    riskFactors: [],
    suggestedAction: "일반 응대",
    confidence: 0.4,
    analyzedAt: new Date().toISOString(),
    sampleExcerpt: text.slice(0, 120),
  };
}

export async function analyzeMessage(text: string): Promise<SentimentResult> {
  const trimmed = (text ?? "").trim();
  if (!trimmed) {
    return {
      sentiment: "neutral",
      riskFactors: [],
      suggestedAction: "메시지 없음",
      confidence: 0,
      analyzedAt: new Date().toISOString(),
    };
  }
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return heuristicFallback(trimmed);
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
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: trimmed.slice(0, 4000) }],
      }),
    });
    if (!res.ok) {
      logger.warn("[sentiment] anthropic error", res.status);
      return heuristicFallback(trimmed);
    }
    const data = await res.json();
    const raw = data?.content?.[0]?.text?.trim();
    const match = raw?.match(/\{[\s\S]*\}/);
    if (!match) return heuristicFallback(trimmed);
    const parsed = JSON.parse(match[0]) as Partial<SentimentResult>;
    const sentiment: SentimentLabel = ["positive", "neutral", "negative", "critical"].includes(parsed.sentiment as string)
      ? (parsed.sentiment as SentimentLabel)
      : "neutral";
    return {
      sentiment,
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors.slice(0, 5).map(String) : [],
      suggestedAction: typeof parsed.suggestedAction === "string" ? parsed.suggestedAction.slice(0, 300) : "표준 응대",
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.6,
      analyzedAt: new Date().toISOString(),
      sampleExcerpt: trimmed.slice(0, 120),
    };
  } catch (err) {
    logger.warn("[sentiment] exception", err);
    return heuristicFallback(trimmed);
  }
}

export async function getStoredSentiment(inquiryId: string): Promise<SentimentResult | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: keyFor(inquiryId) } }).catch(() => null);
  if (!row?.value) return null;
  try { return JSON.parse(row.value) as SentimentResult; } catch { return null; }
}

async function storeSentiment(inquiryId: string, result: SentimentResult): Promise<void> {
  const value = JSON.stringify(result);
  await prisma.siteSetting.upsert({
    where: { key: keyFor(inquiryId) },
    create: { key: keyFor(inquiryId), value },
    update: { value },
  });
}

/** 특정 문의의 최근 메시지들을 종합 분석 */
export async function analyzeInquiry(inquiryId: string): Promise<SentimentResult | null> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { description: true, title: true, contactName: true },
  });
  if (!inquiry) return null;
  const text = `${inquiry.title}\n${inquiry.description}`.trim();
  const result = await analyzeMessage(text);
  await storeSentiment(inquiryId, result);
  return result;
}

/** 최근 N일간 문의 배치 스캔 (크론용) */
export async function scanRecentInquiries(
  hours = 24
): Promise<{ scanned: number; critical: string[]; negative: string[] }> {
  const since = new Date(Date.now() - hours * 3_600_000);
  const inquiries = await prisma.inquiry.findMany({
    where: { updatedAt: { gte: since } },
    select: { id: true, description: true, title: true, contactName: true, email: true },
    take: 100,
    orderBy: { updatedAt: "desc" },
  });
  const critical: string[] = [];
  const negative: string[] = [];
  for (const inq of inquiries) {
    const text = `${inq.title}\n${inq.description}`.trim();
    if (!text) continue;
    const result = await analyzeMessage(text);
    await storeSentiment(inq.id, result);
    if (result.sentiment === "critical") critical.push(inq.id);
    else if (result.sentiment === "negative") negative.push(inq.id);
  }
  return { scanned: inquiries.length, critical, negative };
}

/** 최근 7일 위험 문의 리스트 */
export async function listAtRiskInquiries(days = 7): Promise<
  Array<{
    inquiryId: string;
    contactName: string;
    email: string;
    title: string;
    sentiment: SentimentLabel;
    riskFactors: string[];
    suggestedAction: string;
    analyzedAt: string;
  }>
> {
  const since = new Date(Date.now() - days * 24 * 3_600_000);
  const rows = await prisma.siteSetting.findMany({
    where: {
      key: { startsWith: KEY_PREFIX },
      updatedAt: { gte: since },
    },
    take: 200,
    orderBy: { updatedAt: "desc" },
  });
  const results: Array<{
    inquiryId: string;
    contactName: string;
    email: string;
    title: string;
    sentiment: SentimentLabel;
    riskFactors: string[];
    suggestedAction: string;
    analyzedAt: string;
  }> = [];
  for (const row of rows) {
    let parsed: SentimentResult | null = null;
    try { parsed = JSON.parse(row.value) as SentimentResult; } catch { continue; }
    if (!parsed) continue;
    if (parsed.sentiment !== "negative" && parsed.sentiment !== "critical") continue;
    const inquiryId = row.key.slice(KEY_PREFIX.length);
    const inq = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: { contactName: true, email: true, title: true },
    });
    if (!inq) continue;
    results.push({
      inquiryId,
      contactName: inq.contactName,
      email: inq.email,
      title: inq.title,
      sentiment: parsed.sentiment,
      riskFactors: parsed.riskFactors,
      suggestedAction: parsed.suggestedAction,
      analyzedAt: parsed.analyzedAt,
    });
  }
  return results;
}

export const DEESCALATION_TEMPLATES: Array<{ id: string; label: string; body: string }> = [
  {
    id: "empathy_first",
    label: "공감 우선",
    body:
      "안녕하세요, 담당자입니다. 먼저 불편을 드려 진심으로 죄송합니다. 말씀 주신 부분을 즉시 확인하고, 오늘 내로 진행 상황을 다시 안내드리겠습니다.",
  },
  {
    id: "status_update",
    label: "진행 상황 즉시 공유",
    body:
      "확인이 늦어 죄송합니다. 현재 [단계]까지 진행되었고, [다음 단계]는 [예상 일정]에 완료 예정입니다. 궁금하신 점은 언제든 말씀해 주세요.",
  },
  {
    id: "refund_check",
    label: "환불/취소 요청 대응",
    body:
      "요청하신 사항 확인했습니다. 계약 조항에 따라 처리 방안을 정리해 오늘 중으로 다시 연락드리겠습니다. 잠시만 기다려 주세요.",
  },
  {
    id: "escalate",
    label: "책임자 에스컬레이션",
    body:
      "말씀하신 내용을 대표 및 담당 책임자에게 즉시 공유하였습니다. 24시간 내로 직접 연락드릴 수 있도록 조치하겠습니다.",
  },
];
