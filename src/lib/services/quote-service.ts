import type {
  CaseStage,
  InquiryStatus,
  PaymentCollectionStatus,
  PaymentStageKind,
  Prisma,
  QuoteStatus
} from "@generated/prisma-client/client";

import { ensureCaseDocumentChecklist } from "@/lib/case-documents/service";
import { generateCaseNumber } from "@/lib/case-utils/case-number";
import {
  buildAcceptedNoticeDraftEn,
  buildAcceptedNoticeDraftKo,
  buildQuoteSendDraftEn,
  buildQuoteSendDraftKo
} from "@/lib/message-templates/quote-flow";
import { prisma } from "@/lib/prisma/client";
import {
  buildContractDraftText,
  buildManualSummary,
  computeQuoteDraft
} from "@/lib/quote-engine/engine";
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
  QuoteSummarySnapshot,
  QuoteWorkspace,
  ServiceTypeMaster
} from "@/lib/quote-engine/types";
import { formatCurrency, toStageKindLabel } from "@/lib/quote-engine/utils";

type InquiryRecord = Prisma.InquiryGetPayload<Record<string, never>>;
type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: {
    inquiry: true;
    lineItems: true;
    adjustments: true;
    paymentPlans: true;
    contractDraft: true;
    caseRecord: true;
  };
}>;
type QuoteLineItemRecord = QuoteWithRelations["lineItems"][number];
type QuoteAdjustmentRecord = QuoteWithRelations["adjustments"][number];
type PaymentPlanRecord = QuoteWithRelations["paymentPlans"][number];
type ServiceTypeRecord = Awaited<ReturnType<typeof prisma.serviceType.findMany>>[number];
type PricingOptionRecord = Awaited<ReturnType<typeof prisma.pricingOption.findMany>>[number];
type PricingRuleRecord = Awaited<ReturnType<typeof prisma.pricingRule.findMany>>[number];
type QuoteTxDb = {
  quote: Pick<typeof prisma.quote, "findUniqueOrThrow" | "update">;
  inquiry: Pick<typeof prisma.inquiry, "update">;
  contractDraft: Pick<typeof prisma.contractDraft, "create" | "update">;
  caseRecord: Pick<typeof prisma.caseRecord, "create" | "update">;
  caseDocumentItem: Pick<typeof prisma.caseDocumentItem, "findMany" | "createMany">;
};
type DbClient = QuoteTxDb;

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
  } catch {
    return [];
  }
}

function serializeInquiryForQuote(inquiry: InquiryRecord): QuoteWorkspace["inquiry"] {
  return {
    id: inquiry.id,
    title: inquiry.title,
    description: inquiry.description,
    inquiryType: inquiry.inquiryType,
    urgencyLevel: inquiry.urgencyLevel,
    preferredLanguage: inquiry.preferredLanguage,
    contactName: inquiry.contactName,
    organizationName: inquiry.organizationName,
    email: inquiry.email,
    phone: inquiry.phone,
    classificationReason: inquiry.classificationReason,
    serviceTags: parseStringArray(inquiry.serviceTags),
    hasPreparedDocuments: inquiry.hasPreparedDocuments,
    needsTranslation: inquiry.needsTranslation,
    isCorporateRequest: inquiry.isCorporateRequest,
    consultationRequired: inquiry.consultationRequired,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString()
  };
}

function suggestInitialOptionLegacyIds(inquiry: QuoteInquirySnapshot, options: PricingOptionMaster[]) {
  const available = new Set(options.filter((option) => option.isActive).map((option) => option.legacyId));
  const selected = new Set<string>();

  if (inquiry.isCorporateRequest && available.has("multi")) {
    selected.add("multi");
  }

  if ((inquiry.needsTranslation || !inquiry.hasPreparedDocuments) && available.has("docs")) {
    selected.add("docs");
  }

  if (available.has("vat")) {
    selected.add("vat");
  }

  return Array.from(selected);
}

const quoteStatusToInquiryStatus: Record<QuoteStatus, InquiryStatus> = {
  DRAFT: "QUOTE_DRAFTED",
  READY_TO_SEND: "QUOTE_PENDING",
  SENT: "QUOTE_SENT",
  ACCEPTED: "WON",
  REJECTED: "ON_HOLD",
  EXPIRED: "ON_HOLD"
};

