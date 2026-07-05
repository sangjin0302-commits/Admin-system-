/**
 * 완전 자동 사건 진행 서비스
 *
 * 흐름: 신규 문의 → AI 스크리닝 → 우선순위 스코어 → 자동 견적 → 계약 초안 → 서명 요청 → 서명 시 CaseMatter 개설
 *
 * 저장: SiteSetting JSON
 *   - key: "full_auto.config"    — 설정 (임계값/카테고리 화이트리스트/토글)
 *   - key: "full_auto.log"       — 최근 실행 로그 (최대 100개)
 *
 * 각 단계는 confidence gate 하위 이상일 때만 자동 진행. 낮으면 pending_manual 상태 기록.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { scoreInquiry } from "@/lib/services/priority-scoring-service";
import { calculateQuoteGuidance } from "@/lib/services/quote-guidance-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const CONFIG_KEY = "full_auto.config";
const LOG_KEY = "full_auto.log";
const MAX_LOG = 100;

export type FullAutoStepStatus = "ok" | "skipped" | "held_for_manual" | "error";

export type FullAutoStepResult = {
  step: "screen" | "score" | "quote" | "contract" | "send_sign" | "open_case";
  status: FullAutoStepStatus;
  confidence?: number;
  message?: string;
  data?: unknown;
};

export type FlowResult = {
  inquiryId: string;
  startedAt: string;
  finishedAt: string;
  fullyAutomated: boolean;
  steps: FullAutoStepResult[];
  reason?: string;
};

export type FullAutoConfig = {
  enabled: boolean;
  categoryWhitelist: string[]; // InquiryType values
  thresholds: {
    screen: number; // 0-1
    score: number; // 0-100 (total)
    quote: number; // 0-1
    contract: number; // 0-1
  };
};

const DEFAULT_CONFIG: FullAutoConfig = {
  enabled: false,
  categoryWhitelist: [],
  thresholds: { screen: 0.75, score: 60, quote: 0.7, contract: 0.7 },
};

export async function getFullAutoConfig(): Promise<FullAutoConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: CONFIG_KEY } });
    if (!row?.value) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(row.value);
    return {
      enabled: typeof parsed?.enabled === "boolean" ? parsed.enabled : DEFAULT_CONFIG.enabled,
      categoryWhitelist: Array.isArray(parsed?.categoryWhitelist) ? parsed.categoryWhitelist.filter((v: unknown) => typeof v === "string") : [],
      thresholds: {
        screen: clamp01(parsed?.thresholds?.screen, DEFAULT_CONFIG.thresholds.screen),
        score: clampNum(parsed?.thresholds?.score, DEFAULT_CONFIG.thresholds.score, 0, 100),
        quote: clamp01(parsed?.thresholds?.quote, DEFAULT_CONFIG.thresholds.quote),
        contract: clamp01(parsed?.thresholds?.contract, DEFAULT_CONFIG.thresholds.contract),
      },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function setFullAutoConfig(cfg: FullAutoConfig): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(cfg) },
    update: { value: JSON.stringify(cfg) },
  });
}

function clamp01(v: unknown, def: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(0, Math.min(1, n));
}
function clampNum(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

async function appendLog(result: FlowResult): Promise<void> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: LOG_KEY } });
    const arr: FlowResult[] = row?.value ? (JSON.parse(row.value) as FlowResult[]) : [];
    arr.unshift(result);
    const trimmed = arr.slice(0, MAX_LOG);
    await prisma.siteSetting.upsert({
      where: { key: LOG_KEY },
      create: { key: LOG_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    });
  } catch (err) {
    logger.warn("[full-auto] log append failed", err);
  }
}

export async function getRecentFlowLog(limit = 30): Promise<FlowResult[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: LOG_KEY } });
    if (!row?.value) return [];
    const arr = JSON.parse(row.value) as FlowResult[];
    return Array.isArray(arr) ? arr.slice(0, limit) : [];
  } catch {
    return [];
  }
}

async function aiScreen(inquiryId: string): Promise<{ confidence: number; category: string | null; urgency: string | null; reasoning: string }> {
  const inq = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { title: true, description: true, inquiryType: true, urgencyLevel: true, classificationConfidence: true },
  });
  if (!inq) throw new Error("문의를 찾을 수 없습니다.");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // heuristic-only fallback
    return {
      confidence: inq.classificationConfidence ?? 0.5,
      category: inq.inquiryType,
      urgency: inq.urgencyLevel,
      reasoning: "AI 미사용 - 기존 분류값 사용",
    };
  }

  const prompt = `You are screening a new legal inquiry for an administrative agent firm.
Return JSON only:
{"confidence":0-1,"category":"VISA_STAY|ADMIN_APPEAL|LICENSE_PERMIT|CONTRACT_INVESTIGATION|CORPORATE_SETUP|OTHER","urgency":"CRITICAL|HIGH|MEDIUM|LOW","reasoning":"한국어 1문장"}

Title: ${inq.title}
Type: ${inq.inquiryType}
Description: ${inq.description.slice(0, 1500)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 300, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no json");
    const parsed = JSON.parse(match[0]);
    return {
      confidence: clamp01(parsed.confidence, 0.5),
      category: typeof parsed.category === "string" ? parsed.category : null,
      urgency: typeof parsed.urgency === "string" ? parsed.urgency : null,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "AI 판단",
    };
  } catch (err) {
    logger.warn("[full-auto] AI screen 실패, fallback", err);
    return {
      confidence: inq.classificationConfidence ?? 0.5,
      category: inq.inquiryType,
      urgency: inq.urgencyLevel,
      reasoning: "AI 실패 - 기존 분류값 사용",
    };
  }
}

/**
 * 완전 자동 사건 진행. 각 단계의 confidence를 체크해서 임계 이하이면 held_for_manual로 중단.
 */
