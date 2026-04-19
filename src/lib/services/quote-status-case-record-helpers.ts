import type { CaseStage } from "@generated/prisma-client/client";

import { generateCaseNumber } from "@/lib/case-utils/case-number";
import type { QuoteWorkflowDbClient } from "@/lib/services/quote-status-workflow-types";
import type { QuoteWithRelations } from "@/lib/services/quote-serialization-helpers";

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
