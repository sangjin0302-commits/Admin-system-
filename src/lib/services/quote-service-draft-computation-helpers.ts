import type { PaymentStageKind } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { computeQuoteDraft } from "@/lib/quote-engine/engine";
import {
  loadQuoteMasters,
  persistQuoteComputation,
  toQuoteComputationInput
} from "@/lib/services/quote-computation-helpers";
import {
  serializeInquiryForQuote,
  suggestInitialOptionLegacyIds
} from "@/lib/services/quote-service-core-helpers";
import { serializeQuote } from "@/lib/services/quote-serialization-helpers";
import {
  mapUrgencyLevelToRuleCode,
  selectDefaultRuleCode,
  suggestServiceLegacyIds
} from "@/lib/quote-engine/legacy-mapping";

export async function createQuoteDraftForInquiry(inquiryId: string) {
  const inquiry = await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiryId } });
  const masters = await loadQuoteMasters();
  const inquirySnapshot = serializeInquiryForQuote(inquiry);
  const selectedServiceLegacyIds = suggestServiceLegacyIds(inquirySnapshot, masters.serviceTypes);
  const selectedOptionLegacyIds = suggestInitialOptionLegacyIds(inquirySnapshot, masters.pricingOptions);

  const computation = computeQuoteDraft(
    toQuoteComputationInput(inquirySnapshot, masters, {
      selectedServiceLegacyIds,
      selectedOptionLegacyIds,
      urgencyRuleCode: mapUrgencyLevelToRuleCode(inquiry.urgencyLevel),
      consultRuleCode: selectDefaultRuleCode(masters.pricingRules, "CONSULT", "CONSULT_NONE"),
      paymentRuleCode: selectDefaultRuleCode(masters.pricingRules, "PAYMENT", "PAYMENT_STANDARD"),
      rangeMode: true
    })
  );

  const quote = await persistQuoteComputation(inquiryId, computation);
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: "QUOTE_DRAFTED" }
  });

  return serializeQuote(quote);
}

export async function recalculateQuoteDraft(
  quoteId: string,
  input: {
    selectedServiceLegacyIds: string[];
    selectedOptionLegacyIds: string[];
    urgencyRuleCode: string;
    consultRuleCode: string;
    paymentRuleCode: string;
    rangeMode: boolean;
    stageOverrides: Partial<Record<PaymentStageKind, { percentage?: number; dueText?: string }>>;
    draftNotes?: string | null;
  }
) {
  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: { inquiry: true }
  });
  const masters = await loadQuoteMasters();
  const inquirySnapshot = serializeInquiryForQuote(quote.inquiry);

  const computation = computeQuoteDraft(
    toQuoteComputationInput(inquirySnapshot, masters, {
      ...input,
      draftNotes: input.draftNotes
    })
  );

  const updated = await persistQuoteComputation(quote.inquiryId, computation, {
    quoteId,
    status: quote.status,
    draftNotes: input.draftNotes
  });

  return serializeQuote(updated);
}
