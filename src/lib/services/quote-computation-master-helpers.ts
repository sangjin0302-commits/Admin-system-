import type { PaymentStageKind } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import {
  mapUrgencyLevelToRuleCode,
  selectDefaultRuleCode,
  suggestServiceLegacyIds
} from "@/lib/quote-engine/legacy-mapping";
import type {
  PricingOptionMaster,
  PricingRuleMaster,
  QuoteInquirySnapshot,
  ServiceTypeMaster
} from "@/lib/quote-engine/types";

type ServiceTypeRecord = Awaited<ReturnType<typeof prisma.serviceType.findMany>>[number];
type PricingOptionRecord = Awaited<ReturnType<typeof prisma.pricingOption.findMany>>[number];
type PricingRuleRecord = Awaited<ReturnType<typeof prisma.pricingRule.findMany>>[number];

export type QuoteMasters = {
  serviceTypes: ServiceTypeMaster[];
  pricingOptions: PricingOptionMaster[];
  pricingRules: PricingRuleMaster[];
};

export type QuoteComputationInputOverrides = {
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
