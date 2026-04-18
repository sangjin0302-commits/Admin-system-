import type {
  PaymentStageKind,
  QuoteStatus
} from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";
import {
  syncContractDraftAnalysisTerms,
  syncQuoteAnalysisSnapshot
} from "@/lib/services/quote-analysis-sync-helpers";
import { computeQuoteDraft } from "@/lib/quote-engine/engine";
import {
  loadQuoteMasters,
  persistQuoteComputation,
  toQuoteComputationInput
} from "@/lib/services/quote-computation-helpers";
import {
  type SaveQuoteManualEditsInput
} from "@/lib/services/quote-manual-edit-helpers";
import { saveQuoteManualEditsPersistence } from "@/lib/services/quote-manual-edit-persistence-helpers";
import {
  assertQuoteTransition,
} from "@/lib/services/quote-status-workflow-helpers";
import {
  applyQuoteStatusTransitionInTransaction,
  createContractDraftFromQuoteInTransaction,
  type QuoteWorkflowDbClient
} from "@/lib/services/quote-status-transaction-helpers";
import {
  serializeInquiryForQuote,
  suggestInitialOptionLegacyIds
} from "@/lib/services/quote-service-core-helpers";
import {
  quoteWithRelationsInclude,
  serializeQuote,
  type QuoteWithRelations
} from "@/lib/services/quote-serialization-helpers";
import {
  mapUrgencyLevelToRuleCode,
  selectDefaultRuleCode,
  suggestServiceLegacyIds
} from "@/lib/quote-engine/legacy-mapping";
import type { QuoteWorkspace } from "@/lib/quote-engine/types";

type DbClient = QuoteWorkflowDbClient;

function asDbClient(client: unknown): DbClient {
  return client as DbClient;
}

type QuoteLineItemRecord = QuoteWithRelations["lineItems"][number];
type QuoteAdjustmentRecord = QuoteWithRelations["adjustments"][number];
type QuotePaymentPlanRecord = QuoteWithRelations["paymentPlans"][number];

async function getQuoteByIdOrThrow(quoteId: string) {
  return prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: quoteWithRelationsInclude
  });
}

export async function getQuoteWorkspaceForInquiry(inquiryId: string): Promise<QuoteWorkspace> {
  const [inquiry, masters, latestQuote] = await Promise.all([
    prisma.inquiry.findUniqueOrThrow({ where: { id: inquiryId } }),
    loadQuoteMasters(),
    prisma.quote.findFirst({
      where: { inquiryId },
      orderBy: [{ updatedAt: "desc" }],
      include: quoteWithRelationsInclude
    })
  ]);

  const inquirySnapshot = serializeInquiryForQuote(inquiry);
  const suggestedServiceLegacyIds = suggestServiceLegacyIds(inquirySnapshot, masters.serviceTypes);
  const caseAnalysis = analyzeInquiryCase(inquiry);
  const lawbotAnalysis = await getLawbotCaseAnalysis(inquiry);

  return {
    inquiry: inquirySnapshot,
    caseAnalysis,
    lawbotAnalysis,
    masters: {
      serviceTypes: masters.serviceTypes,
      pricingOptions: masters.pricingOptions,
      urgencyRules: masters.pricingRules.filter((rule) => rule.ruleType === "URGENCY"),
      consultRules: masters.pricingRules.filter((rule) => rule.ruleType === "CONSULT"),
      paymentRules: masters.pricingRules.filter((rule) => rule.ruleType === "PAYMENT"),
      policyRules: masters.pricingRules.filter((rule) => rule.ruleType === "POLICY")
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
  input: SaveQuoteManualEditsInput
) {
  const updated = await saveQuoteManualEditsPersistence(quoteId, input);
  return serializeQuote(updated);
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
    const db = asDbClient(tx);
    await applyQuoteStatusTransitionInTransaction(db, {
      quoteId,
      inquiryId: current.inquiryId,
      status: input.status,
      caseDueDate: input.caseDueDate,
      caseInternalMemo: input.caseInternalMemo
    });
  });

  if (input.status === "ACCEPTED") {
    await syncContractDraftAnalysisTerms(quoteId);
    await syncQuoteAnalysisSnapshot(quoteId);
  }

  return serializeQuote(await getQuoteByIdOrThrow(quoteId));
}

export async function createContractDraftFromQuote(quoteId: string) {
  await prisma.$transaction(async (tx) => {
    const db = asDbClient(tx);
    await createContractDraftFromQuoteInTransaction(db, quoteId);
  });

  await syncContractDraftAnalysisTerms(quoteId);
  await syncQuoteAnalysisSnapshot(quoteId);

  return serializeQuote(await getQuoteByIdOrThrow(quoteId));
}

export async function exportContractDraftDocument(quoteId: string) {
  const quote = await getQuoteByIdOrThrow(quoteId);

  if (!quote.contractDraft) {
    throw new Error("계약 초안이 아직 생성되지 않았습니다.");
  }

  const safeTitle = `${quote.inquiry.contactName}-${quote.inquiry.title}`
    .replace(/[\\/:*?\"<>|]/g, "-")
    .slice(0, 80);

  const content = [
    `# ${quote.contractDraft.title}`,
    "",
    quote.contractDraft.bodyText,
    "",
    "## 업무 범위",
    quote.contractDraft.scopeText,
    "",
    "## 결제 안내",
    quote.contractDraft.paymentSummary,
    "",
    "## 특약 및 사건 분석 참고",
    quote.contractDraft.specialTerms ?? "특약 없음"
  ].join("\n");

  return {
    fileName: `${safeTitle || "contract-draft"}.md`,
    content
  };
}



