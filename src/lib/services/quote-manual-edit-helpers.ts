import type { PaymentStageKind } from "@generated/prisma-client/client";

import { buildManualSummary } from "@/lib/quote-engine/engine";
import type { QuoteWithRelations } from "@/lib/services/quote-serialization-helpers";

type QuoteLineItemRecord = QuoteWithRelations["lineItems"][number];
type QuoteAdjustmentRecord = QuoteWithRelations["adjustments"][number];
type QuotePaymentPlanRecord = QuoteWithRelations["paymentPlans"][number];

export type ManualQuoteLineInput = {
  id: string;
  label: string;
  description?: string | null;
  amountMin: number;
  amountMax: number;
  sortOrder: number;
};

export type ManualQuoteAdjustmentInput = {
  id: string;
  label: string;
  description?: string | null;
  computedMin: number;
  computedMax: number;
  sortOrder: number;
};

export type ManualQuotePaymentPlanInput = {
  id: string;
  percentage: number;
  dueText: string;
  sortOrder: number;
  stageKind: PaymentStageKind;
};

export type SaveQuoteManualEditsInput = {
  draftNotes?: string | null;
  specialTerms?: string | null;
  lineItems: ManualQuoteLineInput[];
  adjustments: ManualQuoteAdjustmentInput[];
  paymentPlans: ManualQuotePaymentPlanInput[];
};

type ManualQuoteTotalsInput = {
  lineItems: QuoteLineItemRecord[];
  adjustments: QuoteAdjustmentRecord[];
  consultFee: number;
  successFeeRestricted: boolean;
};

export type ManualQuoteTotals = {
  serviceBaseMin: number;
  serviceBaseMax: number;
  subtotalMin: number;
  subtotalMax: number;
  vatAmountMin: number;
  vatAmountMax: number;
  totalMin: number;
  totalMax: number;
  calculationSummary: string;
};

export function sortQuoteManualEditCollections(quote: QuoteWithRelations) {
  return {
    lineItems: [...quote.lineItems].sort(
      (left: QuoteLineItemRecord, right: QuoteLineItemRecord) => left.sortOrder - right.sortOrder
    ),
    adjustments: [...quote.adjustments].sort(
      (left: QuoteAdjustmentRecord, right: QuoteAdjustmentRecord) => left.sortOrder - right.sortOrder
    )
  };
}

export function computeManualQuoteTotals(input: ManualQuoteTotalsInput): ManualQuoteTotals {
  const serviceBaseMin = input.lineItems
    .filter((line: QuoteLineItemRecord) => line.kind === "SERVICE")
    .reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMin, 0);
  const serviceBaseMax = input.lineItems
    .filter((line: QuoteLineItemRecord) => line.kind === "SERVICE")
    .reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMax, 0);
  const subtotalMin =
    input.lineItems.reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMin, 0) +
    input.adjustments
      .filter((adjustment: QuoteAdjustmentRecord) => !adjustment.isVat)
      .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMin, 0);
  const subtotalMax =
    input.lineItems.reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMax, 0) +
    input.adjustments
      .filter((adjustment: QuoteAdjustmentRecord) => !adjustment.isVat)
      .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMax, 0);
  const vatAmountMin = input.adjustments
    .filter((adjustment: QuoteAdjustmentRecord) => adjustment.isVat)
    .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMin, 0);
  const vatAmountMax = input.adjustments
    .filter((adjustment: QuoteAdjustmentRecord) => adjustment.isVat)
    .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMax, 0);
  const totalMin = subtotalMin + vatAmountMin;
  const totalMax = subtotalMax + vatAmountMax;

  return {
    serviceBaseMin,
    serviceBaseMax,
    subtotalMin,
    subtotalMax,
    vatAmountMin,
    vatAmountMax,
    totalMin,
    totalMax,
    calculationSummary: buildManualSummary({
      lineItems: input.lineItems.map((line: QuoteLineItemRecord) => ({
        label: line.label,
        amountMin: line.amountMin,
        amountMax: line.amountMax
      })),
      adjustments: input.adjustments.map((adjustment: QuoteAdjustmentRecord) => ({
        label: adjustment.label,
        computedMin: adjustment.computedMin,
        computedMax: adjustment.computedMax,
        isVat: adjustment.isVat
      })),
      consultFee: input.consultFee,
      successFeeRestricted: input.successFeeRestricted
    })
  };
}

export function buildManualPaymentPlanAmounts(input: {
  paymentPlans: QuotePaymentPlanRecord[];
  incomingPaymentPlans: ManualQuotePaymentPlanInput[];
  totalMin: number;
  totalMax: number;
}) {
  return input.paymentPlans.map((plan: QuotePaymentPlanRecord) => {
    const incoming = input.incomingPaymentPlans.find((entry) => entry.id === plan.id);
    const percentage = incoming?.percentage ?? plan.percentage;

    return {
      id: plan.id,
      percentage,
      amountMin: Math.round(input.totalMin * (percentage / 100)),
      amountMax: Math.round(input.totalMax * (percentage / 100))
    };
  });
}
