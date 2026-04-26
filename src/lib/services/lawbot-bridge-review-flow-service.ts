import type { LawbotBridgeReadonlySummary } from "./lawbot-bridge-readonly-summary-service";
import {
  normalizeBridgeTextDeep,
  normalizeBridgeStringArray,
  normalizeBridgeText
} from "./lawbot-bridge-text-normalizer";

type ReviewDraftStatus =
  | "DRAFT_CREATED"
  | "APPROVAL_PENDING"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "BLOCKED"
  | "ARCHIVED";

type ReviewDraftSource = "document" | "message";

type LawbotDocumentDraftRow = {
  id: string;
  draftType: string;
  title: string | null;
  status: ReviewDraftStatus;
  reviewRequired: boolean;
  mustVerifySources: string | null;
  riskFlags: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type LawbotMessageDraftRow = {
  id: string;
  messageKind: string;
  subject: string | null;
  status: ReviewDraftStatus;
  reviewRequired: boolean;
  mustVerifySources: string | null;
  riskFlags: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LawbotReviewDraftItem = {
  id: string;
  sourceType: ReviewDraftSource;
  draftTypeOrKind: string;
  titleOrSubject: string | null;
  status: ReviewDraftStatus;
  reviewRequired: boolean;
  mustVerifySources: string[];
  riskFlags: string[];
  createdAt: string;
  updatedAt: string;
};

export type LawbotReviewFlowResult = {
  inquiryId: string;
  caseId: string | null;
  caseNumber: string | null;
  workflowStatus: LawbotBridgeReadonlySummary["workflowStatus"];
  executionStatus: LawbotBridgeReadonlySummary["executionStatus"];
  executionSummary: string;
  updatedAt: string;
  reviewSignals: LawbotBridgeReadonlySummary["reviewSignals"];
  createdCounts: LawbotBridgeReadonlySummary["createdCounts"];
  reviewQueue: {
    documentDrafts: LawbotReviewDraftItem[];
    messageDrafts: LawbotReviewDraftItem[];
    totalDrafts: number;
    approvalPendingDrafts: number;
  };
  approvalGate: {
    approvalRequired: true;
    externalActionAllowed: false;
    reasonCodes: string[];
  };
};

export type LawbotReviewFlowDependencies = {
  loadSummary?: (inquiryId: string) => Promise<LawbotBridgeReadonlySummary | null>;
  loadDocumentDrafts?: (inquiryId: string) => Promise<LawbotDocumentDraftRow[]>;
  loadMessageDrafts?: (inquiryId: string) => Promise<LawbotMessageDraftRow[]>;
};

function parseStringArray(raw: string | null | undefined) {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return normalizeBridgeStringArray(
      parsed
        .map((entry) => String(entry ?? "").trim())
        .filter((entry) => entry.length > 0)
    );
  } catch {
    return [];
  }
}

function toApprovalReasonCodes(
  summary: LawbotBridgeReadonlySummary,
  approvalPendingDrafts: number
) {
  const reasons = new Set<string>();
  reasons.add("manual_approval_required");

  if (summary.reviewSignals.reviewRequired) {
    reasons.add("review_required");
  }
  if (summary.reviewSignals.mustVerify.length > 0) {
    reasons.add("must_verify_pending");
  }
  if (summary.reviewSignals.mustVerifySources.length > 0) {
    reasons.add("must_verify_sources_pending");
  }
  if (summary.reviewSignals.riskFlags.length > 0) {
    reasons.add("risk_flags_present");
  }
  if (approvalPendingDrafts > 0) {
    reasons.add("draft_approval_pending");
  }

  return [...reasons];
}

async function loadLawbotDocumentDraftRows(inquiryId: string): Promise<LawbotDocumentDraftRow[]> {
  const { prisma } = await import("../prisma/client");
  return prisma.documentDraft.findMany({
    where: { inquiryId, source: "lawbot_bridge" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      draftType: true,
      title: true,
      status: true,
      reviewRequired: true,
      mustVerifySources: true,
      riskFlags: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

async function loadLawbotMessageDraftRows(inquiryId: string): Promise<LawbotMessageDraftRow[]> {
  const { prisma } = await import("../prisma/client");
  return prisma.messageDraft.findMany({
    where: { inquiryId, source: "lawbot_bridge" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      messageKind: true,
      subject: true,
      status: true,
      reviewRequired: true,
      mustVerifySources: true,
      riskFlags: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function getLawbotBridgeReviewFlowByInquiryId(
  inquiryId: string,
  dependencies?: LawbotReviewFlowDependencies
): Promise<LawbotReviewFlowResult | null> {
  const loadSummary =
    dependencies?.loadSummary ??
    (async (id: string) => {
      const { getLawbotBridgeReadonlySummaryByInquiryId } = await import(
        "./lawbot-bridge-readonly-summary-service"
      );
      return getLawbotBridgeReadonlySummaryByInquiryId(id);
    });
  const loadDocumentDrafts = dependencies?.loadDocumentDrafts ?? loadLawbotDocumentDraftRows;
  const loadMessageDrafts = dependencies?.loadMessageDrafts ?? loadLawbotMessageDraftRows;

  const summary = await loadSummary(inquiryId);
  if (!summary) {
    return null;
  }

  const [documentDraftRows, messageDraftRows] = await Promise.all([
    loadDocumentDrafts(inquiryId),
    loadMessageDrafts(inquiryId)
  ]);

  const documentDrafts: LawbotReviewDraftItem[] = documentDraftRows.map((row) => ({
    id: row.id,
    sourceType: "document",
    draftTypeOrKind: row.draftType,
    titleOrSubject: row.title ? normalizeBridgeText(row.title) : null,
    status: row.status,
    reviewRequired: row.reviewRequired,
    mustVerifySources: parseStringArray(row.mustVerifySources),
    riskFlags: parseStringArray(row.riskFlags),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }));

  const messageDrafts: LawbotReviewDraftItem[] = messageDraftRows.map((row) => ({
    id: row.id,
    sourceType: "message",
    draftTypeOrKind: row.messageKind,
    titleOrSubject: row.subject ? normalizeBridgeText(row.subject) : null,
    status: row.status,
    reviewRequired: row.reviewRequired,
    mustVerifySources: parseStringArray(row.mustVerifySources),
    riskFlags: parseStringArray(row.riskFlags),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }));

  const approvalPendingDrafts = [...documentDrafts, ...messageDrafts].filter(
    (draft) => draft.status === "APPROVAL_PENDING"
  ).length;

  return normalizeBridgeTextDeep({
    inquiryId: summary.inquiryId,
    caseId: summary.caseId,
    caseNumber: summary.caseNumber,
    workflowStatus: summary.workflowStatus,
    executionStatus: summary.executionStatus,
    executionSummary: summary.executionSummary,
    updatedAt: summary.updatedAt,
    reviewSignals: summary.reviewSignals,
    createdCounts: summary.createdCounts,
    reviewQueue: {
      documentDrafts,
      messageDrafts,
      totalDrafts: documentDrafts.length + messageDrafts.length,
      approvalPendingDrafts
    },
    approvalGate: {
      approvalRequired: true,
      externalActionAllowed: false,
      reasonCodes: toApprovalReasonCodes(summary, approvalPendingDrafts)
    }
  });
}
