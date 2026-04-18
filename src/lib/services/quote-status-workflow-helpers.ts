import type {
  CaseStage,
  InquiryStatus,
  QuoteStatus
} from "@generated/prisma-client/client";

import { generateCaseNumber } from "@/lib/case-utils/case-number";
import { prisma } from "@/lib/prisma/client";
import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";
import { buildContractDraftText } from "@/lib/quote-engine/engine";
import {
  buildLawbotAnalysisDraft,
  mergeEditableSpecialTerms
} from "@/lib/services/quote-lawbot-draft-helpers";
import { serializeInquiryForQuote } from "@/lib/services/quote-service-core-helpers";
import type { QuoteWithRelations } from "@/lib/services/quote-serialization-helpers";

type QuoteLineItemRecord = QuoteWithRelations["lineItems"][number];
type QuotePaymentPlanRecord = QuoteWithRelations["paymentPlans"][number];

type QuoteWorkflowDbClient = Pick<typeof prisma, "contractDraft" | "caseRecord">;

export const quoteStatusToInquiryStatus: Record<QuoteStatus, InquiryStatus> = {
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

function buildContractAnalysisTerms(quote: QuoteWithRelations) {
  const analysis = analyzeInquiryCase(quote.inquiry);

  const sections = [
    "[사건 분석 참고]",
    `사건 강도: ${analysis.strengthLabel} (${analysis.strengthScore}점)`,
    `사건 요약: ${analysis.summary}`,
    "",
    "[핵심 쟁점]",
    ...analysis.issues.map((item) => `- ${item}`),
    "",
    "[유리 요소]",
    ...analysis.favorableFactors.map((item) => `- ${item}`),
    "",
    "[불리 요소]",
    ...analysis.riskFactors.map((item) => `- ${item}`),
    "",
    "[추가 확인 필요 사실]",
    ...analysis.missingFacts.map((item) => `- ${item}`),
    "",
    "[참고 법령]",
    ...analysis.lawReferences.map((item) => `- ${item.title}: ${item.summary}`),
    "",
    "[판례 검색어]",
    ...analysis.precedentReferences.map((item) => `- ${item.query}`)
  ];

  return sections.join("\n");
}

export function composeContractAnalysisTerms(
  quote: QuoteWithRelations,
  lawbotAnalysis?: Awaited<ReturnType<typeof getLawbotCaseAnalysis>>
) {
  const internalTerms = buildContractAnalysisTerms(quote);
  const lawbotTerms = buildLawbotAnalysisDraft(lawbotAnalysis ?? { status: "disabled", message: "" });

  return [internalTerms, lawbotTerms].filter(Boolean).join("\n\n");
}

export function assertQuoteTransition(currentStatus: QuoteStatus, nextStatus: QuoteStatus) {
  const allowed = quoteTransitionMap[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`견적 상태를 ${currentStatus}에서 ${nextStatus}(으)로 변경할 수 없습니다.`);
  }
}

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

export async function ensureCaseRecordForQuote(
  db: QuoteWorkflowDbClient,
  quote: QuoteWithRelations,
  input: {
    contractDraftId?: string | null;
    currentStage: CaseStage;
    dueDate?: Date | null;
    internalMemo?: string | null;
  }
) {
  if (quote.caseRecord) {
    return db.caseRecord.update({
      where: { id: quote.caseRecord.id },
      data: {
        contractDraftId: input.contractDraftId ?? quote.caseRecord.contractDraftId,
        currentStage: input.currentStage,
        dueDate: input.dueDate ?? quote.caseRecord.dueDate,
        internalMemo: input.internalMemo ?? quote.caseRecord.internalMemo
      }
    });
  }

  return db.caseRecord.create({
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
}
