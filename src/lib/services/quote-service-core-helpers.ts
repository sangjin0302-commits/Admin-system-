import type {
  ContractDraft,
  PaymentStageKind,
  Prisma
} from "@generated/prisma-client/client";

import { formatCurrency, toStageKindLabel } from "@/lib/quote-engine/utils";
import type {
  PricingOptionMaster,
  QuoteInquirySnapshot,
  QuoteWorkspace
} from "@/lib/quote-engine/types";

type InquiryRecord = Prisma.InquiryGetPayload<Record<string, never>>;

export function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
  } catch {
    return [];
  }
}

export function serializeInquiryForQuote(inquiry: InquiryRecord): QuoteWorkspace["inquiry"] {
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

export function suggestInitialOptionLegacyIds(
  inquiry: QuoteInquirySnapshot,
  options: PricingOptionMaster[]
) {
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

export function buildPaymentSummaryText(
  paymentPlans: Array<{
    stageKind: PaymentStageKind;
    percentage: number;
    dueText: string;
    amountMin: number;
    amountMax: number;
  }>
) {
  if (paymentPlans.length === 0) {
    return "수임 구조 미설정";
  }

  return paymentPlans
    .map(
      (plan) =>
        `${toStageKindLabel(plan.stageKind)} ${plan.percentage}% - ${plan.dueText} (${formatCurrency(plan.amountMin)} ~ ${formatCurrency(plan.amountMax)})`
    )
    .join("\n");
}

export function toContractDraftSnapshot(contractDraft: ContractDraft | null) {
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
    updatedAt: contractDraft.updatedAt.toISOString()
  };
}
