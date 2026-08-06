/**
 * 자율 마케팅 서비스 — UTM 대시보드 및 ad-optimizer 데이터 기반으로
 * 예산·카피 조정 결정을 생성. 실제 광고 API 자동 적용은 OAuth 필요 (TODO).
 *
 * 저장: SiteSetting key = "auto_marketing.decisions" (JSON)
 */

import { prisma } from "@/lib/prisma/client";
import { generateReport as generateAdReport, type AdRecommendation } from "@/lib/services/ad-optimizer-service";
import { logger } from "@/lib/utils/logger";
import { isAiAllowed } from "@/lib/services/ai-budget-guard";
import { callAnthropicMessages } from "@/lib/services/anthropic-gateway";

const DECISIONS_KEY = "auto_marketing.decisions";
const AUTO_APPLY_KEY = "auto_marketing.auto_apply";
const TRUST_KEY = "auto_marketing.trust_threshold";
const MAX_DECISIONS = 200;

export type DecisionType = "spend_increase" | "spend_decrease" | "pause" | "copy_variant" | "resume";

export type MarketingDecision = {
  id: string;
  at: string;
  type: DecisionType;
  campaign: string;
  rationale: string;
  suggestedValue?: string | number;
  confidence: number; // 0-1
  status: "pending" | "applied" | "rejected" | "auto_applied";
  reviewedAt?: string;
  reviewedBy?: string;
};

export type AutoApplyConfig = Record<DecisionType, boolean>;

function genId(): string {
  return `mkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function loadDecisions(): Promise<MarketingDecision[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: DECISIONS_KEY } }).catch(() => null);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value) as MarketingDecision[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveDecisions(list: MarketingDecision[]): Promise<void> {
  const trimmed = list.slice(-MAX_DECISIONS);
  await prisma.siteSetting
    .upsert({
      where: { key: DECISIONS_KEY },
      create: { key: DECISIONS_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    })
    .catch(() => null);
}

export async function getAutoApplyConfig(): Promise<AutoApplyConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: AUTO_APPLY_KEY } }).catch(() => null);
  const defaults: AutoApplyConfig = {
    spend_increase: false,
    spend_decrease: false,
    pause: false,
    copy_variant: false,
    resume: false,
  };
  if (!row) return defaults;
  try {
    const parsed = JSON.parse(row.value) as Partial<AutoApplyConfig>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export async function setAutoApplyConfig(cfg: Partial<AutoApplyConfig>): Promise<AutoApplyConfig> {
  const current = await getAutoApplyConfig();
  const next = { ...current, ...cfg };
  await prisma.siteSetting
    .upsert({
      where: { key: AUTO_APPLY_KEY },
      create: { key: AUTO_APPLY_KEY, value: JSON.stringify(next) },
      update: { value: JSON.stringify(next) },
    })
    .catch(() => null);
  return next;
}

export async function getTrustThreshold(): Promise<number> {
  const row = await prisma.siteSetting.findUnique({ where: { key: TRUST_KEY } }).catch(() => null);
  const v = row ? Number.parseFloat(row.value) : NaN;
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.75;
}

export async function setTrustThreshold(v: number): Promise<void> {
  const clamped = Math.min(1, Math.max(0, v));
  await prisma.siteSetting
    .upsert({
      where: { key: TRUST_KEY },
      create: { key: TRUST_KEY, value: String(clamped) },
      update: { value: String(clamped) },
    })
    .catch(() => null);
}

/** Claude로 새 광고 카피 변형 생성. */
async function generateCopyVariant(campaign: string, currentCopy?: string): Promise<string> {
  const aiGate = await isAiAllowed();
  if (!aiGate.ok) {
    logger.warn("[auto-marketing] AI budget guard blocked copy variant, skipping", { reason: aiGate.reason, campaign });
    return `[변형 생성 건너뜀 - AI 비활성화] ${campaign}`;
  }
  try {
    const r = await callAnthropicMessages({
      model: "claude-haiku-4-5",
      maxTokens: 200,
      prompt: `행정사 사무소 광고 A/B 테스트용 새 카피 1개 (한국어, 40자 이내). 캠페인: ${campaign}${currentCopy ? `\n현재: ${currentCopy}` : ""}\n카피만 반환:`,
    });
    return r.text.trim() || `변형 초안 ${campaign}`;
  } catch (e) {
    return `카피 생성 예외: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/** ad-optimizer 리포트로부터 결정 후보 생성. */
async function buildDecisions(): Promise<MarketingDecision[]> {
  const report = await generateAdReport(30).catch(() => null);
  if (!report) return [];
  const decisions: MarketingDecision[] = [];
  const now = new Date().toISOString();

  const confMap: Record<AdRecommendation["confidence"], number> = { high: 0.85, medium: 0.7, low: 0.5 };
  for (const rec of report.recommendations as AdRecommendation[]) {
    const type: DecisionType =
      rec.action === "increase"
        ? "spend_increase"
        : rec.action === "decrease"
        ? "spend_decrease"
        : rec.action === "test"
        ? "copy_variant"
        : "resume";
    decisions.push({
      id: genId(),
      at: now,
      type,
      campaign: rec.campaign,
      rationale: rec.message,
      confidence: confMap[rec.confidence],
      status: "pending",
    });
  }

  // 상위 캠페인에 대해 카피 변형 초안
  const topCampaigns = report.rows.slice(0, 3);
  for (const row of topCampaigns) {
    const variant = await generateCopyVariant(row.campaign);
    decisions.push({
      id: genId(),
      at: now,
      type: "copy_variant",
      campaign: row.campaign,
      rationale: "상위 성과 캠페인 A/B 변형 초안",
      suggestedValue: variant,
      confidence: 0.6,
      status: "pending",
    });
  }
  return decisions;
}

/** 결정 생성 + 자동 적용 규칙 반영 + 저장. */
export async function runDecisionCycle(): Promise<{
  generated: number;
  autoApplied: number;
  pending: number;
}> {
  const [candidates, autoCfg, trust] = await Promise.all([
    buildDecisions(),
    getAutoApplyConfig(),
    getTrustThreshold(),
  ]);
  let autoApplied = 0;
  for (const d of candidates) {
    if (autoCfg[d.type] && d.confidence >= trust) {
      d.status = "auto_applied";
      d.reviewedAt = new Date().toISOString();
      autoApplied++;
    }
  }
  const existing = await loadDecisions();
  const merged = [...existing, ...candidates];
  await saveDecisions(merged);
  logger.debug("[auto-marketing] cycle", { generated: candidates.length, autoApplied });
  return {
    generated: candidates.length,
    autoApplied,
    pending: candidates.filter((d) => d.status === "pending").length,
  };
}

export async function getDecisions(limit = 100): Promise<MarketingDecision[]> {
  const list = await loadDecisions();
  return list.slice(-limit).reverse();
}

export async function decideMarketing(
  id: string,
  decision: "apply" | "reject",
  reviewedBy?: string
): Promise<boolean> {
  const list = await loadDecisions();
  const idx = list.findIndex((d) => d.id === id);
  if (idx < 0) return false;
  list[idx] = {
    ...list[idx],
    status: decision === "apply" ? "applied" : "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  };
  await saveDecisions(list);
  return true;
}
