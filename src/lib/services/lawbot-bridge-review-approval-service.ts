import { prisma } from "@/lib/prisma/client";

import { buildLawbotReviewSafeDto } from "./lawbot-bridge-review-safe-dto";
import { getLawbotBridgeReviewFlowByInquiryId } from "./lawbot-bridge-review-flow-service";

type BridgeWorkflowStatus =
  | "NEW_INQUIRY"
  | "TRIAGE_REVIEW"
  | "AWAITING_MORE_FACTS"
  | "PROFILED"
  | "PROFILE_REVIEW_REQUIRED"
  | "CASE_CARD_CREATED"
  | "AWAITING_SOURCE_VERIFICATION"
  | "DRAFT_CREATED"
  | "MESSAGE_DRAFT_CREATED"
  | "APPROVAL_PENDING"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "BLOCKED"
  | "CLOSED";

type WorkflowDraftStatus =
  | "DRAFT_CREATED"
  | "APPROVAL_PENDING"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "BLOCKED"
  | "ARCHIVED";

type ApprovalInquiryRecord = {
  id: string;
  bridgeWorkflowStatus: BridgeWorkflowStatus;
  communicationLogs: string;
};

type ApprovalCaseRecord = {
  id: string;
  bridgeWorkflowStatus: BridgeWorkflowStatus;
};

type ApprovalDraftRecord = {
  id: string;
};

type ApprovalTransactionClient = {
  inquiry: {
    findUnique(args: unknown): Promise<ApprovalInquiryRecord | null>;
    update(args: unknown): Promise<unknown>;
  };
  caseRecord: {
    findFirst(args: unknown): Promise<ApprovalCaseRecord | null>;
    update(args: unknown): Promise<unknown>;
  };
  documentDraft: {
    findMany(args: unknown): Promise<ApprovalDraftRecord[]>;
    updateMany(args: unknown): Promise<unknown>;
  };
  messageDraft: {
    findMany(args: unknown): Promise<ApprovalDraftRecord[]>;
    updateMany(args: unknown): Promise<unknown>;
  };
};

type ApprovalPrismaClient = ApprovalTransactionClient & {
  $transaction<T>(handler: (tx: ApprovalTransactionClient) => Promise<T>): Promise<T>;
};

type LawbotReviewApprovalInput = {
  inquiryId: string;
  manualReviewChecked: boolean;
  sourcesChecked: boolean;
  riskFlagsChecked: boolean;
  draftsReviewed: boolean;
  operatorNote?: string | null;
  expectedWorkflowStatus?: BridgeWorkflowStatus;
};

type LawbotReviewApprovalDependencies = {
  prismaClient?: ApprovalPrismaClient;
  now?: () => Date;
  loadReviewResult?: (inquiryId: string) => Promise<unknown>;
};

type ApprovalAuditEntry = {
  type: "lawbot_review_approval";
  source: "admin_lawbot_review";
  operatorNote: string | null;
  confirmedChecks: {
    manualReviewChecked: true;
    sourcesChecked: true;
    riskFlagsChecked: true;
    draftsReviewed: true;
  };
  previousWorkflowStatus: "APPROVAL_PENDING";
  nextWorkflowStatus: "APPROVED";
  approvedDocumentDraftIds: string[];
  approvedMessageDraftIds: string[];
  externalActionAllowed: false;
  timestamp: string;
};

export class LawbotReviewApprovalError extends Error {
  readonly status: number;
  readonly code: string;
  readonly reason: string;

  constructor(input: { status: number; code: string; reason: string; message: string }) {
    super(input.message);
    this.name = "LawbotReviewApprovalError";
    this.status = input.status;
    this.code = input.code;
    this.reason = input.reason;
  }
}

function approvalError(status: number, code: string, reason: string, message: string) {
  return new LawbotReviewApprovalError({ status, code, reason, message });
}

function assertConfirmed(input: LawbotReviewApprovalInput) {
  const requiredChecks: Array<keyof Pick<
    LawbotReviewApprovalInput,
    "manualReviewChecked" | "sourcesChecked" | "riskFlagsChecked" | "draftsReviewed"
  >> = ["manualReviewChecked", "sourcesChecked", "riskFlagsChecked", "draftsReviewed"];

  for (const key of requiredChecks) {
    if (input[key] !== true) {
      throw approvalError(
        400,
        "LAWBOT_REVIEW_APPROVAL_CONFIRMATION_REQUIRED",
        `${key}_required`,
        "Required approval confirmation is missing."
      );
    }
  }
}

