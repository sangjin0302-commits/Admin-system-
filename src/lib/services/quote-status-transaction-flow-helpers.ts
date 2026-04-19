import type { QuoteStatus } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import {
  ensureCaseRecordForQuote,
  quoteStatusToInquiryStatus,
  upsertContractDraftFromQuote
} from "@/lib/services/quote-status-workflow-helpers";
import {
  quoteWithRelationsInclude,
  type QuoteWithRelations
} from "@/lib/services/quote-serialization-helpers";

export type QuoteWorkflowDbClient = Pick<typeof prisma, "quote" | "contractDraft" | "caseRecord" | "inquiry">;

async function loadQuoteWithRelations(db: QuoteWorkflowDbClient, quoteId: string): Promise<QuoteWithRelations> {
  return db.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: quoteWithRelationsInclude
  });
}

export async function applyQuoteStatusTransitionInTransaction(
  db: QuoteWorkflowDbClient,
  input: {
    quoteId: string;
    inquiryId: string;
    status: QuoteStatus;
    caseDueDate?: Date;
    caseInternalMemo?: string;
  }
) {
  const nextInquiryStatus = quoteStatusToInquiryStatus[input.status];

  await db.quote.update({
    where: { id: input.quoteId },
    data: { status: input.status }
  });

  await db.inquiry.update({
    where: { id: input.inquiryId },
    data: { status: nextInquiryStatus }
  });

  const refreshed = await loadQuoteWithRelations(db, input.quoteId);

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
}

export async function createContractDraftFromQuoteInTransaction(
  db: QuoteWorkflowDbClient,
  quoteId: string
) {
  const quote = await loadQuoteWithRelations(db, quoteId);
  const contractDraft = await upsertContractDraftFromQuote(db, quote);
  const nextStatus: QuoteStatus = quote.status === "DRAFT" ? "READY_TO_SEND" : quote.status;
  const nextInquiryStatus = quoteStatusToInquiryStatus[nextStatus];

  if (quote.status !== nextStatus) {
    await db.quote.update({
      where: { id: quote.id },
      data: { status: nextStatus }
    });
  }

  await db.inquiry.update({
    where: { id: quote.inquiryId },
    data: { status: nextInquiryStatus }
  });

  await ensureCaseRecordForQuote(db, quote, {
    contractDraftId: contractDraft.id,
    currentStage: "CONTRACT_PREPARATION",
    dueDate: quote.caseRecord?.dueDate ?? quote.inquiry.dueDate,
    internalMemo: quote.caseRecord?.internalMemo ?? quote.draftNotes
  });
}
