import type { BridgeWorkflowStatus } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import {
  buildBridgeReviewViewModels,
  type ApprovalWorkflowGateViewModel,
  type LegalAxisClue,
  type OperatorAssistPanelViewModel,
  type ReviewerReferencePanelViewModel,
  type ReviewerPatternReviewPanelViewModel,
  type SourceVerificationChecklistViewModel,
  type ReviewerAttentionPanelViewModel,
  type SupplementalReferenceCandidate
} from "./lawbot-bridge-review-view-models";
import {
  normalizeBridgeStringArray,
  normalizeBridgeText,
  normalizeBridgeTextDeep
} from "./lawbot-bridge-text-normalizer";

type JsonObject = Record<string, unknown>;

type ExecutionStatus = "success" | "failed" | "pending";

export type LawbotBridgeReadonlySummary = {
  inquiryId: string;
  caseId: string | null;
  caseNumber: string | null;
  workflowStatus: BridgeWorkflowStatus;
  executionStatus: ExecutionStatus;
  executionSummary: string;
  updatedAt: string;
  reviewSignals: {
    reviewRequired: boolean;
    mustVerify: string[];
    mustVerifySources: string[];
    riskFlags: string[];
    matchedSubtypeKeys: string[];
    practitionerGuide: JsonObject | null;
    caseOutlook: JsonObject | null;
    supplementalReferenceCandidates: SupplementalReferenceCandidate[];
    legalAxisClues: LegalAxisClue[];
    reviewerAttentionPanel: ReviewerAttentionPanelViewModel;
    reviewerPatternReviewPanel: ReviewerPatternReviewPanelViewModel;
    operatorAssistPanel: OperatorAssistPanelViewModel;
    reviewerReferencePanel: ReviewerReferencePanelViewModel;
    sourceVerificationChecklist: SourceVerificationChecklistViewModel;
    approvalWorkflowGate: ApprovalWorkflowGateViewModel;
  };
  createdCounts: {
    caseTasks: number;
    sourceVerificationTasks: number;
    documentRequestTasks: number;
    documentDrafts: number;
    messageDrafts: number;
  };
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

function parseJsonObject(raw: string | null | undefined): JsonObject | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as JsonObject;
  } catch {
    return null;
  }
}

function parseSubtypeKeysFromObjects(input: {
  practitionerGuide: JsonObject | null;
  caseOutlook: JsonObject | null;
}) {
  const subtypeFromGuide = Array.isArray(input.practitionerGuide?.matched_subtype_keys)
    ? input.practitionerGuide?.matched_subtype_keys
    : [];
  const subtypeFromOutlook = Array.isArray(input.caseOutlook?.matched_subtype_keys)
    ? input.caseOutlook?.matched_subtype_keys
    : [];

  return [
    ...new Set(
      [...subtypeFromGuide, ...subtypeFromOutlook]
        .map((entry) => normalizeBridgeText(String(entry ?? "").trim()))
        .filter((entry) => entry.length > 0)
    )
  ];
}

function toExecutionStatus(status: BridgeWorkflowStatus): ExecutionStatus {
  if (status === "BLOCKED") {
    return "failed";
  }

  if (
    status === "APPROVAL_PENDING" ||
    status === "APPROVED" ||
    status === "REVISION_REQUESTED" ||
    status === "CLOSED"
  ) {
    return "success";
  }

  return "pending";
}

function toExecutionSummary(status: BridgeWorkflowStatus) {
  if (status === "BLOCKED") {
    return "Execution was blocked or failed. Additional operator review is required.";
  }

  if (status === "APPROVAL_PENDING") {
    return "Draft generation finished and approval is pending.";
  }

  if (status === "APPROVED") {
    return "Approved status recorded. External send/file actions still require manual confirmation.";
  }

  if (status === "REVISION_REQUESTED") {
    return "Revision requested. Additional operator edits are required.";
  }

  if (status === "CLOSED") {
    return "Workflow is closed.";
  }

  return "Workflow is still in progress or waiting for additional data.";
}

