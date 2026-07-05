/**
 * AI 모델 자동 선택 (비용 최적화).
 *
 * pickModel(taskType, complexity) — 태스크 종류·복잡도에 따라 Haiku/Sonnet/Opus 선택.
 * 라우팅 규칙은 SiteSetting `ai.router.rules` 로 오버라이드 가능.
 * 결정 로그: SiteSetting `ai.router.decisions` (최근 500건).
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const RULES_KEY = "ai.router.rules";
const DECISIONS_KEY = "ai.router.decisions";
const MAX_DECISIONS = 500;

export type TaskType =
  | "simple_classify"
  | "drafting"
  | "complex_reasoning"
  | "summarize"
  | "extract"
  | "other";

export const HAIKU = "claude-haiku-4-5-20251001";
export const SONNET = "claude-sonnet-4-5";
export const OPUS = "claude-opus-4-7";

export type ComplexitySignals = {
  inputLength?: number;
  keywords?: string[]; // detected keywords from prompt
  isRetry?: boolean;
  previousModel?: string;
  forceLevel?: "cheap" | "balanced" | "smart";
};

export type RoutingRule = {
  taskType: TaskType;
  defaultModel: string;
  escalateOnLongInput?: number; // chars threshold → next tier
};

export const DEFAULT_RULES: RoutingRule[] = [
  { taskType: "simple_classify", defaultModel: HAIKU },
  { taskType: "extract", defaultModel: HAIKU, escalateOnLongInput: 4000 },
  { taskType: "summarize", defaultModel: HAIKU, escalateOnLongInput: 6000 },
  { taskType: "drafting", defaultModel: SONNET, escalateOnLongInput: 12000 },
  { taskType: "complex_reasoning", defaultModel: OPUS },
  { taskType: "other", defaultModel: HAIKU },
];

// escalation tiers (cheapest → smartest)
const TIER = [HAIKU, SONNET, OPUS];

function escalate(model: string): string {
  const i = TIER.indexOf(model);
  if (i < 0 || i >= TIER.length - 1) return model;
  return TIER[i + 1];
}

function deescalate(model: string): string {
  const i = TIER.indexOf(model);
  if (i <= 0) return model;
  return TIER[i - 1];
}

async function readRules(): Promise<RoutingRule[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: RULES_KEY } });
    if (!row?.value) return DEFAULT_RULES;
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as RoutingRule[]) : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

export async function getRules(): Promise<RoutingRule[]> {
  return readRules();
}

export async function saveRules(rules: RoutingRule[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: RULES_KEY },
    create: { key: RULES_KEY, value: JSON.stringify(rules) },
    update: { value: JSON.stringify(rules) },
  });
}

const COMPLEX_KEYWORDS = [
  "논거",
  "판례",
  "행정심판",
  "reasoning",
  "analyze deeply",
  "compare",
  "strategy",
  "전략",
];

const CHEAP_KEYWORDS = ["분류", "classify", "label", "태그", "category"];

export type PickResult = {
  model: string;
  reasoning: string;
  taskType: TaskType;
};

export async function pickModel(
  taskType: TaskType,
  complexity: ComplexitySignals = {}
): Promise<PickResult> {
  const rules = await readRules();
  const rule = rules.find((r) => r.taskType === taskType) ?? DEFAULT_RULES[DEFAULT_RULES.length - 1];
  let model = rule.defaultModel;
  const reasons: string[] = [`rule:${taskType}→${model}`];

  const kw = (complexity.keywords ?? []).map((k) => k.toLowerCase());
  const hasComplex = kw.some((k) => COMPLEX_KEYWORDS.some((c) => k.includes(c.toLowerCase())));
  const hasCheap = kw.some((k) => CHEAP_KEYWORDS.some((c) => k.includes(c.toLowerCase())));

  if (
    rule.escalateOnLongInput &&
    (complexity.inputLength ?? 0) >= rule.escalateOnLongInput
  ) {
    const next = escalate(model);
    if (next !== model) {
      reasons.push(`long input (${complexity.inputLength}≥${rule.escalateOnLongInput}) → escalate ${next}`);
      model = next;
    }
  }

  if (hasComplex) {
    const next = escalate(model);
    if (next !== model) {
      reasons.push(`complex keywords → ${next}`);
      model = next;
    }
  }
  if (hasCheap) {
    const next = deescalate(model);
    if (next !== model) {
      reasons.push(`cheap keywords → ${next}`);
      model = next;
    }
  }

  if (complexity.isRetry && complexity.previousModel) {
    // Retry after failure — try a smaller / different model as fallback
    const next = deescalate(complexity.previousModel);
    if (next !== complexity.previousModel) {
      reasons.push(`retry after failure of ${complexity.previousModel} → ${next}`);
      model = next;
    }
  }

  if (complexity.forceLevel === "cheap") {
    reasons.push("forceLevel=cheap → Haiku");
    model = HAIKU;
  } else if (complexity.forceLevel === "smart") {
    reasons.push("forceLevel=smart → Opus");
    model = OPUS;
  }

  return { model, reasoning: reasons.join(" | "), taskType };
}

export type RoutingDecision = {
  id: string;
  timestamp: string;
  taskType: TaskType;
  model: string;
  reasoning: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  success?: boolean;
};

async function readDecisions(): Promise<RoutingDecision[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: DECISIONS_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as RoutingDecision[]) : [];
  } catch {
    return [];
  }
}

async function writeDecisions(items: RoutingDecision[]): Promise<void> {
  const trimmed = items.slice(-MAX_DECISIONS);
  await prisma.siteSetting.upsert({
    where: { key: DECISIONS_KEY },
    create: { key: DECISIONS_KEY, value: JSON.stringify(trimmed) },
    update: { value: JSON.stringify(trimmed) },
  });
}

export async function recordDecision(
  d: Omit<RoutingDecision, "id" | "timestamp">
): Promise<void> {
  try {
    const items = await readDecisions();
    items.push({
      ...d,
      id: `rd_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
    });
    await writeDecisions(items);
  } catch (err) {
    logger.warn("[model-router] record decision failed", err);
  }
}

export async function listDecisions(limit = 100): Promise<RoutingDecision[]> {
  const items = await readDecisions();
  return items.slice(-limit).reverse();
}

/** "always Opus" 대비 절감 추정. */
export async function estimateSavings(): Promise<{
  actualCostUsd: number;
  opusOnlyCostUsd: number;
  savingsUsd: number;
  savingsPct: number;
}> {
  const items = await readDecisions();
  let actual = 0;
  let opus = 0;
  const opusIn = 15 / 1_000_000;
  const opusOut = 75 / 1_000_000;
  for (const d of items) {
    actual += d.costUsd ?? 0;
    opus += (d.inputTokens ?? 0) * opusIn + (d.outputTokens ?? 0) * opusOut;
  }
  return {
    actualCostUsd: actual,
    opusOnlyCostUsd: opus,
    savingsUsd: opus - actual,
    savingsPct: opus > 0 ? ((opus - actual) / opus) * 100 : 0,
  };
}