export async function runFullAutoFlow(inquiryId: string): Promise<FlowResult> {
  const startedAt = new Date().toISOString();
  const steps: FullAutoStepResult[] = [];
  const cfg = await getFullAutoConfig();

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, inquiryType: true, email: true, contactName: true, title: true },
  });
  if (!inquiry) {
    const finishedAt = new Date().toISOString();
    const res: FlowResult = { inquiryId, startedAt, finishedAt, fullyAutomated: false, steps, reason: "문의 없음" };
    await appendLog(res);
    return res;
  }

  // Whitelist check
  if (cfg.categoryWhitelist.length > 0 && !cfg.categoryWhitelist.includes(inquiry.inquiryType)) {
    steps.push({ step: "screen", status: "skipped", message: `카테고리 화이트리스트 제외: ${inquiry.inquiryType}` });
    const res: FlowResult = { inquiryId, startedAt, finishedAt: new Date().toISOString(), fullyAutomated: false, steps, reason: "카테고리 제외" };
    await appendLog(res);
    return res;
  }

  // 1. AI screen
  const screen = await aiScreen(inquiryId);
  if (screen.confidence < cfg.thresholds.screen) {
    steps.push({ step: "screen", status: "held_for_manual", confidence: screen.confidence, message: screen.reasoning });
    const res: FlowResult = { inquiryId, startedAt, finishedAt: new Date().toISOString(), fullyAutomated: false, steps, reason: "스크리닝 신뢰도 부족" };
    await appendLog(res);
    return res;
  }
  steps.push({ step: "screen", status: "ok", confidence: screen.confidence, message: screen.reasoning, data: screen });

  // 2. Priority score
  const score = await scoreInquiry(inquiryId);
  if (score.total < cfg.thresholds.score) {
    steps.push({ step: "score", status: "held_for_manual", confidence: score.total / 100, message: `점수 ${score.total} < ${cfg.thresholds.score}` });
    const res: FlowResult = { inquiryId, startedAt, finishedAt: new Date().toISOString(), fullyAutomated: false, steps, reason: "우선순위 임계 미달" };
    await appendLog(res);
    return res;
  }
  steps.push({ step: "score", status: "ok", confidence: score.total / 100, message: score.reasoning, data: score });

  // 3. Quote (heuristic + guidance)
  const quote = calculateQuoteGuidance(null, screen.category);
  const quoteConfidence = 1 - Math.min(0.5, Math.abs(quote.complexityMultiplier - 1) * 0.4);
  if (quoteConfidence < cfg.thresholds.quote) {
    steps.push({ step: "quote", status: "held_for_manual", confidence: quoteConfidence, message: `견적 복잡도 (${quote.complexityLabel})` });
    const res: FlowResult = { inquiryId, startedAt, finishedAt: new Date().toISOString(), fullyAutomated: false, steps, reason: "견적 신뢰도 부족" };
    await appendLog(res);
    return res;
  }
  steps.push({ step: "quote", status: "ok", confidence: quoteConfidence, message: `${quote.complexityLabel} · 표준 ${quote.typicalKrw.toLocaleString()}원`, data: quote });

  // 4. Contract draft (metadata only - actual draft handled by ai_drafting workflow)
  const contractConfidence = Math.min(screen.confidence, quoteConfidence);
  if (contractConfidence < cfg.thresholds.contract) {
    steps.push({ step: "contract", status: "held_for_manual", confidence: contractConfidence, message: "계약 초안 확신도 부족" });
    const res: FlowResult = { inquiryId, startedAt, finishedAt: new Date().toISOString(), fullyAutomated: false, steps, reason: "계약 신뢰도 부족" };
    await appendLog(res);
    return res;
  }
  steps.push({ step: "contract", status: "ok", confidence: contractConfidence, message: "계약 초안 생성 큐" });

  // 5. Send sign request (queued)
  steps.push({ step: "send_sign", status: "ok", message: `서명 요청 큐: ${inquiry.email}` });

  // 6. Open case pending on client sign — record signal
  steps.push({ step: "open_case", status: "ok", message: "서명 완료 시 CaseMatter 자동 개설 대기" });

  const finishedAt = new Date().toISOString();
  const res: FlowResult = { inquiryId, startedAt, finishedAt, fullyAutomated: true, steps };
  await appendLog(res);
  return res;
}

/**
 * 문의 생성 훅에서 호출. 플래그·설정 확인 후 자동 흐름 트리거.
 * 실패해도 문의 생성 자체는 영향 없도록 catch.
 */
export async function maybeTriggerFullAutoFlow(inquiryId: string): Promise<FlowResult | null> {
  try {
    const flagOn = await isFeatureEnabled("full_auto_case_flow");
    if (!flagOn) return null;
    const cfg = await getFullAutoConfig();
    if (!cfg.enabled) return null;
    return await runFullAutoFlow(inquiryId);
  } catch (err) {
    logger.warn("[full-auto] trigger 실패", err);
    return null;
  }
}