export async function getLawbotBridgeReadonlySummaryByInquiryId(
  inquiryId: string
): Promise<LawbotBridgeReadonlySummary | null> {
  const [inquiry, caseRecord] = await Promise.all([
    prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: {
        id: true,
        updatedAt: true,
        bridgeWorkflowStatus: true,
        bridgeReviewRequired: true,
        bridgeMustVerify: true,
        bridgeMustVerifySources: true,
        bridgeRiskFlags: true,
        bridgePractitionerGuide: true,
        bridgeCaseOutlook: true
      }
    }),
    prisma.caseRecord.findFirst({
      where: { inquiryId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        caseNumber: true,
        updatedAt: true,
        bridgeWorkflowStatus: true,
        bridgeReviewRequired: true,
        bridgeMustVerify: true,
        bridgeMustVerifySources: true,
        bridgeRiskFlags: true,
        bridgePractitionerGuide: true,
        bridgeCaseOutlook: true
      }
    })
  ]);

  if (!inquiry) {
    return null;
  }

  const source = caseRecord ?? inquiry;

  const [
    caseTasks,
    sourceVerificationTasks,
    documentRequestTasks,
    documentDrafts,
    messageDrafts
  ] = await Promise.all([
    prisma.caseTask.count({ where: { inquiryId, source: "lawbot_bridge" } }),
    prisma.sourceVerificationTask.count({ where: { inquiryId, source: "lawbot_bridge" } }),
    prisma.documentRequestTask.count({ where: { inquiryId, source: "lawbot_bridge" } }),
    prisma.documentDraft.count({ where: { inquiryId, source: "lawbot_bridge" } }),
    prisma.messageDraft.count({ where: { inquiryId, source: "lawbot_bridge" } })
  ]);

  const reviewSignalsBase = {
    reviewRequired: source.bridgeReviewRequired,
    mustVerify: parseStringArray(source.bridgeMustVerify),
    mustVerifySources: parseStringArray(source.bridgeMustVerifySources),
    riskFlags: parseStringArray(source.bridgeRiskFlags),
    practitionerGuide: parseJsonObject(source.bridgePractitionerGuide),
    caseOutlook: parseJsonObject(source.bridgeCaseOutlook)
  };
  const matchedSubtypeKeys = parseSubtypeKeysFromObjects(reviewSignalsBase);
  const reviewViewModels = buildBridgeReviewViewModels({
    ...reviewSignalsBase,
    matchedSubtypeKeys
  });

  return {
    inquiryId,
    caseId: caseRecord?.id ?? null,
    caseNumber: caseRecord?.caseNumber ?? null,
    workflowStatus: source.bridgeWorkflowStatus,
    executionStatus: toExecutionStatus(source.bridgeWorkflowStatus),
    executionSummary: normalizeBridgeText(toExecutionSummary(source.bridgeWorkflowStatus)),
    updatedAt: source.updatedAt.toISOString(),
    reviewSignals: normalizeBridgeTextDeep({
      ...reviewSignalsBase,
      matchedSubtypeKeys,
      supplementalReferenceCandidates: reviewViewModels.supplementalReferenceCandidates,
      legalAxisClues: reviewViewModels.legalAxisClues,
      reviewerAttentionPanel: reviewViewModels.reviewerAttentionPanel,
      reviewerPatternReviewPanel: reviewViewModels.reviewerPatternReviewPanel,
      operatorAssistPanel: reviewViewModels.operatorAssistPanel,
      reviewerReferencePanel: reviewViewModels.reviewerReferencePanel,
      sourceVerificationChecklist: reviewViewModels.sourceVerificationChecklist,
      approvalWorkflowGate: reviewViewModels.approvalWorkflowGate
    }),
    createdCounts: {
      caseTasks,
      sourceVerificationTasks,
      documentRequestTasks,
      documentDrafts,
      messageDrafts
    }
  };
}
