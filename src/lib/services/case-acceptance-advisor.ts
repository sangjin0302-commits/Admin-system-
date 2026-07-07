/**
 * 의뢰 수임 여부 AI 조언.
 *
 * 입력: 신규 Inquiry
 * 평가 축: 복잡도(실무 적합성) / 경제성(예상 매출 vs 시간) / 성공 가능성 / 리스크(평판·이해상충·윤리)
 * Claude Sonnet + priority-scoring 통합. 실패 시 휴리스틱 fallback.
 *
 * 저장: SiteSetting key = "acceptance.advice.<inquiryId>"
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { getStoredScore, scoreInquiry, type PriorityScore } from "@/lib/services/priority-scoring-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const KEY_PREFIX = "acceptance.advice.";

export type AcceptanceDecision = "accept" | "decline" | "conditional";

export type AcceptanceAdvice = {
  inquiryId: string;
  recommend: AcceptanceDecision;
  confidence: number; // 0-1
  reasoning: string;
  conditions?: string[];
  alternatives?: string[];
  scores: {
    complexityFit: number; // 0-100 (high = 잘 맞음)
    financial: number; // 0-100
    successChance: number; // 0-100
    risk: number; // 0-100 (higher = more risk)
  };
  source: "ai" | "heuristic";
  adjudicatedAt: string;
};

function adviceKey(inquiryId: string): string {
  return `${KEY_PREFIX}${inquiryId}`;
}

type InquirySnapshot = {
  id: string;
  title: string;
  description: string;
  inquiryType: string;
  urgencyLevel: string;
  isCorporate: boolean;
  hasDocs: boolean;
  dueDate: Date | null;
};

async function loadInquiry(id: string): Promise<InquirySnapshot | null> {
  const row = await prisma.inquiry.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      inquiryType: true,
      urgencyLevel: true,
      isCorporateRequest: true,
      hasPreparedDocuments: true,
      dueDate: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    inquiryType: String(row.inquiryType),
    urgencyLevel: String(row.urgencyLevel),
    isCorporate: row.isCorporateRequest,
    hasDocs: row.hasPreparedDocuments,
    dueDate: row.dueDate,
  };
}

const KNOWN_FITS = new Set([
  "APOSTILLE_CONSULAR",
  "IMMIGRATION_STAY",
  "FOREIGNER_VISA",
  "CORPORATE_REQUEST",
  "GENERAL_ADMIN_CIVIL",
]);
const HIGH_RISK_KEYWORDS = ["형사", "이해상충", "위임인", "허위", "협박", "사기"];

function heuristicAdvise(snap: InquirySnapshot, score: PriorityScore | null): AcceptanceAdvice {
  const complexityFit = KNOWN_FITS.has(snap.inquiryType) ? 80 : 45;
  const financial = score?.revenue ?? (snap.isCorporate ? 70 : 45);
  const successChance = score?.likelihood ?? (snap.hasDocs ? 65 : 45);

  const text = `${snap.title} ${snap.description}`;
  const riskHits = HIGH_RISK_KEYWORDS.filter((k) => text.includes(k));
  const risk = Math.min(100, 20 + riskHits.length * 20 + (snap.urgencyLevel === "CRITICAL" ? 10 : 0));

  const overall = 0.3 * complexityFit + 0.3 * financial + 0.25 * successChance - 0.25 * risk;
  let recommend: AcceptanceDecision;
  const conditions: string[] = [];
  const alternatives: string[] = [];
  if (overall >= 55 && risk < 45) {
    recommend = "accept";
  } else if (overall < 30 || risk >= 70) {
    recommend = "decline";
    alternatives.push("동료 행정사 소개 또는 변호사 연계 제안");
  } else {
    recommend = "conditional";
    if (!snap.hasDocs) conditions.push("필수 서류 사전 준비 확인");
    if (risk >= 45) conditions.push("이해상충·리스크 사전 서면 고지");
    if (financial < 40) conditions.push("수임료 사전 안내 및 착수금 확보");
    if (conditions.length === 0) conditions.push("추가 상담 후 재검토");
  }

  const reasoning =
    `실무 적합성 ${Math.round(complexityFit)} · 경제성 ${Math.round(financial)} · 성공 가능성 ${Math.round(successChance)} · 리스크 ${Math.round(risk)}. ` +
    (riskHits.length ? `주의 키워드: ${riskHits.join(", ")}. ` : "") +
    "휴리스틱 판단.";

  return {
    inquiryId: snap.id,
    recommend,
    confidence: 0.55,
    reasoning,
    conditions: conditions.length ? conditions : undefined,
    alternatives: alternatives.length ? alternatives : undefined,
    scores: { complexityFit, financial, successChance, risk },
    source: "heuristic",
    adjudicatedAt: new Date().toISOString(),
  };
}

async function aiAdvise(
  apiKey: string,
  snap: InquirySnapshot,
  score: PriorityScore | null
): Promise<AcceptanceAdvice | null> {
  const prompt = `You are advising an administrative agent (행정사) firm on whether to accept a new inquiry.

Return ONLY JSON:
{
  "recommend": "accept" | "decline" | "conditional",
  "confidence": 0-1,
  "reasoning": "한국어 1-3문장",
  "conditions": ["..."] (recommend가 conditional일 때),
  "alternatives": ["..."] (recommend가 decline일 때),
  "scores": {
    "complexityFit": 0-100,
    "financial": 0-100,
    "successChance": 0-100,
    "risk": 0-100
  }
}

Inquiry:
Title: ${snap.title}
Type: ${snap.inquiryType}
Urgency: ${snap.urgencyLevel}
Corporate: ${snap.isCorporate ? "yes" : "no"}
DocsReady: ${snap.hasDocs ? "yes" : "no"}
DueDate: ${snap.dueDate?.toISOString() ?? "none"}
PriorityScore: ${score ? JSON.stringify(score) : "null"}
Description: ${snap.description.slice(0, 1500)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]);

  const asDecision = (v: unknown): AcceptanceDecision => {
    if (v === "accept" || v === "decline" || v === "conditional") return v;
    return "conditional";
  };
  const clamp = (n: unknown, hi = 100) => {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(hi, Math.round(v)));
  };
  const asStrArr = (v: unknown): string[] | undefined =>
    Array.isArray(v) && v.length ? v.filter((x): x is string => typeof x === "string").slice(0, 6) : undefined;

  const scores = parsed.scores ?? {};
  return {
    inquiryId: snap.id,
    recommend: asDecision(parsed.recommend),
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.6)),
    reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "AI 판단",
    conditions: asStrArr(parsed.conditions),
    alternatives: asStrArr(parsed.alternatives),
    scores: {
      complexityFit: clamp(scores.complexityFit),
      financial: clamp(scores.financial),
      successChance: clamp(scores.successChance),
      risk: clamp(scores.risk),
    },
    source: "ai",
    adjudicatedAt: new Date().toISOString(),
  };
}

export async function getStoredAcceptanceAdvice(inquiryId: string): Promise<AcceptanceAdvice | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: adviceKey(inquiryId) } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value);
    if (parsed?.recommend) return parsed as AcceptanceAdvice;
    return null;
  } catch {
    return null;
  }
}

async function storeAdvice(a: AcceptanceAdvice): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: adviceKey(a.inquiryId) },
    create: { key: adviceKey(a.inquiryId), value: JSON.stringify(a) },
    update: { value: JSON.stringify(a) },
  });
}

export async function adviseAcceptance(inquiryId: string): Promise<AcceptanceAdvice> {
  const enabled = await isFeatureEnabled("acceptance_advisor");
  if (!enabled) throw new Error("acceptance_advisor 기능이 비활성화되어 있습니다.");

  const snap = await loadInquiry(inquiryId);
  if (!snap) throw new Error("문의를 찾을 수 없습니다.");

  let score: PriorityScore | null = await getStoredScore(inquiryId);
  if (!score) {
    try {
      score = await scoreInquiry(inquiryId);
    } catch (err) {
      logger.warn("[acceptance-advisor] priority score 계산 실패", err);
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let advice: AcceptanceAdvice | null = null;
  if (apiKey) {
    try {
      advice = await aiAdvise(apiKey, snap, score);
    } catch (err) {
      logger.warn("[acceptance-advisor] AI 실패 — heuristic fallback", err);
    }
  }
  if (!advice) advice = heuristicAdvise(snap, score);

  await storeAdvice(advice);
  return advice;
}