const quoteTransitionMap: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ["DRAFT", "READY_TO_SEND", "SENT", "REJECTED", "EXPIRED"],
  READY_TO_SEND: ["READY_TO_SEND", "DRAFT", "SENT", "REJECTED", "EXPIRED"],
  SENT: ["SENT", "READY_TO_SEND", "ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: ["ACCEPTED"],
  REJECTED: ["REJECTED", "READY_TO_SEND", "SENT"],
  EXPIRED: ["EXPIRED", "READY_TO_SEND", "SENT"]
};

function buildPaymentSummaryText(
  paymentPlans: Array<{
    stageKind: PaymentStageKind;
    percentage: number;
    dueText: string;
    amountMin: number;
    amountMax: number;
  }>
) {
  if (paymentPlans.length === 0) {
    return "납입 구조 미설정";
  }

  return paymentPlans
    .map(
      (plan) =>
        `${toStageKindLabel(plan.stageKind)} ${plan.percentage}% - ${plan.dueText} (${formatCurrency(plan.amountMin)}원 ~ ${formatCurrency(plan.amountMax)}원)`
    )
    .join("\n");
}

function toContractDraftSnapshot(contractDraft: QuoteWithRelations["contractDraft"]) {
  if (!contractDraft) return null;

  return {
    id: contractDraft.id,
    status: contractDraft.status,
    title: contractDraft.title,
    bodyText: contractDraft.bodyText,
    paymentSummary: contractDraft.paymentSummary,
    scopeText: contractDraft.scopeText,
    successFeeRestricted: contractDraft.successFeeRestricted,
    specialTerms: contractDraft.specialTerms,
    contractShareUrl: contractDraft.contractShareUrl,
    contractSentAt: contractDraft.contractSentAt ? contractDraft.contractSentAt.toISOString() : null,
    contractSignedAt: contractDraft.contractSignedAt ? contractDraft.contractSignedAt.toISOString() : null,
    paymentLinkUrl: contractDraft.paymentLinkUrl,
    paymentProvider: contractDraft.paymentProvider,
    paymentRequestedAt: contractDraft.paymentRequestedAt
      ? contractDraft.paymentRequestedAt.toISOString()
      : null,
    paymentStatus: contractDraft.paymentStatus,
    paidAt: contractDraft.paidAt ? contractDraft.paidAt.toISOString() : null,
    paymentReference: contractDraft.paymentReference,
    paymentMemo: contractDraft.paymentMemo,
    updatedAt: contractDraft.updatedAt.toISOString()
  };
}

