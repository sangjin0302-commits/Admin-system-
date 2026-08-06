/**
 * AI 우선순위 스코어링 — 신규 문의를 자동 점수화.
 *
 * 저장: Inquiry에 priorityScore 컬럼이 없으므로 SiteSetting 키로 저장.
 *   - key: "priority.score.<inquiryId>"
 *   - value: JSON { urgency, likelihood, revenue, total, reasoning, scoredAt }
 * 30일 후 정리는 별도 크론이 담당.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { callAnthropicMessages } from "@/lib/services/anthropic-gateway";

export type PriorityScore = {
  urgency: number;
  likelihood: number;
  revenue: number;
  total: number;
  reasoning: string;
  scoredAt: string;
};

const SCORE_KEY_PREFIX = "priority.score.";

function scoreKey(inquiryId: string): string {
  return `${SCORE_KEY_PREFIX}${inquiryId}`;
}

export async function getStoredScore(inquiryId: string): Promise<PriorityScore | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: scoreKey(inquiryId) } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value);
    if (
      typeof parsed?.urgency === "number" &&
      typeof parsed?.likelihood === "number" &&
      typeof parsed?.revenue === "number" &&
      typeof parsed?.total === "number"
    ) {
      return parsed as PriorityScore;
    }
    return null;
  } catch {
    return null;
  }
}

async function storeScore(inquiryId: string, score: PriorityScore): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: scoreKey(inquiryId) },
    create: { key: scoreKey(inquiryId), value: JSON.stringify(score) },
    update: { value: JSON.stringify(score) },
  });
}

const URGENCY_KEYWORDS = ["급함", "긴급", "오늘", "내일", "당장", "빨리", "즉시", "deadline", "urgent"];
const HIGH_REV_TYPES = new Set(["CORPORATE_REQUEST", "IMMIGRATION_STAY", "FOREIGNER_VISA"]);
const MED_REV_TYPES = new Set(["APOSTILLE_CONSULAR", "GENERAL_ADMIN_CIVIL"]);

type InquiryLike = {
  id: string;
  title: string;
  description: string;
  inquiryType: string;
  urgencyLevel: string;
  declaredUrgency?: string | null;
  dueDate?: Date | null;
  isCorporateRequest?: boolean;
  hasPreparedDocuments?: boolean;
};

function heuristicScore(inquiry: InquiryLike): PriorityScore {
  const text = `${inquiry.title} ${inquiry.description}`.toLowerCase();

  // urgency
  let urgency = 30;
  if (inquiry.urgencyLevel === "CRITICAL") urgency = 95;
  else if (inquiry.urgencyLevel === "HIGH") urgency = 75;
  else if (inquiry.urgencyLevel === "MEDIUM") urgency = 50;
  else if (inquiry.urgencyLevel === "LOW") urgency = 20;
  if (URGENCY_KEYWORDS.some((k) => text.includes(k))) urgency = Math.min(100, urgency + 15);
  if (inquiry.dueDate) {
    const daysToDue = (inquiry.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    if (daysToDue < 3) urgency = Math.min(100, urgency + 25);
    else if (daysToDue < 7) urgency = Math.min(100, urgency + 15);
    else if (daysToDue < 14) urgency = Math.min(100, urgency + 8);
  }

  // likelihood — 신뢰도 heuristic
  let likelihood = 50;
  if (inquiry.hasPreparedDocuments) likelihood += 20;
  if (inquiry.description.length > 200) likelihood += 10;
  if (inquiry.description.length < 40) likelihood -= 20;
  likelihood = Math.max(0, Math.min(100, likelihood));

  // revenue
  let revenue = 40;
  if (inquiry.isCorporateRequest) revenue += 25;
  if (HIGH_REV_TYPES.has(inquiry.inquiryType)) revenue += 25;
  else if (MED_REV_TYPES.has(inquiry.inquiryType)) revenue += 10;
  revenue = Math.max(0, Math.min(100, revenue));

  const total = Math.round(0.4 * urgency + 0.3 * likelihood + 0.3 * revenue);

  return {
    urgency,
    likelihood,
    revenue,
    total,
    reasoning: "휴리스틱 기반 점수 (키워드/문의유형/기한).",
    scoredAt: new Date().toISOString(),
  };
}

async function aiScore(inquiry: InquiryLike): Promise<PriorityScore | null> {
  const prompt = `You are prioritising an inquiry for an administrative agent (행정사) firm.
Given the inquiry, return three integer scores 0-100 and a Korean explanation:
- urgency: how time-sensitive (deadline keywords 급함/오늘/내일, dueDate soon)
- likelihood: likelihood of becoming a paying case (clarity, fit, doc readiness)
- revenue: expected revenue (0-100), high for corporate/immigration; low for simple civil

Respond ONLY with JSON:
{"urgency":0-100,"likelihood":0-100,"revenue":0-100,"reasoning":"한국어 1-2문장"}

Inquiry:
Title: ${inquiry.title}
Type: ${inquiry.inquiryType}
DeclaredUrgency: ${inquiry.urgencyLevel}
DueDate: ${inquiry.dueDate?.toISOString() ?? "none"}
Corporate: ${inquiry.isCorporateRequest ? "yes" : "no"}
DocsReady: ${inquiry.hasPreparedDocuments ? "yes" : "no"}
Description: ${inquiry.description.slice(0, 1500)}`;

  const r = await callAnthropicMessages({
    model: "claude-haiku-4-5-20251001",
    maxTokens: 300,
    prompt,
  });

  const text = r.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]);
  const clamp = (n: unknown) => {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(100, Math.round(v)));
  };
  const urgency = clamp(parsed.urgency);
  const likelihood = clamp(parsed.likelihood);
  const revenue = clamp(parsed.revenue);
  const total = Math.round(0.4 * urgency + 0.3 * likelihood + 0.3 * revenue);

  return {
    urgency,
    likelihood,
    revenue,
    total,
    reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "AI 판단",
    scoredAt: new Date().toISOString(),
  };
}

/**
 * 문의 하나 스코어링 (AI → 실패 시 휴리스틱). 결과를 저장하고 반환.
 */
