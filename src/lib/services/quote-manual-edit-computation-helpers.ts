import { buildManualSummary } from "@/lib/quote-engine/engine";
import type { QuoteWithRelations } from "@/lib/services/quote-serialization-helpers";
import type {
  ManualQuotePaymentPlanInput,
  ManualQuoteTotals,
  ManualQuoteTotalsInput,
  QuoteAdjustmentRecord,
  QuoteLineItemRecord,
  QuotePaymentPlanRecord
} from "@/lib/services/quote-manual-edit-types";

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
  successFeeRestricted: boolean;
}) {
  const mergedPlans = input.paymentPlans.map((plan: QuotePaymentPlanRecord) => {
    const incoming = input.incomingPaymentPlans.find((entry) => entry.id === plan.id);
    return {
      ...plan,
      percentage: incoming?.percentage ?? plan.percentage
    };
  });

  if (input.successFeeRestricted) {
    const successPlan = mergedPlans.find((plan) => plan.stageKind === "SUCCESS");
    const receiverPlan =
      mergedPlans.find((plan) => plan.stageKind === "MIDTERM") ??
      mergedPlans.find((plan) => plan.stageKind !== "SUCCESS");

    if (successPlan && receiverPlan && successPlan.id !== receiverPlan.id && successPlan.percentage > 0) {
      receiverPlan.percentage += successPlan.percentage;
      successPlan.percentage = 0;
    }
  }

  const totalPercentage = mergedPlans.reduce((sum, plan) => sum + plan.percentage, 0);
  if (totalPercentage !== 100) {
    const receiverPlan =
      mergedPlans.find((plan) => plan.stageKind === "MIDTERM") ?? mergedPlans[0] ?? null;

    if (receiverPlan) {
      receiverPlan.percentage = Math.max(0, receiverPlan.percentage + (100 - totalPercentage));
    }
  }

  return mergedPlans.map((plan) => {
    return {
      id: plan.id,
      percentage: plan.percentage,
      amountMin: Math.round(input.totalMin * (plan.percentage / 100)),
      amountMax: Math.round(input.totalMax * (plan.percentage / 100))
    };
  });
}
