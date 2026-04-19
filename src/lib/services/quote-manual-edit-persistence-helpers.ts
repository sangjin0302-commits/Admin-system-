import {
  buildManualPaymentPlanAmounts,
  computeManualQuoteTotals,
  sortQuoteManualEditCollections,
  type SaveQuoteManualEditsInput
} from "@/lib/services/quote-manual-edit-helpers";
import { getQuoteByIdOrThrow } from "@/lib/services/quote-manual-edit-query-helpers";
import {
  applyContractDraftSpecialTermsEdit,
  applyManualQuoteBaseEdits,
  applyManualQuoteTotalsAndPlans
} from "@/lib/services/quote-manual-edit-transaction-helpers";

export async function saveQuoteManualEditsPersistence(
  quoteId: string,
  input: SaveQuoteManualEditsInput
) {
  await getQuoteByIdOrThrow(quoteId);

  await applyManualQuoteBaseEdits(quoteId, input);

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

  await applyManualQuoteTotalsAndPlans(quoteId, totals, paymentPlanAmounts);

  if (input.specialTerms !== undefined && refreshed.contractDraft) {
    await applyContractDraftSpecialTermsEdit(refreshed.contractDraft.id, input.specialTerms);
  }

  return getQuoteByIdOrThrow(quoteId);
}
