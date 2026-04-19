import type {
  PaymentStageKind,
  QuoteStatus
} from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import {
  syncContractDraftAnalysisTerms,
  syncQuoteAnalysisSnapshot
} from "@/lib/services/quote-analysis-sync-helpers";
import {
  assertQuoteTransition
} from "@/lib/services/quote-status-workflow-helpers";
import {
  applyQuoteStatusTransitionInTransaction,
  createContractDraftFromQuoteInTransaction,
  type QuoteWorkflowDbClient
} from "@/lib/services/quote-status-transaction-helpers";
import {
  quoteWithRelationsInclude,
  serializeQuote
} from "@/lib/services/quote-serialization-helpers";

type DbClient = QuoteWorkflowDbClient;

function asDbClient(client: unknown): DbClient {
  return client as DbClient;
}

async function getQuoteByIdOrThrow(quoteId: string) {
  return prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: quoteWithRelationsInclude
  });
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