function serializeQuote(quote: QuoteWithRelations) {
  const sortedLineItems = quote.lineItems.sort(
    (left: QuoteLineItemRecord, right: QuoteLineItemRecord) => left.sortOrder - right.sortOrder
  );
  const sortedAdjustments = quote.adjustments.sort(
    (left: QuoteAdjustmentRecord, right: QuoteAdjustmentRecord) => left.sortOrder - right.sortOrder
  );
  const sortedPaymentPlans = quote.paymentPlans.sort(
    (left: PaymentPlanRecord, right: PaymentPlanRecord) => left.sortOrder - right.sortOrder
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
    lineItems: sortedLineItems
      .map((line: QuoteLineItemRecord) => ({
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
    adjustments: sortedAdjustments
      .map((adjustment: QuoteAdjustmentRecord) => ({
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
    paymentPlans: sortedPaymentPlans
      .map((plan: PaymentPlanRecord) => ({
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

async function loadQuoteMasters() {
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

function toQuoteComputationInput(
  inquiry: QuoteInquirySnapshot,
  masters: Awaited<ReturnType<typeof loadQuoteMasters>>,
  input: {
    selectedServiceLegacyIds?: string[];
    selectedOptionLegacyIds?: string[];
    urgencyRuleCode?: string;
    consultRuleCode?: string;
    paymentRuleCode?: string;
    rangeMode?: boolean;
    stageOverrides?: Partial<Record<PaymentStageKind, { percentage?: number; dueText?: string }>>;
    draftNotes?: string | null;
  }
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

async function persistQuoteComputation(
  inquiryId: string,
  computation: QuoteComputationResult,
  input: {
    quoteId?: string;
    status?: QuoteStatus;
    draftNotes?: string | null;
  } = {}
) {
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
          lineItems: {
            create: computation.lineItems.map((line) => ({
              serviceTypeId: line.serviceTypeId,
              kind: line.kind,
              label: line.label,
              description: line.description,
              amountMin: line.amountMin,
              amountMax: line.amountMax,
              sortOrder: line.sortOrder,
              isManual: line.isManual ?? false
            }))
          },
          adjustments: {
            create: computation.adjustments.map((adjustment) => ({
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
            }))
          },
          paymentPlans: {
            create: computation.paymentPlans.map((plan) => ({
              stageKind: plan.stageKind,
              percentage: plan.percentage,
              dueText: plan.dueText,
              amountMin: plan.amountMin,
              amountMax: plan.amountMax,
              sortOrder: plan.sortOrder
            }))
          }
        }
      })
    ]);

    return getQuoteByIdOrThrow(input.quoteId);
  }

  const quote = await prisma.quote.create({
    data: {
      inquiryId,
      ...payload,
      lineItems: {
        create: computation.lineItems.map((line) => ({
          serviceTypeId: line.serviceTypeId,
          kind: line.kind,
          label: line.label,
          description: line.description,
          amountMin: line.amountMin,
          amountMax: line.amountMax,
          sortOrder: line.sortOrder,
          isManual: line.isManual ?? false
        }))
      },
      adjustments: {
        create: computation.adjustments.map((adjustment) => ({
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
        }))
      },
      paymentPlans: {
        create: computation.paymentPlans.map((plan) => ({
          stageKind: plan.stageKind,
          percentage: plan.percentage,
          dueText: plan.dueText,
          amountMin: plan.amountMin,
          amountMax: plan.amountMax,
          sortOrder: plan.sortOrder
        }))
      }
    },
    include: {
      inquiry: true,
      lineItems: true,
      adjustments: true,
      paymentPlans: true,
      contractDraft: true,
      caseRecord: true
    }
  });

  return quote;
}

async function getQuoteByIdOrThrow(quoteId: string) {
  return prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: {
      inquiry: true,
      lineItems: true,
      adjustments: true,
      paymentPlans: true,
      contractDraft: true,
      caseRecord: true
    }
  });
}

export async function getQuoteWorkspaceForInquiry(inquiryId: string): Promise<QuoteWorkspace> {
  const [inquiry, masters, latestQuote] = await Promise.all([
    prisma.inquiry.findUniqueOrThrow({ where: { id: inquiryId } }),
    loadQuoteMasters(),
    prisma.quote.findFirst({
      where: { inquiryId },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        inquiry: true,
        lineItems: true,
        adjustments: true,
        paymentPlans: true,
        contractDraft: true,
        caseRecord: true
      }
    })
  ]);

  const inquirySnapshot = serializeInquiryForQuote(inquiry);
  const suggestedServiceLegacyIds = suggestServiceLegacyIds(inquirySnapshot, masters.serviceTypes);

  return {
    inquiry: inquirySnapshot,
    masters: {
      serviceTypes: masters.serviceTypes,
      pricingOptions: masters.pricingOptions,
      urgencyRules: masters.pricingRules.filter((rule: PricingRuleMaster) => rule.ruleType === "URGENCY"),
      consultRules: masters.pricingRules.filter((rule: PricingRuleMaster) => rule.ruleType === "CONSULT"),
      paymentRules: masters.pricingRules.filter((rule: PricingRuleMaster) => rule.ruleType === "PAYMENT"),
      policyRules: masters.pricingRules.filter((rule: PricingRuleMaster) => rule.ruleType === "POLICY")
    },
    suggestedServiceLegacyIds,
    suggestedUrgencyRuleCode: mapUrgencyLevelToRuleCode(inquiry.urgencyLevel),
    latestQuote: latestQuote ? serializeQuote(latestQuote) : null
  };
}

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

export async function saveQuoteManualEdits(
  quoteId: string,
  input: {
    draftNotes?: string | null;
    lineItems: Array<{
      id: string;
      label: string;
      description?: string | null;
      amountMin: number;
      amountMax: number;
      sortOrder: number;
    }>;
    adjustments: Array<{
      id: string;
      label: string;
      description?: string | null;
      computedMin: number;
      computedMax: number;
      sortOrder: number;
    }>;
    paymentPlans: Array<{
      id: string;
      percentage: number;
      dueText: string;
      sortOrder: number;
      stageKind: PaymentStageKind;
    }>;
  }
) {
  await getQuoteByIdOrThrow(quoteId);

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: { draftNotes: input.draftNotes ?? null }
    }),
    ...input.lineItems.map((line) =>
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
    ...input.adjustments.map((adjustment) =>
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
    ...input.paymentPlans.map((plan) =>
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
  const lineItems = refreshed.lineItems.sort(
    (left: QuoteLineItemRecord, right: QuoteLineItemRecord) => left.sortOrder - right.sortOrder
  );
  const adjustments = refreshed.adjustments.sort(
    (left: QuoteAdjustmentRecord, right: QuoteAdjustmentRecord) => left.sortOrder - right.sortOrder
  );
  const serviceBaseMin = lineItems
    .filter((line: QuoteLineItemRecord) => line.kind === "SERVICE")
    .reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMin, 0);
  const serviceBaseMax = lineItems
    .filter((line: QuoteLineItemRecord) => line.kind === "SERVICE")
    .reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMax, 0);
  const subtotalMin =
    lineItems.reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMin, 0) +
    adjustments
      .filter((adjustment: QuoteAdjustmentRecord) => !adjustment.isVat)
      .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMin, 0);
  const subtotalMax =
    lineItems.reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMax, 0) +
    adjustments
      .filter((adjustment: QuoteAdjustmentRecord) => !adjustment.isVat)
      .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMax, 0);
  const vatAmountMin = adjustments
    .filter((adjustment: QuoteAdjustmentRecord) => adjustment.isVat)
    .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMin, 0);
  const vatAmountMax = adjustments
    .filter((adjustment: QuoteAdjustmentRecord) => adjustment.isVat)
    .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMax, 0);
  const totalMin = subtotalMin + vatAmountMin;
  const totalMax = subtotalMax + vatAmountMax;

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        serviceBaseMin,
        serviceBaseMax,
        subtotalMin,
        subtotalMax,
        vatAmountMin,
        vatAmountMax,
        totalMin,
          totalMax,
          calculationSummary: buildManualSummary({
          lineItems: lineItems.map((line: QuoteLineItemRecord) => ({
            label: line.label,
            amountMin: line.amountMin,
            amountMax: line.amountMax
          })),
          adjustments: adjustments.map((adjustment: QuoteAdjustmentRecord) => ({
            label: adjustment.label,
            computedMin: adjustment.computedMin,
            computedMax: adjustment.computedMax,
            isVat: adjustment.isVat
          })),
          consultFee: refreshed.consultFee,
          successFeeRestricted: refreshed.successFeeRestricted
        })
      }
    }),
    ...refreshed.paymentPlans.map((plan: PaymentPlanRecord) => {
      const incoming = input.paymentPlans.find((entry: (typeof input.paymentPlans)[number]) => entry.id === plan.id);
      const percentage = incoming?.percentage ?? plan.percentage;

      return prisma.paymentPlan.update({
        where: { id: plan.id },
        data: {
          percentage,
          amountMin: Math.round(totalMin * (percentage / 100)),
          amountMax: Math.round(totalMax * (percentage / 100))
        }
      });
    })
  ]);

  return serializeQuote(await getQuoteByIdOrThrow(quoteId));
}

