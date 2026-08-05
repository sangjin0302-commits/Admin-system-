/**
 * AI 비용 방어 — 마스터 킬스위치 + 월 예산 브레이커.
 *
 * Anthropic API 는 Vercel 과 별개로 과금되므로, $20 예산을 지키려면 무인 크론·공개
 * AI 진입점이 예산을 넘기지 않도록 방어한다. **진짜 하드캡은 Anthropic 콘솔 월
 * 한도**이고, 이 가드는 그 전에 앱 스스로 멈추는 방어층이다.
 *
 * 두 축:
 *  1) 마스터 킬 — feature flag `ai_master_kill` 이 켜지면 모든 AI 진입점이 거부(즉시 정지 레버).
 *  2) 월 예산 — 누적 추정비용(ai.spend.YYYY-MM)이 예산(기본 $10) 이상이면 거부.
 *
 * 순수 판정 로직(decideAiAllowed)은 DB 없이 테스트로 고정(test:ai-budget).
 */

import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const BUDGET_KEY = "ai.monthlyBudgetUsd"; // free-form SiteSetting (admin이 값만 넣으면 적용)
const DEFAULT_BUDGET_USD = 10; // Anthropic 몫 기본 상한(보수적). Vercel $20 와 별개.

function spendKey(month: string): string {
  return `ai.spend.${month}`;
}

/** UTC 기준 YYYY-MM (월 리셋 경계 결정적). */
export function currentMonth(nowMs: number): string {
  const d = new Date(nowMs);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type AiAllowDecision = { ok: boolean; reason?: string };

/** 순수 판정 — 킬스위치/예산 초과 판단(테스트 대상). */
export function decideAiAllowed(killed: boolean, budgetUsd: number, spentUsd: number): AiAllowDecision {
  if (killed) return { ok: false, reason: "ai_master_kill" };
  if (spentUsd >= budgetUsd) return { ok: false, reason: `monthly_budget_exceeded:${spentUsd}/${budgetUsd}` };
  return { ok: true };
}

async function readNumberSetting(key: string, fallback: number): Promise<number> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  const v = row ? Number(row.value) : NaN;
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

export async function getMonthlyBudgetUsd(): Promise<number> {
  return readNumberSetting(BUDGET_KEY, DEFAULT_BUDGET_USD);
}

export async function getMonthlySpendUsd(nowMs: number): Promise<number> {
  return readNumberSetting(spendKey(currentMonth(nowMs)), 0);
}

/**
 * AI 호출 허용 여부. 무인 크론·공개 AI 진입점에서 Anthropic 호출 **전에** 확인.
 * 실패해도(가드 자체 오류) 기본은 허용하지 않고 거부하는 게 안전하나, 필수 기능
 * 마비를 막기 위해 조회 실패 시엔 허용(fail-open) — 하드캡은 Anthropic 콘솔이 담당.
 */
export async function isAiAllowed(nowMs: number = Date.now()): Promise<AiAllowDecision> {
  try {
    const killed = await isFeatureEnabled("ai_master_kill").catch(() => false);
    const [budget, spent] = await Promise.all([getMonthlyBudgetUsd(), getMonthlySpendUsd(nowMs)]);
    return decideAiAllowed(killed, budget, spent);
  } catch {
    return { ok: true };
  }
}

/** 추정 비용 누적(월별). Anthropic 호출 후 best-effort 로 기록. */
export async function recordAiSpend(usd: number, nowMs: number = Date.now()): Promise<void> {
  if (!(usd > 0)) return;
  const key = spendKey(currentMonth(nowMs));
  try {
    const cur = await getMonthlySpendUsd(nowMs);
    const next = Math.round((cur + usd) * 10000) / 10000;
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: String(next) },
      update: { value: String(next) },
    });
  } catch {
    /* best-effort */
  }
}
