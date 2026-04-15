import type {
  CaseStage,
  ContractDraftStatus,
  PaymentCollectionStatus,
  PaymentStageKind,
  PricingOptionType,
  PricingRuleType,
  QuoteLineKind,
  QuoteStatus
} from "@generated/prisma-client/client";
import type { InquiryType, LanguageCode, UrgencyLevel } from "@/types/inquiry";

export type QuoteInquirySnapshot = {
  id: string;
  title: string;
  description: string;
  inquiryType: InquiryType;
  urgencyLevel: UrgencyLevel;
  preferredLanguage: LanguageCode;
  contactName: string;
  organizationName: string | null;
  email: string;
  phone: string | null;
  classificationReason: string;
  serviceTags: string[];
  hasPreparedDocuments: boolean;
  needsTranslation: boolean;
  isCorporateRequest: boolean;
  consultationRequired: boolean;
};

export type ServiceTypeMaster = {
  id: string;
  legacyId: string;
  name: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  isAppeal: boolean;
  isActive: boolean;
};

export type PricingOptionMaster = {
  id: string;
  legacyId: string;
  name: string;
  description: string;
  optionType: PricingOptionType;
  flatAmount: number | null;
  percentRate: number | null;
  unitLabel: string | null;
  isVat: boolean;
  isActive: boolean;
};

export type PricingRuleMaster = {
  id: string;
  code: string;
  ruleType: PricingRuleType;
  label: string;
  description: string | null;
  numericValue: number | null;
  percentValue: number | null;
  jsonValue: string | null;
  isDefault: boolean;
  isActive: boolean;
};

export type QuoteMasterSet = {
  serviceTypes: ServiceTypeMaster[];
  pricingOptions: PricingOptionMaster[];
  pricingRules: PricingRuleMaster[];
};

export type StageTemplate = {
  stageKind: PaymentStageKind;
  percentage: number;
  dueText: string;
};

export type QuoteComputationInput = {
  inquiry: QuoteInquirySnapshot;
  masters: QuoteMasterSet;
  selectedServiceLegacyIds: string[];
  selectedOptionLegacyIds: string[];
  urgencyRuleCode: string;
  consultRuleCode: string;
  paymentRuleCode: string;
  rangeMode: boolean;
  stageOverrides?: Partial<Record<PaymentStageKind, { percentage?: number; dueText?: string }>>;
  draftNotes?: string | null;
};

export type QuoteComputationLineItem = {
  kind: QuoteLineKind;
  serviceTypeId?: string;
  label: string;
  description?: string | null;
  amountMin: number;
  amountMax: number;
  sortOrder: number;
  isManual?: boolean;
};

export type QuoteComputationAdjustment = {
  pricingOptionId?: string;
  label: string;
  description?: string | null;
  optionType: PricingOptionType;
  flatAmount?: number | null;
  percentRate?: number | null;
  computedMin: number;
  computedMax: number;
  isVat: boolean;
  sortOrder: number;
  isManual?: boolean;
};

export type QuoteComputationPaymentPlan = {
  stageKind: PaymentStageKind;
  percentage: number;
  dueText: string;
  amountMin: number;
  amountMax: number;
  sortOrder: number;
};

export type QuoteComputationResult = {
  selectedServiceLegacyIds: string[];
  selectedOptionLegacyIds: string[];
  urgencyRuleCode: string;
  consultRuleCode: string;
  paymentRuleCode: string;
  rangeMode: boolean;
  serviceBaseMin: number;
  serviceBaseMax: number;
  subtotalMin: number;
  subtotalMax: number;
  vatAmountMin: number;
  vatAmountMax: number;
  totalMin: number;
  totalMax: number;
  consultFee: number;
  successFeeRestricted: boolean;
  calculationSummary: string;
  warnings: string[];
  lineItems: QuoteComputationLineItem[];
  adjustments: QuoteComputationAdjustment[];
  paymentPlans: QuoteComputationPaymentPlan[];
};

export type QuoteSummarySnapshot = {
  id: string;
  status: QuoteStatus;
  selectedServiceLegacyIds: string[];
  selectedOptionLegacyIds: string[];
  urgencyRuleCode: string;
  consultRuleCode: string;
  paymentRuleCode: string;
  rangeMode: boolean;
  serviceBaseMin: number;
  serviceBaseMax: number;
  subtotalMin: number;
  subtotalMax: number;
  vatAmountMin: number;
  vatAmountMax: number;
  totalMin: number;
  totalMax: number;
  consultFee: number;
  successFeeRestricted: boolean;
  draftNotes: string | null;
  calculationSummary: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: Array<{
    id: string;
    kind: QuoteLineKind;
    label: string;
    description: string | null;
    amountMin: number;
    amountMax: number;
    sortOrder: number;
    serviceTypeId: string | null;
    isManual: boolean;
  }>;
  adjustments: Array<{
    id: string;
    label: string;
    description: string | null;
    optionType: PricingOptionType;
    flatAmount: number | null;
    percentRate: number | null;
    computedMin: number;
    computedMax: number;
    isVat: boolean;
    sortOrder: number;
    pricingOptionId: string | null;
    isManual: boolean;
  }>;
  paymentPlans: Array<{
    id: string;
    stageKind: PaymentStageKind;
    percentage: number;
    dueText: string;
    amountMin: number;
    amountMax: number;
    sortOrder: number;
  }>;
  contractDraft: {
    id: string;
    status: ContractDraftStatus;
    title: string;
    bodyText: string;
    paymentSummary: string | null;
    scopeText: string | null;
    successFeeRestricted: boolean;
    specialTerms: string | null;
    contractShareUrl: string | null;
    contractSentAt: string | null;
    contractSignedAt: string | null;
    paymentLinkUrl: string | null;
    paymentProvider: string | null;
    paymentRequestedAt: string | null;
    paymentStatus: PaymentCollectionStatus;
    paidAt: string | null;
    paymentReference: string | null;
    paymentMemo: string | null;
    updatedAt: string;
  } | null;
  caseRecord: {
    id: string;
    caseNumber: string;
    currentStage: CaseStage;
    dueDate: string | null;
    internalMemo: string | null;
    updatedAt: string;
  } | null;
  messageDrafts: {
    quoteSendKo: string;
    quoteSendEn: string;
    acceptedKo: string;
    acceptedEn: string;
  };
};

export type QuoteWorkspace = {
  inquiry: QuoteInquirySnapshot & {
    createdAt: string;
    updatedAt: string;
  };
  masters: {
    serviceTypes: ServiceTypeMaster[];
    pricingOptions: PricingOptionMaster[];
    urgencyRules: PricingRuleMaster[];
    consultRules: PricingRuleMaster[];
    paymentRules: PricingRuleMaster[];
    policyRules: PricingRuleMaster[];
  };
  suggestedServiceLegacyIds: string[];
  suggestedUrgencyRuleCode: string;
  latestQuote: QuoteSummarySnapshot | null;
};
