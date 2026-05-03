import type {
  BridgeWorkflowStatus,
  WorkflowDraftStatus
} from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";

type MessageSendReadinessStatus =
  | "NOT_APPROVED"
  | "NO_APPROVED_MESSAGE_DRAFTS"
  | "REVIEW_REQUIRED_STILL_TRUE"
  | "MISSING_RECIPIENT"
  | "MISSING_CHANNEL"
  | "MISSING_MESSAGE_METADATA"
  | "DRY_RUN_READY"
  | "BLOCKED";

type MessageSendReadinessReasonCode =
  | MessageSendReadinessStatus
  | "CASE_NOT_APPROVED"
  | "INQUIRY_NOT_FOUND";

type InquiryRow = {
  id: string;
  bridgeWorkflowStatus: BridgeWorkflowStatus;
  email: string | null;
  phone: string | null;
  latestContactChannel: string | null;
};

type CaseRecordRow = {
  id: string;
  caseNumber: string;
  bridgeWorkflowStatus: BridgeWorkflowStatus;
};

type MessageDraftRow = {
  id: string;
  status: WorkflowDraftStatus;
  reviewRequired: boolean;
  messageKind: string;
  subject: string;
  createdAt: Date;
  updatedAt: Date;
};

type MessageSendReadinessPrismaClient = {
  inquiry: {
    findUnique(args: unknown): Promise<InquiryRow | null>;
  };
  caseRecord: {
    findFirst(args: unknown): Promise<CaseRecordRow | null>;
  };
  messageDraft: {
    findMany(args: unknown): Promise<MessageDraftRow[]>;
  };
};

export type LawbotMessageSendReadinessDraftDto = {
  id: string;
  status: string;
  reviewRequired: boolean;
  createdAt: string;
  updatedAt: string;
  readinessStatus: MessageSendReadinessStatus;
  reasonCodes: MessageSendReadinessReasonCode[];
};

export type LawbotMessageSendReadinessDto = {
  inquiryId: string;
  caseId: string | null;
  caseNumber: string | null;
  workflowStatus: string;
  sendReadiness: {
    status: MessageSendReadinessStatus;
    ready: boolean;
    dryRunOnly: true;
    externalActionAllowed: false;
    reasonCodes: MessageSendReadinessReasonCode[];
  };
  messageDrafts: LawbotMessageSendReadinessDraftDto[];
};

export type LawbotMessageSendReadinessDependencies = {
  prismaClient?: MessageSendReadinessPrismaClient;
};

const FORBIDDEN_MOJIBAKE_CHAR_PATTERN = /[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/;

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function safeId(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed || FORBIDDEN_MOJIBAKE_CHAR_PATTERN.test(trimmed)) {
    return fallback;
  }
  return trimmed.replace(/[^a-zA-Z0-9_:-]/g, "_");
}

function safeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || FORBIDDEN_MOJIBAKE_CHAR_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed.replace(/[^a-zA-Z0-9_:-]/g, "_");
}

function uniqueReasonCodes(reasonCodes: MessageSendReadinessReasonCode[]) {
  return [...new Set(reasonCodes)];
}

function firstBlockingStatus(
  reasonCodes: MessageSendReadinessReasonCode[]
): MessageSendReadinessStatus {
  const priority: MessageSendReadinessStatus[] = [
    "NOT_APPROVED",
    "NO_APPROVED_MESSAGE_DRAFTS",
    "REVIEW_REQUIRED_STILL_TRUE",
    "MISSING_RECIPIENT",
    "MISSING_CHANNEL",
    "MISSING_MESSAGE_METADATA",
    "BLOCKED"
  ];

  for (const status of priority) {
    if (reasonCodes.includes(status)) {
      return status;
    }
  }

  return "DRY_RUN_READY";
}

