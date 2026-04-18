import { prisma } from "@/lib/prisma/client";
import {
  buildManualPaymentPlanAmounts,
  computeManualQuoteTotals,
  sortQuoteManualEditCollections,
  type ManualQuoteAdjustmentInput,
  type ManualQuoteLineInput,
  type ManualQuotePaymentPlanInput,
  type SaveQuoteManualEditsInput
} from "@/lib/services/quote-manual-edit-helpers";
import {
  quoteWithRelationsInclude,
  type QuoteWithRelations
} from "@/lib/services/quote-serialization-helpers";

async function getQuoteByIdOrThrow(quoteId: string): Promise<QuoteWithRelations> {
  return prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: quoteWithRelationsInclude
  });
}

export async function saveQuoteManualEditsPersistence(
  quoteId: string,
  input: SaveQuoteManualEditsInput
) {
  await getQuoteByIdOrThrow(quoteId);

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

  const refreshed = await getQuoteByIdOrThrow(quoteId);
  const { lineItems, adjustments } = sortQuoteManualEditCollections(refreshed);
  const totals = computeManualQuoteTotals({
    lineItems,
    adjustments,
    consultFee: refreshed.consultFee,
    successFeeRestricted: refreshed.successFeeRestricted
  });
  const paymentPlanAmounts = buildManualPaymentPlanAmounts({
    paymentPlans: refreshed.paymentPlans,
    incomingPaymentPlans: input.paymentPlans,
    totalMin: totals.totalMin,
    totalMax: totals.totalMax
  });

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
    ...paymentPlanAmounts.map((plan) => {
      return prisma.paymentPlan.update({
        where: { id: plan.id },
        data: {
          percentage: plan.percentage,
          amountMin: plan.amountMin,
          amountMax: plan.amountMax
        }
      });
    })
  ]);

  if (input.specialTerms !== undefined && refreshed.contractDraft) {
    await prisma.contractDraft.update({
      where: { id: refreshed.contractDraft.id },
      data: {
        specialTerms: input.specialTerms?.trim() ? input.specialTerms.trim() : null
      }
    });
  }

  return getQuoteByIdOrThrow(quoteId);
}
