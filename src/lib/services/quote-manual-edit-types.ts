import type { PaymentStageKind } from "@generated/prisma-client/client";
import type { QuoteWithRelations } from "@/lib/services/quote-serialization-helpers";

type QuoteLineItemRecord = QuoteWithRelations["lineItems"][number];
type QuoteAdjustmentRecord = QuoteWithRelations["adjustments"][number];
type QuotePaymentPlanRecord = QuoteWithRelations["paymentPlans"][number];

export type { QuoteLineItemRecord, QuoteAdjustmentRecord, QuotePaymentPlanRecord };

export type ManualQuoteLineInput = {
  id: string;
  label: string;
  description?: string | null;
  amountMin: number;
  amountMax: number;
  sortOrder: number;
};

export type ManualQuoteAdjustmentInput = {
  id: string;
  label: string;
  description?: string | null;
  computedMin: number;
  computedMax: number;
  sortOrder: number;
};

export type ManualQuotePaymentPlanInput = {
  id: string;
  percentage: number;
  dueText: string;
  sortOrder: number;
  stageKind: PaymentStageKind;
};

export type SaveQuoteManualEditsInput = {
  draftNotes?: string | null;
  specialTerms?: string | null;
  lineItems: ManualQuoteLineInput[];
  adjustments: ManualQuoteAdjustmentInput[];
  paymentPlans: ManualQuotePaymentPlanInput[];
};

export type ManualQuoteTotalsInput = {
  lineItems: QuoteLineItemRecord[];
  adjustments: QuoteAdjustmentRecord[];
  consultFee: number;
  successFeeRestricted: boolean;
};

export type ManualQuoteTotals = {
  serviceBaseMin: number;
  serviceBaseMax: number;
  subtotalMin: number;
  subtotalMax: number;
  vatAmountMin: number;
  vatAmountMax: number;
  totalMin: number;
  totalMax: number;
  calculationSummary: string;
};
