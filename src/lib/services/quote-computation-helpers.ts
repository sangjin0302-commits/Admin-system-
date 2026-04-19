import type {
  QuoteStatus
} from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import type {
  QuoteComputationResult,
} from "@/lib/quote-engine/types";
import {
  quoteWithRelationsInclude,
  type QuoteWithRelations
} from "@/lib/services/quote-serialization-helpers";
import {
  buildAdjustmentCreateData,
  buildLineItemCreateData,
  buildPaymentPlanCreateData
} from "@/lib/services/quote-computation-persistence-helpers";
export {
  loadQuoteMasters,
  toQuoteComputationInput,
  type QuoteComputationInputOverrides,
  type QuoteMasters
} from "@/lib/services/quote-computation-master-helpers";

export async function persistQuoteComputation(
  inquiryId: string,
  computation: QuoteComputationResult,
  input: {
    quoteId?: string;
    status?: QuoteStatus;
    draftNotes?: string | null;
  } = {}
): Promise<QuoteWithRelations> {
  const payload = {
    status: input.status ?? "DRAFT",
    selectedServiceLegacyIds: JSON.stringify(computation.selectedServiceLegacyIds),
    selectedOptionLegacyIds: JSON.stringify(computation.selectedOptionLegacyIds),
    urgencyRuleCode: computation.urgencyRuleCode,
    consultRuleCode: computation.consultRuleCode,
    paymentRuleCode: computation.paymentRuleCode,
    rangeMode: computation.rangeMode,
    serviceBaseMin: computation.serviceBaseMin,
    serviceBaseMax: computation.serviceBaseMax,
    subtotalMin: computation.subtotalMin,
    subtotalMax: computation.subtotalMax,
    vatAmountMin: computation.vatAmountMin,
    vatAmountMax: computation.vatAmountMax,
    totalMin: computation.totalMin,
    totalMax: computation.totalMax,
    consultFee: computation.consultFee,
    successFeeRestricted: computation.successFeeRestricted,
    draftNotes: input.draftNotes ?? null,
    calculationSummary: computation.calculationSummary
  };

  if (input.quoteId) {
    await prisma.$transaction([
      prisma.quoteLineItem.deleteMany({ where: { quoteId: input.quoteId } }),
      prisma.quoteAdjustment.deleteMany({ where: { quoteId: input.quoteId } }),
      prisma.paymentPlan.deleteMany({ where: { quoteId: input.quoteId } }),
      prisma.quote.update({
        where: { id: input.quoteId },
        data: {
          ...payload,
          lineItems: { create: buildLineItemCreateData(computation) },
          adjustments: { create: buildAdjustmentCreateData(computation) },
          paymentPlans: { create: buildPaymentPlanCreateData(computation) }
        }
      })
    ]);

    return prisma.quote.findUniqueOrThrow({
      where: { id: input.quoteId },
      include: quoteWithRelationsInclude
    });
  }

  return prisma.quote.create({
    data: {
      inquiryId,
      ...payload,
      lineItems: { create: buildLineItemCreateData(computation) },
      adjustments: { create: buildAdjustmentCreateData(computation) },
      paymentPlans: { create: buildPaymentPlanCreateData(computation) }
    },
    include: quoteWithRelationsInclude
  });
}
