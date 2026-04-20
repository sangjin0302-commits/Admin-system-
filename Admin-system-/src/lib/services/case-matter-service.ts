import type {
  CaseMatterStatus,
  InquiryStatus,
  InquiryType,
  Prisma,
  RiskLevel,
  UrgencyLevel
} from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import {
  deriveCaseMatterNextAction,
  type CaseMatterNextAction
} from "@/lib/services/case-matter-next-action-helpers";
import { generateCaseMatterNumberTx } from "@/lib/services/case-matter-number-helpers";
import {
  assertCaseMatterTransition,
  getAllowedCaseMatterTransitions
} from "@/lib/services/case-matter-status-transition-helpers";

const operationalInclude = {
  tasks: {
    select: {
      title: true,
      status: true,
      priority: true,
      dueDate: true
    }
  },
  requiredDocuments: {
    select: {
      name: true,
      required: true,
      status: true,
      dueDate: true
    }
  },
  submissions: {
    select: {
      status: true,
      submittedAt: true
    }
  },
  supplementRequests: {
    select: {
      title: true,
      status: true,
      dueDate: true
    }
  }
} as const;

type CaseMatterOperationalRecord = Prisma.CaseMatterGetPayload<{
  include: typeof operationalInclude;
}>;

export type CaseMatterWithNextAction = CaseMatterOperationalRecord & {
  nextAction: CaseMatterNextAction;
};

export type ConvertInquiryToCaseMatterInput = {
  inquiryId: string;
  title?: string | null;
  matterType?: string | null;
  assignedTo?: string | null;
  actorName?: string | null;
  forceCreate?: boolean;
  updateInquiryStatusToWon?: boolean;
};

export type UpdateCaseMatterStatusInput = {
  caseMatterId: string;
  status: CaseMatterStatus;
  actorName?: string | null;
  statusChangeNote?: string | null;
  expectedUpdatedAt?: string | null;
};

export type ConvertInquiryToCaseMatterResult = {
  created: boolean;
  caseMatter: CaseMatterWithNextAction;
  linkedQuoteId: string | null;
  linkedContractDraftId: string | null;
};

export class CaseMatterConversionError extends Error {
  code: "INQUIRY_NOT_FOUND" | "CASE_MATTER_NOT_FOUND";

  constructor(code: "INQUIRY_NOT_FOUND" | "CASE_MATTER_NOT_FOUND", message: string) {
    super(message);
    this.code = code;
  }
}

export class CaseMatterStatusGuardError extends Error {
  blockers: string[];

  constructor(message: string, blockers: string[]) {
    super(message);
    this.name = "CaseMatterStatusGuardError";
    this.blockers = blockers;
  }
}

export class CaseMatterConcurrentUpdateError extends Error {
  currentUpdatedAt: string;

  constructor(message: string, currentUpdatedAt: string) {
    super(message);
    this.name = "CaseMatterConcurrentUpdateError";
    this.currentUpdatedAt = currentUpdatedAt;
  }
}

function inferMatterTypeFromInquiry(inquiryType: InquiryType) {
  const map: Record<InquiryType, string> = {
    FOREIGNER_VISA: "immigration_visa",
    IMMIGRATION_STAY: "immigration_stay",
    APOSTILLE_CONSULAR: "apostille_consular",
    TRANSLATION_NOTARY: "translation_notary",
    GENERAL_ADMIN_CIVIL: "general_admin",
    CORPORATE_REQUEST: "corporate_admin",
    UNKNOWN: "unknown_admin"
  };
  return map[inquiryType];
}

