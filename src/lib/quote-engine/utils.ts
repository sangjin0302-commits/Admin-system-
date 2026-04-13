import type { PaymentStageKind } from "@generated/prisma-v4";

import type { PricingRuleMaster, StageTemplate } from "@/lib/quote-engine/types";

export function roundAmount(value: number) {
  return Math.round(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function parseRuleJson<T>(rule: PricingRuleMaster): T | null {
  if (!rule.jsonValue) return null;

  try {
    return JSON.parse(rule.jsonValue) as T;
  } catch {
    return null;
  }
}

export function normalizeStagePercentages(
  stages: StageTemplate[],
  successFeeRestricted: boolean
) {
  const retainer = stages.find((stage) => stage.stageKind === "RETAINER");
  const midterm = stages.find((stage) => stage.stageKind === "MIDTERM");
  const success = stages.find((stage) => stage.stageKind === "SUCCESS");

  if (!retainer || !midterm || !success) {
    return stages;
  }

  if (successFeeRestricted) {
    success.percentage = 0;
    midterm.percentage = Math.max(0, 100 - retainer.percentage);
    return stages;
  }

  const total = stages.reduce((sum, stage) => sum + stage.percentage, 0);

  if (total === 100) {
    return stages;
  }

  const difference = 100 - total;
  midterm.percentage = Math.max(0, midterm.percentage + difference);
  return stages;
}

export function toStageKindLabel(stageKind: PaymentStageKind) {
  return {
    RETAINER: "착수금",
    MIDTERM: "중도금",
    SUCCESS: "성공보수"
  }[stageKind];
}
