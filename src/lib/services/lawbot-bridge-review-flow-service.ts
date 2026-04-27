import type { LawbotBridgeReadonlySummary } from "./lawbot-bridge-readonly-summary-service";
import {
  BRIDGE_REVIEW_FALLBACK_TEXT,
  hasBridgeMojibake,
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
  reviewSignals: LawbotBridgeReadonlySummary["reviewSignals"] & {
    mustVerifyCount: number;
    mustVerifySourcesCount: number;
    riskFlagsCount: number;
  };
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

const FORBIDDEN_MOJIBAKE_CHAR_PATTERN = /[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/;

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

function hasForbiddenMojibakeChars(value: string) {
  return FORBIDDEN_MOJIBAKE_CHAR_PATTERN.test(value);
}

function toSafeText(value: string, fallback: string) {
  const normalized = normalizeBridgeText(value);
  if (!normalized || hasBridgeMojibake(normalized) || hasForbiddenMojibakeChars(normalized)) {
    return fallback;
  }
  return normalized;
}

function toSafeOptionalText(value: string | null, fallback: string) {
  if (value === null) {
    return null;
  }
  return toSafeText(value, fallback);
}

function toSafeId(value: string, fallbackPrefix: string, index: number) {
  const normalized = normalizeBridgeText(value);
  if (!normalized || hasBridgeMojibake(normalized) || hasForbiddenMojibakeChars(normalized)) {
    return `${fallbackPrefix}-${index + 1}`;
  }
  return normalized;
}

function toSafeSummaryArray(count: number, fallback: string) {
  if (count <= 0) {
    return [];
  }
  return [fallback];
}

export function buildSafeLawbotReviewDto(result: LawbotReviewFlowResult): LawbotReviewFlowResult {
  const mustVerifyCount = result.reviewSignals.mustVerify.length;
  const mustVerifySourcesCount = result.reviewSignals.mustVerifySources.length;
  const riskFlagsCount = result.reviewSignals.riskFlags.length;

  return {
    ...result,
    executionSummary: toSafeText(result.executionSummary, BRIDGE_REVIEW_FALLBACK_TEXT.generic),
    reviewSignals: {
      ...result.reviewSignals,
      mustVerifyCount,
      mustVerifySourcesCount,
      riskFlagsCount,
      mustVerify: toSafeSummaryArray(mustVerifyCount, BRIDGE_REVIEW_FALLBACK_TEXT.mustVerify),
      mustVerifySources: toSafeSummaryArray(
        mustVerifySourcesCount,
        BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
      ),
      riskFlags: toSafeSummaryArray(riskFlagsCount, BRIDGE_REVIEW_FALLBACK_TEXT.riskFlag),
      matchedSubtypeKeys: [],
      practitionerGuide: null,
      caseOutlook: null,
      legalAxisClues: result.reviewSignals.legalAxisClues.map((entry, index) => ({
        ...entry,
        id: toSafeId(entry.id, "axis-clue", index),
        label: BRIDGE_REVIEW_FALLBACK_TEXT.generic,
        sourceHint: BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
      })),
      reviewerAttentionPanel: {
        ...result.reviewSignals.reviewerAttentionPanel,
        headline: toSafeText(
          result.reviewSignals.reviewerAttentionPanel.headline,
          BRIDGE_REVIEW_FALLBACK_TEXT.generic
        ),
        items: result.reviewSignals.reviewerAttentionPanel.items.map((item) => ({
          ...item,
          label: BRIDGE_REVIEW_FALLBACK_TEXT.generic,
          reason: toSafeText(item.reason, BRIDGE_REVIEW_FALLBACK_TEXT.generic)
        }))
      },
      reviewerPatternReviewPanel: {
        ...result.reviewSignals.reviewerPatternReviewPanel,
        headline: toSafeText(
          result.reviewSignals.reviewerPatternReviewPanel.headline,
          BRIDGE_REVIEW_FALLBACK_TEXT.generic
        ),
        items: result.reviewSignals.reviewerPatternReviewPanel.items.map((item) => ({
          ...item,
          sampleLabels: toSafeSummaryArray(
            item.sampleLabels.length,
            BRIDGE_REVIEW_FALLBACK_TEXT.generic
          )
        }))
      },
      operatorAssistPanel: {
        ...result.reviewSignals.operatorAssistPanel,
        headline: toSafeText(
          result.reviewSignals.operatorAssistPanel.headline,
          BRIDGE_REVIEW_FALLBACK_TEXT.generic
        ),
        items: result.reviewSignals.operatorAssistPanel.items.map((item) => ({
          ...item,
          action: BRIDGE_REVIEW_FALLBACK_TEXT.generic,
          detail: toSafeOptionalText(item.detail, BRIDGE_REVIEW_FALLBACK_TEXT.generic)
        }))
      },
      reviewerReferencePanel: {
        ...result.reviewSignals.reviewerReferencePanel,
        headline: toSafeText(
          result.reviewSignals.reviewerReferencePanel.headline,
          BRIDGE_REVIEW_FALLBACK_TEXT.generic
        ),
        items: result.reviewSignals.reviewerReferencePanel.items.map((item, index) => ({
          ...item,
          id: toSafeId(item.id, "review-reference", index),
          title: toSafeText(item.title, BRIDGE_REVIEW_FALLBACK_TEXT.generic),
          reviewHint: toSafeText(item.reviewHint, BRIDGE_REVIEW_FALLBACK_TEXT.generic)
        }))
      },
      supplementalReferenceCandidates: result.reviewSignals.supplementalReferenceCandidates.map(
        (item) => ({
          ...item,
          title: toSafeText(item.title, BRIDGE_REVIEW_FALLBACK_TEXT.generic)
        })
      ),
      sourceVerificationChecklist: {
        ...result.reviewSignals.sourceVerificationChecklist,
        headline: toSafeText(
          result.reviewSignals.sourceVerificationChecklist.headline,
          BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
        ),
        items: result.reviewSignals.sourceVerificationChecklist.items.map((item, index) => ({
          ...item,
          id: toSafeId(item.id, "source-check", index),
          sourceLabel: BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification,
          sourceCitation: toSafeOptionalText(
            item.sourceCitation,
            BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
          ),
          notes: toSafeOptionalText(item.notes, BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification)
        }))
      },
      approvalWorkflowGate: {
        ...result.reviewSignals.approvalWorkflowGate,
        cautionRiskFlags: toSafeSummaryArray(
          result.reviewSignals.approvalWorkflowGate.cautionRiskFlags.length,
          BRIDGE_REVIEW_FALLBACK_TEXT.riskFlag
        ),
        summary: toSafeText(
          result.reviewSignals.approvalWorkflowGate.summary,
          BRIDGE_REVIEW_FALLBACK_TEXT.generic
        )
      }
    },
    reviewQueue: {
      ...result.reviewQueue,
      documentDrafts: result.reviewQueue.documentDrafts.map((draft) => ({
        ...draft,
        titleOrSubject: toSafeOptionalText(draft.titleOrSubject, BRIDGE_REVIEW_FALLBACK_TEXT.generic),
        mustVerifySources: toSafeSummaryArray(
          draft.mustVerifySources.length,
          BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
        ),
        riskFlags: toSafeSummaryArray(draft.riskFlags.length, BRIDGE_REVIEW_FALLBACK_TEXT.riskFlag)
      })),
      messageDrafts: result.reviewQueue.messageDrafts.map((draft) => ({
        ...draft,
        titleOrSubject: toSafeOptionalText(draft.titleOrSubject, BRIDGE_REVIEW_FALLBACK_TEXT.generic),
        mustVerifySources: toSafeSummaryArray(
          draft.mustVerifySources.length,
          BRIDGE_REVIEW_FALLBACK_TEXT.sourceVerification
        ),
        riskFlags: toSafeSummaryArray(draft.riskFlags.length, BRIDGE_REVIEW_FALLBACK_TEXT.riskFlag)
      }))
    },
    approvalGate: {
      ...result.approvalGate,
      externalActionAllowed: false,
      reasonCodes: result.approvalGate.reasonCodes.map((code) =>
        toSafeText(code, "manual_approval_required")
      )
    }
  };
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

  const normalizedResult = normalizeBridgeTextDeep({
    inquiryId: summary.inquiryId,
    caseId: summary.caseId,
    caseNumber: summary.caseNumber,
    workflowStatus: summary.workflowStatus,
    executionStatus: summary.executionStatus,
    executionSummary: summary.executionSummary,
    updatedAt: summary.updatedAt,
    reviewSignals: {
      ...summary.reviewSignals,
      mustVerifyCount: summary.reviewSignals.mustVerify.length,
      mustVerifySourcesCount: summary.reviewSignals.mustVerifySources.length,
      riskFlagsCount: summary.reviewSignals.riskFlags.length
    },
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
  }) as LawbotReviewFlowResult;

  return buildSafeLawbotReviewDto(normalizedResult);
}