export async function scoreInquiry(inquiryId: string): Promise<PriorityScore> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      title: true,
      description: true,
      inquiryType: true,
      urgencyLevel: true,
      declaredUrgency: true,
      dueDate: true,
      isCorporateRequest: true,
      hasPreparedDocuments: true,
    },
  });
  if (!inquiry) throw new Error("문의를 찾을 수 없습니다.");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let score: PriorityScore | null = null;
  if (apiKey) {
    try {
      score = await aiScore(inquiry as InquiryLike);
    } catch (err) {
      logger.warn("[priority-scoring] AI 실패 — heuristic fallback", err);
    }
  }
  if (!score) score = heuristicScore(inquiry as InquiryLike);

  await storeScore(inquiryId, score);
  return score;
}

/**
 * 배치 스코어링 — 최근 24시간 이내 생성됐고 아직 점수 없는 문의들.
 */
export async function runPriorityScoringBatch(): Promise<{
  found: number;
  scored: number;
  failed: number;
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const inquiries = await prisma.inquiry.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true },
    take: 200,
  });

  let scored = 0;
  let failed = 0;
  let processed = 0;
  for (const inq of inquiries) {
    const existing = await getStoredScore(inq.id);
    if (existing) continue;
    processed++;
    try {
      await scoreInquiry(inq.id);
      scored++;
    } catch (err) {
      failed++;
      logger.error("[priority-scoring] 실패", { inquiryId: inq.id, err });
    }
  }

  return { found: processed, scored, failed };
}

/**
 * 여러 문의의 저장된 점수 일괄 조회.
 */
export async function getScoresForInquiries(
  inquiryIds: string[]
): Promise<Record<string, PriorityScore>> {
  if (inquiryIds.length === 0) return {};
  const keys = inquiryIds.map(scoreKey);
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  const out: Record<string, PriorityScore> = {};
  for (const row of rows) {
    if (!row.key.startsWith(SCORE_KEY_PREFIX)) continue;
    const id = row.key.slice(SCORE_KEY_PREFIX.length);
    try {
      out[id] = JSON.parse(row.value) as PriorityScore;
    } catch {
      // ignore
    }
  }
  return out;
}

export function scoreTone(total: number): { label: string; className: string } {
  if (total >= 80) return { label: "긴급", className: "bg-red-100 text-red-700 border-red-200" };
  if (total >= 60) return { label: "우선", className: "bg-amber-100 text-amber-700 border-amber-200" };
  if (total >= 40) return { label: "보통", className: "bg-blue-100 text-blue-700 border-blue-200" };
  return { label: "낮음", className: "bg-gray-100 text-gray-600 border-gray-200" };
}
