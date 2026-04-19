import {
  buildAcceptedNoticeDraftEn,
  buildAcceptedNoticeDraftKo,
  buildQuoteSendDraftEn,
  buildQuoteSendDraftKo
} from "@/lib/message-templates/quote-flow";
import type { QuoteSummarySnapshot } from "@/lib/quote-engine/types";
import {
  buildPaymentSummaryText,
  parseStringArray,
  toContractDraftSnapshot
} from "@/lib/services/quote-service-core-helpers";
import type { QuoteWithRelations } from "@/lib/services/quote-serialization-types";

type QuoteLineItemRecord = QuoteWithRelations["lineItems"][number];
type QuoteAdjustmentRecord = QuoteWithRelations["adjustments"][number];
type QuotePaymentPlanRecord = QuoteWithRelations["paymentPlans"][number];

export function serializeQuote(quote: QuoteWithRelations): QuoteSummarySnapshot {
  const sortedLineItems = quote.lineItems.sort(
    (left: QuoteLineItemRecord, right: QuoteLineItemRecord) => left.sortOrder - right.sortOrder
  );
  const sortedAdjustments = quote.adjustments.sort(
    (left: QuoteAdjustmentRecord, right: QuoteAdjustmentRecord) => left.sortOrder - right.sortOrder
  );
  const sortedPaymentPlans = quote.paymentPlans.sort(
    (left: QuotePaymentPlanRecord, right: QuotePaymentPlanRecord) => left.sortOrder - right.sortOrder
  );
  const paymentSummary = buildPaymentSummaryText(sortedPaymentPlans);
  const messageInput = {
    contactName: quote.inquiry.contactName,
    inquiryType: quote.inquiry.inquiryType,
    totalMin: quote.totalMin,
    totalMax: quote.totalMax,
    paymentSummary,
    caseNumber: quote.caseRecord?.caseNumber
  };

  return {
    id: quote.id,
    status: quote.status,
    selectedServiceLegacyIds: parseStringArray(quote.selectedServiceLegacyIds),
    selectedOptionLegacyIds: parseStringArray(quote.selectedOptionLegacyIds),
    urgencyRuleCode: quote.urgencyRuleCode,
    consultRuleCode: quote.consultRuleCode,
    paymentRuleCode: quote.paymentRuleCode,
    rangeMode: quote.rangeMode,
    serviceBaseMin: quote.serviceBaseMin,
    serviceBaseMax: quote.serviceBaseMax,
    subtotalMin: quote.subtotalMin,
    subtotalMax: quote.subtotalMax,
    vatAmountMin: quote.vatAmountMin,
    vatAmountMax: quote.vatAmountMax,
    totalMin: quote.totalMin,
    totalMax: quote.totalMax,
    consultFee: quote.consultFee,
    successFeeRestricted: quote.successFeeRestricted,
    draftNotes: quote.draftNotes,
    calculationSummary: quote.calculationSummary,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    lineItems: sortedLineItems.map((line: QuoteLineItemRecord) => ({
      id: line.id,
      kind: line.kind,
      label: line.label,
      description: line.description,
      amountMin: line.amountMin,
      amountMax: line.amountMax,
      sortOrder: line.sortOrder,
      serviceTypeId: line.serviceTypeId,
      isManual: line.isManual
    })),
    adjustments: sortedAdjustments.map((adjustment: QuoteAdjustmentRecord) => ({
      id: adjustment.id,
      label: adjustment.label,
      description: adjustment.description,
      optionType: adjustment.optionType,
      flatAmount: adjustment.flatAmount,
      percentRate: adjustment.percentRate,
      computedMin: adjustment.computedMin,
      computedMax: adjustment.computedMax,
      isVat: adjustment.isVat,
      sortOrder: adjustment.sortOrder,
      pricingOptionId: adjustment.pricingOptionId,
      isManual: adjustment.isManual
    })),
    paymentPlans: sortedPaymentPlans.map((plan: QuotePaymentPlanRecord) => ({
      id: plan.id,
      stageKind: plan.stageKind,
      percentage: plan.percentage,
      dueText: plan.dueText,
      amountMin: plan.amountMin,
      amountMax: plan.amountMax,
      sortOrder: plan.sortOrder
    })),
    contractDraft: toContractDraftSnapshot(quote.contractDraft),
    caseRecord: quote.caseRecord
      ? {
          id: quote.caseRecord.id,
          caseNumber: quote.caseRecord.caseNumber,
          currentStage: quote.caseRecord.currentStage,
          dueDate: quote.caseRecord.dueDate ? quote.caseRecord.dueDate.toISOString() : null,
          internalMemo: quote.caseRecord.internalMemo,
          updatedAt: quote.caseRecord.updatedAt.toISOString()
        }
      : null,
    messageDrafts: {
      quoteSendKo: buildQuoteSendDraftKo(messageInput),
      quoteSendEn: buildQuoteSendDraftEn(messageInput),
      acceptedKo: buildAcceptedNoticeDraftKo(messageInput),
      acceptedEn: buildAcceptedNoticeDraftEn(messageInput)
    }
  } satisfies QuoteSummarySnapshot;
}