function buildDraftReadiness(input: {
  draft: MessageDraftRow;
  index: number;
  hasRecipientCandidate: boolean;
  hasChannelCandidate: boolean;
}): LawbotMessageSendReadinessDraftDto {
  const reasonCodes: MessageSendReadinessReasonCode[] = [];

  if (input.draft.reviewRequired) {
    reasonCodes.push("REVIEW_REQUIRED_STILL_TRUE");
  }
  if (!input.hasRecipientCandidate) {
    reasonCodes.push("MISSING_RECIPIENT");
  }
  if (!input.hasChannelCandidate) {
    reasonCodes.push("MISSING_CHANNEL");
  }
  if (!hasText(input.draft.messageKind) || !hasText(input.draft.subject)) {
    reasonCodes.push("MISSING_MESSAGE_METADATA");
  }

  const uniqueCodes = uniqueReasonCodes(reasonCodes);
  const readinessStatus = firstBlockingStatus(uniqueCodes);

  return {
    id: safeId(input.draft.id, `message-draft-${input.index + 1}`),
    status: input.draft.status,
    reviewRequired: input.draft.reviewRequired,
    createdAt: input.draft.createdAt.toISOString(),
    updatedAt: input.draft.updatedAt.toISOString(),
    readinessStatus,
    reasonCodes:
      uniqueCodes.length > 0
        ? uniqueCodes
        : (["DRY_RUN_READY"] satisfies MessageSendReadinessReasonCode[])
  };
}

function buildDto(input: {
  inquiry: InquiryRow;
  caseRecord: CaseRecordRow | null;
  drafts: MessageDraftRow[];
}): LawbotMessageSendReadinessDto {
  const reasonCodes: MessageSendReadinessReasonCode[] = [];
  const hasRecipientCandidate = hasText(input.inquiry.email) || hasText(input.inquiry.phone);
  const hasDefaultChannelCandidate = hasText(input.inquiry.latestContactChannel);
  const workflowApproved = input.inquiry.bridgeWorkflowStatus === "APPROVED";
  const caseApproved =
    !input.caseRecord || input.caseRecord.bridgeWorkflowStatus === "APPROVED";

  if (!workflowApproved) {
    reasonCodes.push("NOT_APPROVED");
  }
  if (!caseApproved) {
    reasonCodes.push("NOT_APPROVED", "CASE_NOT_APPROVED");
  }
  if (workflowApproved && caseApproved && input.drafts.length === 0) {
    reasonCodes.push("NO_APPROVED_MESSAGE_DRAFTS");
  }

  const messageDrafts =
    workflowApproved && caseApproved
      ? input.drafts.map((draft, index) =>
          buildDraftReadiness({
            draft,
            index,
            hasRecipientCandidate,
            hasChannelCandidate: hasDefaultChannelCandidate || hasText(draft.messageKind)
          })
        )
      : [];

  for (const draft of messageDrafts) {
    reasonCodes.push(
      ...draft.reasonCodes.filter(
        (reasonCode) => reasonCode !== "DRY_RUN_READY"
      )
    );
  }

  const uniqueCodes = uniqueReasonCodes(reasonCodes);
  const status = firstBlockingStatus(uniqueCodes);
  const ready = status === "DRY_RUN_READY" && messageDrafts.length > 0;

  return {
    inquiryId: safeId(input.inquiry.id, "unknown-inquiry"),
    caseId: input.caseRecord ? safeId(input.caseRecord.id, "unknown-case") : null,
    caseNumber: safeNullableText(input.caseRecord?.caseNumber),
    workflowStatus: input.inquiry.bridgeWorkflowStatus,
    sendReadiness: {
      status,
      ready,
      dryRunOnly: true,
      externalActionAllowed: false,
      reasonCodes:
        uniqueCodes.length > 0
          ? uniqueCodes
          : (["DRY_RUN_READY"] satisfies MessageSendReadinessReasonCode[])
    },
    messageDrafts
  };
}

export async function getLawbotMessageSendReadiness(
  inquiryId: string,
  dependencies: LawbotMessageSendReadinessDependencies = {}
): Promise<LawbotMessageSendReadinessDto | null> {
  const prismaClient =
    dependencies.prismaClient ?? (prisma as unknown as MessageSendReadinessPrismaClient);

  const inquiry = await prismaClient.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      bridgeWorkflowStatus: true,
      email: true,
      phone: true,
      latestContactChannel: true
    }
  });

  if (!inquiry) {
    return null;
  }

  const [caseRecord, drafts] = await Promise.all([
    prismaClient.caseRecord.findFirst({
      where: { inquiryId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        caseNumber: true,
        bridgeWorkflowStatus: true
      }
    }),
    prismaClient.messageDraft.findMany({
      where: {
        inquiryId,
        source: "lawbot_bridge",
        status: "APPROVED" satisfies WorkflowDraftStatus
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        reviewRequired: true,
        messageKind: true,
        subject: true,
        createdAt: true,
        updatedAt: true
      }
    })
  ]);

  return buildDto({ inquiry, caseRecord, drafts });
}