async function loadQuoteWithRelations(db: DbClient, quoteId: string) {
  return db.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: {
      inquiry: true,
      lineItems: true,
      adjustments: true,
      paymentPlans: true,
      contractDraft: true,
      caseRecord: true
    }
  });
}

function assertQuoteTransition(currentStatus: QuoteStatus, nextStatus: QuoteStatus) {
  const allowed = quoteTransitionMap[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`견적 상태를 ${currentStatus}에서 ${nextStatus}(으)로 변경할 수 없습니다.`);
  }
}

async function upsertContractDraftFromQuote(db: DbClient, quote: QuoteWithRelations) {
  const warning = quote.successFeeRestricted
    ? ["행정심판/이의신청 계열 업무는 성공보수를 포함하지 않도록 제한됩니다."]
    : [];
  const draft = buildContractDraftText({
    inquiry: serializeInquiryForQuote(quote.inquiry),
    lineItems: quote.lineItems.sort(
      (left: QuoteLineItemRecord, right: QuoteLineItemRecord) => left.sortOrder - right.sortOrder
    ),
    paymentPlans: quote.paymentPlans.sort(
      (left: PaymentPlanRecord, right: PaymentPlanRecord) => left.sortOrder - right.sortOrder
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
      successFeeRestricted: quote.successFeeRestricted
    }
  });
}

