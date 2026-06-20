import type { InquiryStatus } from "@generated/prisma-client/client";

import { syncCaseAnalysisToNotion } from "@/lib/integrations/notion";
import { prisma } from "@/lib/prisma/client";
import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";
import { mergeEditableSpecialTerms } from "@/lib/services/quote-lawbot-draft-helpers";
import { composeContractAnalysisTerms } from "@/lib/services/quote-status-workflow-helpers";
import { parseStringArray } from "@/lib/services/quote-service-core-helpers";
import {
  quoteWithRelationsInclude,
  type QuoteWithRelations
} from "@/lib/services/quote-serialization-helpers";
import type { InquiryType, UrgencyLevel } from "@/types/inquiry";
import { logger } from "@/lib/utils/logger";

async function getQuoteByIdOrThrow(quoteId: string): Promise<QuoteWithRelations> {
  return prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: quoteWithRelationsInclude
  });
}

export async function syncQuoteAnalysisSnapshot(quoteId: string) {
  const quote = await getQuoteByIdOrThrow(quoteId);
  const analysis = analyzeInquiryCase(quote.inquiry);
  const lawbotAnalysis = await getLawbotCaseAnalysis(quote.inquiry);
  const caseStage = quote.caseRecord?.currentStage ? String(quote.caseRecord.currentStage) : null;

  try {
    await syncCaseAnalysisToNotion({
      inquiryId: quote.inquiryId,
      contactName: quote.inquiry.contactName,
      contactPhone: quote.inquiry.phone,
      inquiryTitle: quote.inquiry.title,
      inquiryType: quote.inquiry.inquiryType as InquiryType,
      inquiryStatus: quote.inquiry.status as InquiryStatus,
      urgencyLevel: quote.inquiry.urgencyLevel as UrgencyLevel,
      qualificationScore: quote.inquiry.qualificationScore,
      generatedSummary: quote.inquiry.generatedSummary,
      recommendedNextStep: quote.inquiry.recommendedNextStep,
      classificationReason: quote.inquiry.classificationReason,
      recommendedDocuments: parseStringArray(quote.inquiry.precheckRecommendedDocs),
      serviceTags: parseStringArray(quote.inquiry.serviceTags),
      createdAt: quote.inquiry.createdAt.toISOString(),
      targetAgency: quote.inquiry.targetAgency,
      organizationName: quote.inquiry.organizationName,
      analysis,
      contractTitle: quote.contractDraft?.title,
      draftNotes: quote.draftNotes,
      caseNumber: quote.caseRecord?.caseNumber,
      dueDate: quote.caseRecord?.dueDate?.toISOString() ?? quote.inquiry.dueDate?.toISOString() ?? null,
      compensationStatus:
        quote.status === "ACCEPTED"
          ? "수임 완료"
          : quote.status === "SENT" || quote.status === "READY_TO_SEND"
            ? "견적 단계"
            : quote.status === "REJECTED" || quote.status === "EXPIRED"
              ? "보류"
              : "검토 중",
      lawbotAnalysis,
      workflowStatus:
        caseStage === "CLOSED" || caseStage === "COMPLETED"
          ? "완료"
          : caseStage
            ? "진행 중"
            : "시작 전"
    });
  } catch (error) {
    logger.error("Failed to sync quote analysis to Notion", error);
  }
}

export async function syncContractDraftAnalysisTerms(quoteId: string) {
  const quote = await getQuoteByIdOrThrow(quoteId);

  if (!quote.contractDraft) {
    return;
  }

  const lawbotAnalysis = await getLawbotCaseAnalysis(quote.inquiry);
  const specialTerms = composeContractAnalysisTerms(quote, lawbotAnalysis);

  await prisma.contractDraft.update({
    where: { id: quote.contractDraft.id },
    data: {
      specialTerms: mergeEditableSpecialTerms(quote.contractDraft.specialTerms, specialTerms)
    }
  });
}