function inferCaseMatterStatus(inquiryStatus: InquiryStatus): CaseMatterStatus {
  if (inquiryStatus === "WON") return "OPEN";
  if (inquiryStatus === "CLOSED") return "CLOSED";
  if (inquiryStatus === "ON_HOLD") return "ON_HOLD";
  if (["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(inquiryStatus)) {
    return "CONTRACT_PENDING";
  }
  if (["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(inquiryStatus)) {
    return "CONSULTING";
  }
  return "INTAKE_REVIEW";
}

function inferPriority(urgency: UrgencyLevel) {
  if (urgency === "CRITICAL") return "URGENT" as const;
  if (urgency === "HIGH") return "HIGH" as const;
  if (urgency === "LOW") return "LOW" as const;
  return "NORMAL" as const;
}

function inferRiskLevel(urgency: UrgencyLevel): RiskLevel {
  if (urgency === "CRITICAL") return "CRITICAL";
  if (urgency === "HIGH") return "HIGH";
  if (urgency === "LOW") return "LOW";
  return "NORMAL";
}

function attachNextAction(caseMatter: CaseMatterOperationalRecord): CaseMatterWithNextAction {
  return {
    ...caseMatter,
    nextAction: deriveCaseMatterNextAction({
      status: caseMatter.status,
      dueDate: caseMatter.dueDate,
      nextActionAt: caseMatter.nextActionAt,
      tasks: caseMatter.tasks,
      requiredDocuments: caseMatter.requiredDocuments,
      submissions: caseMatter.submissions,
      supplementRequests: caseMatter.supplementRequests
    })
  };
}

async function getCaseMatterOperationalByIdTx(
  tx: Prisma.TransactionClient,
  caseMatterId: string
): Promise<CaseMatterOperationalRecord | null> {
  return tx.caseMatter.findUnique({
    where: { id: caseMatterId },
    include: operationalInclude
  });
}

export async function listCaseMattersForInquiry(inquiryId: string) {
  const caseMatters = await prisma.caseMatter.findMany({
    where: { inquiryId },
    include: operationalInclude,
    orderBy: [{ createdAt: "desc" }]
  });

  return caseMatters.map(attachNextAction);
}

export async function getLatestCaseMatterForInquiry(inquiryId: string) {
  const caseMatter = await prisma.caseMatter.findFirst({
    where: { inquiryId },
    include: operationalInclude,
    orderBy: [{ createdAt: "desc" }]
  });

  if (!caseMatter) return null;
  return attachNextAction(caseMatter);
}

export async function convertInquiryToCaseMatter(
  input: ConvertInquiryToCaseMatterInput
): Promise<ConvertInquiryToCaseMatterResult> {
  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({
      where: { id: input.inquiryId },
      select: {
        id: true,
        status: true,
        inquiryType: true,
        urgencyLevel: true,
        contactName: true,
        organizationName: true,
        email: true,
        phone: true,
        nationality: true,
        title: true,
        description: true,
        generatedSummary: true,
        dueDate: true,
        assignee: true,
        internalMemo: true,
        caseMatters: {
          orderBy: [{ createdAt: "desc" }],
          take: 1,
          select: { id: true }
        }
      }
    });

    if (!inquiry) {
      throw new CaseMatterConversionError("INQUIRY_NOT_FOUND", "Inquiry not found.");
    }

    const existingCaseMatterId = inquiry.caseMatters[0]?.id ?? null;
    if (existingCaseMatterId && !input.forceCreate) {
      const existingCaseMatter = await getCaseMatterOperationalByIdTx(tx, existingCaseMatterId);
      if (!existingCaseMatter) {
        throw new CaseMatterConversionError(
          "CASE_MATTER_NOT_FOUND",
          "Case matter lookup failed for the existing conversion result."
        );
      }

      return {
        created: false,
        caseMatter: attachNextAction(existingCaseMatter),
        linkedQuoteId: null,
        linkedContractDraftId: null
      };
    }

    const matterType = input.matterType?.trim() || inferMatterTypeFromInquiry(inquiry.inquiryType);
    const title =
      input.title?.trim() ||
      `${inquiry.contactName}${inquiry.organizationName ? ` (${inquiry.organizationName})` : ""} / ${inquiry.title}`;
    const assignedTo = input.assignedTo?.trim() || inquiry.assignee || null;
    const caseNo = await generateCaseMatterNumberTx(tx, matterType);

    const createdCaseMatter = await tx.caseMatter.create({
      data: {
        caseNo,
        title,
        matterType,
        status: inferCaseMatterStatus(inquiry.status),
        priority: inferPriority(inquiry.urgencyLevel),
        riskLevel: inferRiskLevel(inquiry.urgencyLevel),
        inquiryId: inquiry.id,
        openedAt: new Date(),
        dueDate: inquiry.dueDate,
        nextActionAt: inquiry.dueDate,
        assignedTo,
        summary: inquiry.generatedSummary,
        internalMemo: inquiry.internalMemo
      }
    });

    await tx.caseParty.create({
      data: {
        caseId: createdCaseMatter.id,
        role: "CLIENT",
        name: inquiry.contactName,
        email: inquiry.email,
        phone: inquiry.phone,
        organization: inquiry.organizationName,
        nationality: inquiry.nationality
      }
    });

    await tx.caseTask.create({
      data: {
        caseId: createdCaseMatter.id,
        title: "Review intake facts and open document checklist",
        status: "TODO",
        priority: inferPriority(inquiry.urgencyLevel),
        dueDate: inquiry.dueDate,
        assignedTo
      }
    });

    await tx.caseEvent.create({
      data: {
        caseId: createdCaseMatter.id,
        eventType: "CASE_CONVERTED_FROM_INQUIRY",
        actorName: input.actorName?.trim() || "system",
        message: `Case created from inquiry ${inquiry.id}`,
        payloadJson: JSON.stringify({
          inquiryStatus: inquiry.status,
          inquiryType: inquiry.inquiryType,
          urgencyLevel: inquiry.urgencyLevel
        })
      }
    });

    const acceptedQuote = await tx.quote.findFirst({
      where: {
        inquiryId: inquiry.id,
        status: "ACCEPTED",
        caseMatterId: null
      },
      orderBy: [{ createdAt: "desc" }]
    });

    if (acceptedQuote) {
      await tx.quote.update({
        where: { id: acceptedQuote.id },
        data: { caseMatterId: createdCaseMatter.id }
      });
    }

    const linkedContractDraft = acceptedQuote
      ? await tx.contractDraft.findFirst({
          where: {
            inquiryId: inquiry.id,
            quoteId: acceptedQuote.id,
            caseMatterId: null
          },
          orderBy: [{ createdAt: "desc" }]
        })
      : null;

    if (linkedContractDraft) {
      await tx.contractDraft.update({
        where: { id: linkedContractDraft.id },
        data: { caseMatterId: createdCaseMatter.id }
      });
    }

    if (input.updateInquiryStatusToWon && inquiry.status !== "WON" && inquiry.status !== "CLOSED") {
      await tx.inquiry.update({
        where: { id: inquiry.id },
        data: { status: "WON" }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, createdCaseMatter.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Created case matter could not be loaded."
      );
    }

    return {
      created: true,
      caseMatter: attachNextAction(caseMatter),
      linkedQuoteId: acceptedQuote?.id ?? null,
      linkedContractDraftId: linkedContractDraft?.id ?? null
    };
  });
}

function normalizeExpectedUpdatedAt(raw?: string | null) {
  if (!raw?.trim()) return null;
  const expectedDate = new Date(raw);
  const expectedMs = expectedDate.getTime();
  if (!Number.isFinite(expectedMs)) {
    throw new Error("Invalid expectedUpdatedAt format.");
  }
  return expectedDate;
}

export async function updateCaseMatterStatus(input: UpdateCaseMatterStatusInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        closedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    if (snapshot.status !== input.status) {
      try {
        assertCaseMatterTransition(snapshot.status, input.status);
      } catch {
        const allowedTransitions = getAllowedCaseMatterTransitions(snapshot.status);
        throw new CaseMatterStatusGuardError(
          `Cannot change case status from ${snapshot.status} to ${input.status}.`,
          [`Allowed next statuses: ${allowedTransitions.join(", ")}`]
        );
      }
    }

    const statusChangeNote = input.statusChangeNote?.trim() || null;
    const closedAt =
      input.status === "CLOSED" || input.status === "CANCELLED"
        ? snapshot.closedAt ?? new Date()
        : null;

    if (snapshot.status !== input.status) {
      await tx.caseMatter.update({
        where: { id: snapshot.id },
        data: {
          status: input.status,
          closedAt
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.id,
          eventType: "CASE_STATUS_CHANGED",
          actorName: input.actorName?.trim() || "system",
          message: statusChangeNote
            ? `Case status changed: ${snapshot.status} -> ${input.status} (${statusChangeNote})`
            : `Case status changed: ${snapshot.status} -> ${input.status}`,
          payloadJson: JSON.stringify({
            previousStatus: snapshot.status,
            nextStatus: input.status,
            statusChangeNote
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after status update."
      );
    }

    return attachNextAction(caseMatter);
  });
}
