import { buildContractDraftText } from "@/lib/quote-engine/engine";
import { mergeEditableSpecialTerms } from "@/lib/services/quote-lawbot-draft-helpers";
import { serializeInquiryForQuote } from "@/lib/services/quote-service-core-helpers";
import { composeContractAnalysisTerms } from "@/lib/services/quote-status-contract-analysis-helpers";
import type {
  QuoteLineItemRecord,
  QuotePaymentPlanRecord,
  QuoteWorkflowDbClient
} from "@/lib/services/quote-status-workflow-types";
import type { QuoteWithRelations } from "@/lib/services/quote-serialization-helpers";

export async function upsertContractDraftFromQuote(
  db: QuoteWorkflowDbClient,
  quote: QuoteWithRelations
) {
  const warning = quote.successFeeRestricted
    ? ["행정심판/이의신청 계열 업무는 성공보수를 포함하지 않도록 제한합니다."]
    : [];
  const analysisTerms = composeContractAnalysisTerms(quote);
  const mergedSpecialTerms = mergeEditableSpecialTerms(quote.contractDraft?.specialTerms, analysisTerms);

  const draft = buildContractDraftText({
    inquiry: serializeInquiryForQuote(quote.inquiry),
    lineItems: quote.lineItems.sort(
      (left: QuoteLineItemRecord, right: QuoteLineItemRecord) => left.sortOrder - right.sortOrder
    ),
    paymentPlans: quote.paymentPlans.sort(
      (left: QuotePaymentPlanRecord, right: QuotePaymentPlanRecord) => left.sortOrder - right.sortOrder
    ),
    totalMin: quote.totalMin,
    totalMax: quote.totalMax,
    vatAmountMin: quote.vatAmountMin,
    vatAmountMax: quote.vatAmountMax,
    consultFee: quote.consultFee,
    successFeeRestricted: quote.successFeeRestricted,
    warnings: warning,
    draftNotes: quote.draftNotes
  });

  if (quote.contractDraft) {
    return db.contractDraft.update({
      where: { id: quote.contractDraft.id },
      data: {
        title: draft.title,
        bodyText: draft.bodyText,
        scopeText: draft.scopeText,
        paymentSummary: draft.paymentSummary,
        specialTerms: mergedSpecialTerms,
        successFeeRestricted: quote.successFeeRestricted
      }
    });
  }

  return db.contractDraft.create({
    data: {
      inquiryId: quote.inquiryId,
      quoteId: quote.id,
      title: draft.title,
      bodyText: draft.bodyText,
      scopeText: draft.scopeText,
      paymentSummary: draft.paymentSummary,
      specialTerms: mergedSpecialTerms,
      successFeeRestricted: quote.successFeeRestricted
    }
  });
}
