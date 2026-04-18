import type {
  PaymentStageKind,
  QuoteStatus
} from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import {
  mapUrgencyLevelToRuleCode,
  selectDefaultRuleCode,
  suggestServiceLegacyIds
} from "@/lib/quote-engine/legacy-mapping";
import type {
  PricingOptionMaster,
  PricingRuleMaster,
  QuoteComputationResult,
  QuoteInquirySnapshot,
  ServiceTypeMaster
} from "@/lib/quote-engine/types";
import {
  quoteWithRelationsInclude,
  type QuoteWithRelations
} from "@/lib/services/quote-serialization-helpers";

type QuoteComputedLineItem = QuoteComputationResult["lineItems"][number];
type QuoteComputedAdjustment = QuoteComputationResult["adjustments"][number];
type QuoteComputedPaymentPlan = QuoteComputationResult["paymentPlans"][number];
type ServiceTypeRecord = Awaited<ReturnType<typeof prisma.serviceType.findMany>>[number];
type PricingOptionRecord = Awaited<ReturnType<typeof prisma.pricingOption.findMany>>[number];
type PricingRuleRecord = Awaited<ReturnType<typeof prisma.pricingRule.findMany>>[number];

export type QuoteMasters = {
  serviceTypes: ServiceTypeMaster[];
  pricingOptions: PricingOptionMaster[];
  pricingRules: PricingRuleMaster[];
};

type QuoteComputationInputOverrides = {
  selectedServiceLegacyIds?: string[];
  selectedOptionLegacyIds?: string[];
  urgencyRuleCode?: string;
  consultRuleCode?: string;
  paymentRuleCode?: string;
  rangeMode?: boolean;
  stageOverrides?: Partial<Record<PaymentStageKind, { percentage?: number; dueText?: string }>>;
  draftNotes?: string | null;
};

export async function loadQuoteMasters(): Promise<QuoteMasters> {
  const [serviceTypes, pricingOptions, pricingRules] = await Promise.all([
    prisma.serviceType.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { minPrice: "asc" }] }),
    prisma.pricingOption.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.pricingRule.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } })
  ]);

  return {
    serviceTypes: serviceTypes.map<ServiceTypeMaster>((serviceType: ServiceTypeRecord) => ({
      id: serviceType.id,
      legacyId: serviceType.legacyId,
      name: serviceType.name,
      category: serviceType.category,
      minPrice: serviceType.minPrice,
      maxPrice: serviceType.maxPrice,
      isAppeal: serviceType.isAppeal,
      isActive: serviceType.isActive
    })),
    pricingOptions: pricingOptions.map<PricingOptionMaster>((option: PricingOptionRecord) => ({
      id: option.id,
      legacyId: option.legacyId,
      name: option.name,
      description: option.description,
      optionType: option.optionType,
      flatAmount: option.flatAmount,
      percentRate: option.percentRate,
      unitLabel: option.unitLabel,
      isVat: option.isVat,
      isActive: option.isActive
    })),
    pricingRules: pricingRules.map<PricingRuleMaster>((rule: PricingRuleRecord) => ({
      id: rule.id,
      code: rule.code,
      ruleType: rule.ruleType,
      label: rule.label,
      description: rule.description,
      numericValue: rule.numericValue,
      percentValue: rule.percentValue,
      jsonValue: rule.jsonValue,
      isDefault: rule.isDefault,
      isActive: rule.isActive
    }))
  };
}

export function toQuoteComputationInput(
  inquiry: QuoteInquirySnapshot,
  masters: QuoteMasters,
  input: QuoteComputationInputOverrides
) {
  return {
    inquiry,
    masters,
    selectedServiceLegacyIds:
      input.selectedServiceLegacyIds ??
      suggestServiceLegacyIds(inquiry, masters.serviceTypes),
    selectedOptionLegacyIds: input.selectedOptionLegacyIds ?? [],
    urgencyRuleCode:
      input.urgencyRuleCode ??
      mapUrgencyLevelToRuleCode(inquiry.urgencyLevel) ??
      selectDefaultRuleCode(masters.pricingRules, "URGENCY", "URGENCY_STANDARD"),
    consultRuleCode:
      input.consultRuleCode ??
      selectDefaultRuleCode(masters.pricingRules, "CONSULT", "CONSULT_NONE"),
    paymentRuleCode:
      input.paymentRuleCode ??
      selectDefaultRuleCode(masters.pricingRules, "PAYMENT", "PAYMENT_STANDARD"),
    rangeMode: input.rangeMode ?? true,
    stageOverrides: input.stageOverrides,
    draftNotes: input.draftNotes
  };
}

function buildLineItemCreateData(computation: QuoteComputationResult) {
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

function buildAdjustmentCreateData(computation: QuoteComputationResult) {
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

function buildPaymentPlanCreateData(computation: QuoteComputationResult) {
  return computation.paymentPlans.map((plan: QuoteComputedPaymentPlan) => ({
    stageKind: plan.stageKind,
    percentage: plan.percentage,
    dueText: plan.dueText,
    amountMin: plan.amountMin,
    amountMax: plan.amountMax,
    sortOrder: plan.sortOrder
  }));
}

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
