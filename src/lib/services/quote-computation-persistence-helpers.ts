import type { QuoteComputationResult } from "@/lib/quote-engine/types";

type QuoteComputedLineItem = QuoteComputationResult["lineItems"][number];
type QuoteComputedAdjustment = QuoteComputationResult["adjustments"][number];
type QuoteComputedPaymentPlan = QuoteComputationResult["paymentPlans"][number];

export function buildLineItemCreateData(computation: QuoteComputationResult) {
  return computation.lineItems.map((line: QuoteComputedLineItem) => ({
    serviceTypeId: line.serviceTypeId,
    kind: line.kind,
    label: line.label,
    description: line.description,
    amountMin: line.amountMin,
    amountMax: line.amountMax,
    sortOrder: line.sortOrder,
    isManual: line.isManual ?? false
  }));
}

export function buildAdjustmentCreateData(computation: QuoteComputationResult) {
  return computation.adjustments.map((adjustment: QuoteComputedAdjustment) => ({
    pricingOptionId: adjustment.pricingOptionId,
    label: adjustment.label,
    description: adjustment.description,
    optionType: adjustment.optionType,
    flatAmount: adjustment.flatAmount,
    percentRate: adjustment.percentRate,
    computedMin: adjustment.computedMin,
    computedMax: adjustment.computedMax,
    isVat: adjustment.isVat,
    sortOrder: adjustment.sortOrder,
    isManual: adjustment.isManual ?? false
  }));
}

export function buildPaymentPlanCreateData(computation: QuoteComputationResult) {
  return computation.paymentPlans.map((plan: QuoteComputedPaymentPlan) => ({
    stageKind: plan.stageKind,
    percentage: plan.percentage,
    dueText: plan.dueText,
    amountMin: plan.amountMin,
    amountMax: plan.amountMax,
    sortOrder: plan.sortOrder
  }));
}