async function ensureCaseRecordForQuote(
  db: DbClient,
  quote: QuoteWithRelations,
  input: {
    contractDraftId?: string | null;
    currentStage: CaseStage;
    dueDate?: Date | null;
    internalMemo?: string | null;
  }
) {
  if (quote.caseRecord) {
    const updated = await db.caseRecord.update({
      where: { id: quote.caseRecord.id },
      data: {
        contractDraftId: input.contractDraftId ?? quote.caseRecord.contractDraftId,
        currentStage: input.currentStage,
        dueDate: input.dueDate ?? quote.caseRecord.dueDate,
        internalMemo: input.internalMemo ?? quote.caseRecord.internalMemo
      }
    });

    await ensureCaseDocumentChecklist(db, updated.id, quote.inquiry.inquiryType);
    return updated;
  }

  const created = await db.caseRecord.create({
    data: {
      caseNumber: await generateCaseNumber(),
      inquiryId: quote.inquiryId,
      quoteId: quote.id,
      contractDraftId: input.contractDraftId ?? null,
      currentStage: input.currentStage,
      dueDate: input.dueDate ?? quote.inquiry.dueDate,
      internalMemo: input.internalMemo ?? quote.draftNotes
    }
  });

  await ensureCaseDocumentChecklist(db, created.id, quote.inquiry.inquiryType);
  return created;
}

export async function transitionQuoteStatus(
  quoteId: string,
  input: {
    status: QuoteStatus;
    caseDueDate?: Date;
    caseInternalMemo?: string;
  }
) {
  const current = await getQuoteByIdOrThrow(quoteId);
  assertQuoteTransition(current.status, input.status);

  await prisma.$transaction(async (tx) => {
    const db = tx as unknown as QuoteTxDb;
    await db.quote.update({
      where: { id: quoteId },
      data: { status: input.status }
    });

    await db.inquiry.update({
      where: { id: current.inquiryId },
      data: { status: quoteStatusToInquiryStatus[input.status] }
    });

    const refreshed = await loadQuoteWithRelations(db, quoteId);

    if (input.status === "ACCEPTED") {
      const contractDraft = await upsertContractDraftFromQuote(db, refreshed);
      await ensureCaseRecordForQuote(db, refreshed, {
        contractDraftId: contractDraft.id,
        currentStage: "CONTRACT_PREPARATION",
        dueDate: input.caseDueDate,
        internalMemo: input.caseInternalMemo
      });
      return;
    }

    if (input.status === "REJECTED" || input.status === "EXPIRED") {
      if (refreshed.caseRecord) {
        await ensureCaseRecordForQuote(db, refreshed, {
          currentStage: "ON_HOLD",
          dueDate: input.caseDueDate,
          internalMemo: input.caseInternalMemo
        });
      }
      return;
    }

    if (refreshed.caseRecord && (input.caseDueDate || input.caseInternalMemo)) {
      await ensureCaseRecordForQuote(db, refreshed, {
        currentStage: refreshed.caseRecord.currentStage,
        dueDate: input.caseDueDate,
        internalMemo: input.caseInternalMemo
      });
    }
  });

  return serializeQuote(await getQuoteByIdOrThrow(quoteId));
}