function parseCommunicationLogs(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildAuditEntry(input: {
  operatorNote?: string | null;
  documentDraftIds: string[];
  messageDraftIds: string[];
  timestamp: string;
}): ApprovalAuditEntry {
  const operatorNote = input.operatorNote?.trim();
  return {
    type: "lawbot_review_approval",
    source: "admin_lawbot_review",
    operatorNote: operatorNote ? operatorNote.slice(0, 1000) : null,
    confirmedChecks: {
      manualReviewChecked: true,
      sourcesChecked: true,
      riskFlagsChecked: true,
      draftsReviewed: true
    },
    previousWorkflowStatus: "APPROVAL_PENDING",
    nextWorkflowStatus: "APPROVED",
    approvedDocumentDraftIds: input.documentDraftIds,
    approvedMessageDraftIds: input.messageDraftIds,
    externalActionAllowed: false,
    timestamp: input.timestamp
  };
}

async function loadDefaultReviewResult(inquiryId: string) {
  return getLawbotBridgeReviewFlowByInquiryId(inquiryId);
}

export async function approveLawbotReview(
  input: LawbotReviewApprovalInput,
  dependencies: LawbotReviewApprovalDependencies = {}
) {
  assertConfirmed(input);

  const expectedWorkflowStatus = input.expectedWorkflowStatus ?? "APPROVAL_PENDING";
  const prismaClient = dependencies.prismaClient ?? (prisma as unknown as ApprovalPrismaClient);
  const now = dependencies.now ?? (() => new Date());

  await prismaClient.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({
      where: { id: input.inquiryId },
      select: {
        id: true,
        bridgeWorkflowStatus: true,
        communicationLogs: true
      }
    });

    if (!inquiry) {
      throw approvalError(
        404,
        "LAWBOT_REVIEW_INQUIRY_NOT_FOUND",
        "inquiry_not_found",
        "Inquiry was not found."
      );
    }

    if (inquiry.bridgeWorkflowStatus !== expectedWorkflowStatus) {
      throw approvalError(
        409,
        "LAWBOT_REVIEW_WORKFLOW_STATUS_CONFLICT",
        "workflow_status_conflict",
        "Lawbot review is not pending approval."
      );
    }

    const caseRecord = await tx.caseRecord.findFirst({
      where: { inquiryId: input.inquiryId },
      orderBy: { createdAt: "desc" },
      select: { id: true, bridgeWorkflowStatus: true }
    });

    const [documentDrafts, messageDrafts] = await Promise.all([
      tx.documentDraft.findMany({
        where: {
          inquiryId: input.inquiryId,
          source: "lawbot_bridge",
          status: "APPROVAL_PENDING" satisfies WorkflowDraftStatus
        },
        select: { id: true }
      }),
      tx.messageDraft.findMany({
        where: {
          inquiryId: input.inquiryId,
          source: "lawbot_bridge",
          status: "APPROVAL_PENDING" satisfies WorkflowDraftStatus
        },
        select: { id: true }
      })
    ]);

    if (documentDrafts.length + messageDrafts.length === 0) {
      throw approvalError(
        409,
        "LAWBOT_REVIEW_NO_PENDING_DRAFTS",
        "no_approval_pending_drafts",
        "No approval-pending Lawbot drafts were found."
      );
    }

    const approvedAt = now();
    const approvedDocumentDraftIds = documentDrafts.map((draft) => draft.id);
    const approvedMessageDraftIds = messageDrafts.map((draft) => draft.id);
    const auditEntry = buildAuditEntry({
      operatorNote: input.operatorNote,
      documentDraftIds: approvedDocumentDraftIds,
      messageDraftIds: approvedMessageDraftIds,
      timestamp: approvedAt.toISOString()
    });
    const communicationLogs = [...parseCommunicationLogs(inquiry.communicationLogs), auditEntry];

    await tx.inquiry.update({
      where: { id: input.inquiryId },
      data: {
        bridgeWorkflowStatus: "APPROVED" satisfies BridgeWorkflowStatus,
        communicationLogs: JSON.stringify(communicationLogs)
      }
    });

    if (caseRecord) {
      await tx.caseRecord.update({
        where: { id: caseRecord.id },
        data: {
          bridgeWorkflowStatus: "APPROVED" satisfies BridgeWorkflowStatus
        }
      });
    }

    await Promise.all([
      tx.documentDraft.updateMany({
        where: { id: { in: approvedDocumentDraftIds } },
        data: {
          status: "APPROVED" satisfies WorkflowDraftStatus,
          approvedAt
        }
      }),
      tx.messageDraft.updateMany({
        where: { id: { in: approvedMessageDraftIds } },
        data: {
          status: "APPROVED" satisfies WorkflowDraftStatus,
          approvedAt
        }
      })
    ]);
  });

  const loadReviewResult = dependencies.loadReviewResult ?? loadDefaultReviewResult;
  const reviewResult = await loadReviewResult(input.inquiryId);
  return buildLawbotReviewSafeDto(reviewResult);
}
