import { prisma } from "@/lib/prisma/client";
import type {
  ManualQuoteAdjustmentInput,
  ManualQuoteLineInput,
  ManualQuotePaymentPlanInput,
  ManualQuoteTotals,
  SaveQuoteManualEditsInput
} from "@/lib/services/quote-manual-edit-helpers";

export type ManualPaymentPlanAmountUpdate = {
  id: string;
  percentage: number;
  amountMin: number;
  amountMax: number;
};

export async function applyManualQuoteBaseEdits(
  quoteId: string,
  input: SaveQuoteManualEditsInput
) {
  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: { draftNotes: input.draftNotes ?? null }
    }),
    ...input.lineItems.map((line: ManualQuoteLineInput) =>
      prisma.quoteLineItem.update({
        where: { id: line.id },
        data: {
          label: line.label,
          description: line.description ?? null,
          amountMin: line.amountMin,
          amountMax: line.amountMax,
          sortOrder: line.sortOrder,
          isManual: true
        }
      })
    ),
    ...input.adjustments.map((adjustment: ManualQuoteAdjustmentInput) =>
      prisma.quoteAdjustment.update({
        where: { id: adjustment.id },
        data: {
          label: adjustment.label,
          description: adjustment.description ?? null,
          computedMin: adjustment.computedMin,
          computedMax: adjustment.computedMax,
          sortOrder: adjustment.sortOrder,
          isManual: true
        }
      })
    ),
    ...input.paymentPlans.map((plan: ManualQuotePaymentPlanInput) =>
      prisma.paymentPlan.update({
        where: { id: plan.id },
        data: {
          percentage: plan.percentage,
          dueText: plan.dueText,
          sortOrder: plan.sortOrder
        }
      })
    )
  ]);
}

export async function applyManualQuoteTotalsAndPlans(
  quoteId: string,
  totals: ManualQuoteTotals,
  paymentPlanAmounts: ManualPaymentPlanAmountUpdate[]
) {
  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        serviceBaseMin: totals.serviceBaseMin,
        serviceBaseMax: totals.serviceBaseMax,
        subtotalMin: totals.subtotalMin,
        subtotalMax: totals.subtotalMax,
        vatAmountMin: totals.vatAmountMin,
        vatAmountMax: totals.vatAmountMax,
        totalMin: totals.totalMin,
        totalMax: totals.totalMax,
        calculationSummary: totals.calculationSummary
      }
    }),
    ...paymentPlanAmounts.map((plan) =>
      prisma.paymentPlan.update({
        where: { id: plan.id },
        data: {
          percentage: plan.percentage,
          amountMin: plan.amountMin,
          amountMax: plan.amountMax
        }
      })
    )
  ]);
}

export async function applyContractDraftSpecialTermsEdit(
  contractDraftId: string,
  specialTerms: string | null | undefined
) {
  await prisma.contractDraft.update({
    where: { id: contractDraftId },
    data: {
      specialTerms: specialTerms?.trim() ? specialTerms.trim() : null
    }
  });
}