export async function createContractDraftFromQuote(quoteId: string) {
  await prisma.$transaction(async (tx) => {
    const db = tx as unknown as QuoteTxDb;
    const quote = await loadQuoteWithRelations(db, quoteId);
    const contractDraft = await upsertContractDraftFromQuote(db, quote);
    const nextStatus: QuoteStatus = quote.status === "DRAFT" ? "READY_TO_SEND" : quote.status;

    if (quote.status !== nextStatus) {
      await db.quote.update({
        where: { id: quote.id },
        data: { status: nextStatus }
      });
    }

    await db.inquiry.update({
      where: { id: quote.inquiryId },
      data: { status: quoteStatusToInquiryStatus[nextStatus] }
    });

    await ensureCaseRecordForQuote(db, quote, {
      contractDraftId: contractDraft.id,
      currentStage: "CONTRACT_PREPARATION",
      dueDate: quote.caseRecord?.dueDate ?? quote.inquiry.dueDate,
      internalMemo: quote.caseRecord?.internalMemo ?? quote.draftNotes
    });
  });

  return serializeQuote(await getQuoteByIdOrThrow(quoteId));
}

export async function updateContractPaymentAutomation(
  quoteId: string,
  input: {
    contractShareUrl?: string | null;
    sendContractNow?: boolean;
    markContractSigned?: boolean;
    paymentLinkUrl?: string | null;
    paymentProvider?: string | null;
    sendPaymentNow?: boolean;
    paymentStatus?: PaymentCollectionStatus;
    paymentReference?: string | null;
    paymentMemo?: string | null;
  }
) {
  await prisma.$transaction(async (tx) => {
    const db = tx as unknown as QuoteTxDb;
    const quote = await loadQuoteWithRelations(db, quoteId);
    const contractDraft = await upsertContractDraftFromQuote(db, quote);
    const now = new Date();

    const nextStatus =
      input.paymentStatus === "PAID"
        ? "PAID"
        : input.paymentStatus === "CANCELLED"
          ? "CANCELLED"
          : input.sendPaymentNow
            ? "REQUESTED"
            : contractDraft.paymentStatus;

    const updatedContractDraft = await db.contractDraft.update({
      where: { id: contractDraft.id },
      data: {
        contractShareUrl:
          input.contractShareUrl !== undefined ? input.contractShareUrl : contractDraft.contractShareUrl,
        contractSentAt: input.sendContractNow ? now : contractDraft.contractSentAt,
        contractSignedAt: input.markContractSigned ? now : contractDraft.contractSignedAt,
        status: input.markContractSigned ? "FINALIZED" : contractDraft.status,
        paymentLinkUrl:
          input.paymentLinkUrl !== undefined ? input.paymentLinkUrl : contractDraft.paymentLinkUrl,
        paymentProvider:
          input.paymentProvider !== undefined ? input.paymentProvider : contractDraft.paymentProvider,
        paymentRequestedAt: input.sendPaymentNow ? now : contractDraft.paymentRequestedAt,
        paymentStatus: nextStatus,
        paidAt:
          nextStatus === "PAID"
            ? contractDraft.paidAt ?? now
            : nextStatus === "CANCELLED"
              ? null
              : contractDraft.paidAt,
        paymentReference:
          input.paymentReference !== undefined ? input.paymentReference : contractDraft.paymentReference,
        paymentMemo: input.paymentMemo !== undefined ? input.paymentMemo : contractDraft.paymentMemo
      }
    });

    if (nextStatus === "PAID") {
      await db.quote.update({
        where: { id: quote.id },
        data: { status: "ACCEPTED" }
      });

      await db.inquiry.update({
        where: { id: quote.inquiryId },
        data: { status: quoteStatusToInquiryStatus.ACCEPTED }
      });

      const refreshed = await loadQuoteWithRelations(db, quoteId);
      await ensureCaseRecordForQuote(db, refreshed, {
        contractDraftId: updatedContractDraft.id,
        currentStage: "DOCUMENT_COLLECTION",
        dueDate: refreshed.caseRecord?.dueDate ?? refreshed.inquiry.dueDate,
        internalMemo: refreshed.caseRecord?.internalMemo ?? refreshed.draftNotes
      });
      return;
    }

    if (quote.caseRecord) {
      await ensureCaseRecordForQuote(db, quote, {
        contractDraftId: updatedContractDraft.id,
        currentStage: quote.caseRecord.currentStage,
        dueDate: quote.caseRecord.dueDate,
        internalMemo: quote.caseRecord.internalMemo
      });
    }
  });

  return serializeQuote(await getQuoteByIdOrThrow(quoteId));
}
