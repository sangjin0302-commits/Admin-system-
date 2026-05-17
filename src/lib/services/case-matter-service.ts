import type {
  AccountingFeeStatus,
  AccountingPaymentStatus,
  CaseMatterStatus,
  CaseTaskPriority,
  CaseTaskStatus,
  InquiryStatus,
  InquiryType,
  Prisma,
  RequiredDocumentStatus,
  RiskLevel,
  SupplementStatus,
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
import {
  assertRequiredDocumentTransition,
  getAllowedRequiredDocumentTransitions
} from "@/lib/services/required-document-status-transition-helpers";
import { buildRequiredDocumentChecklistStarterPlan } from "@/lib/services/required-document-checklist-starter";

const operationalInclude = {
  tasks: {
    select: {
      id: true,
      title: true,
      details: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      assignedTo: true,
      completedAt: true,
      updatedAt: true
    }
  },
  requiredDocuments: {
    select: {
      id: true,
      name: true,
      description: true,
      required: true,
      status: true,
      dueDate: true,
      updatedAt: true
    }
  },
  parties: {
    select: {
      id: true,
      role: true,
      name: true,
      phone: true,
      email: true,
      organization: true,
      nationality: true,
      memo: true
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  },
  inquiry: {
    select: {
      id: true,
      title: true,
      contactName: true,
      email: true,
      phone: true,
      inquiryType: true,
      urgencyLevel: true,
      publicTrackingCode: true
    }
  },
  submissionPackages: {
    select: {
      id: true,
      title: true,
      status: true,
      targetAgency: true,
      targetOffice: true,
      preparedAt: true,
      reviewedAt: true,
      lockedAt: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  },
  submissions: {
    select: {
      id: true,
      agencyName: true,
      officeName: true,
      method: true,
      status: true,
      submittedAt: true,
      receiptNo: true,
      resultStatus: true,
      resultReceivedAt: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  },
  supplementRequests: {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      dueDate: true,
      receivedAt: true,
      respondedAt: true,
      requestedDocsJson: true,
      responseNote: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  },
  events: {
    select: {
      id: true,
      eventType: true,
      actorName: true,
      message: true,
      createdAt: true
    },
    orderBy: [{ createdAt: "desc" }],
    take: 30
  },
  accountingMemo: {
    select: {
      id: true,
      feeAmount: true,
      feeStatus: true,
      paymentStatus: true,
      paidAmount: true,
      paidAt: true,
      paymentMemo: true,
      invoiceMemo: true,
      ledgerMemo: true,
      createdAt: true,
      updatedAt: true
    }
  },
  immigrationDetail: {
    select: {
      id: true,
      dispositionType: true,
      dispositionDate: true,
      noticeDate: true,
      serviceDate: true,
      appealDeadline: true,
      departureDeadline: true,
      detentionStartDate: true,
      stayExpiryDate: true,
      submissionDeadline: true,
      supplementDeadline: true,
      resultExpectedDate: true,
      nationality: true,
      currentStayStatus: true,
      familyInKoreaSummary: true,
      residenceBaseSummary: true,
      employmentOrSchoolSummary: true,
      violationHistorySummary: true,
      scopeReviewRequired: true,
      attorneyScopeRisk: true,
      officialFormCheckRequired: true,
      deadlineVerifiedAt: true,
      verifiedBy: true,
      createdAt: true,
      updatedAt: true
    }
  },
  quotes: {
    select: {
      status: true,
      totalMin: true,
      totalMax: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  },
  contractDrafts: {
    select: {
      status: true,
      updatedAt: true
    },
    orderBy: [{ updatedAt: "desc" }]
  }
} satisfies Prisma.CaseMatterInclude;

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

export type UpdateRequiredDocumentStatusInput = {
  caseMatterId: string;
  requiredDocumentId: string;
  status: RequiredDocumentStatus;
  actorName?: string | null;
  statusChangeNote?: string | null;
  expectedUpdatedAt?: string | null;
};

export type UpdateRequiredDocumentMetadataInput = {
  caseMatterId: string;
  requiredDocumentId: string;
  name: string;
  description?: string | null;
  required: boolean;
  dueDate?: string | null;
  actorName?: string | null;
  expectedUpdatedAt?: string | null;
  expectedCaseUpdatedAt?: string | null;
};

export type CreateRequiredDocumentInput = {
  caseMatterId: string;
  name: string;
  description?: string | null;
  required?: boolean;
  dueDate?: string | null;
  actorName?: string | null;
  expectedCaseUpdatedAt?: string | null;
};

export type StartRequiredDocumentChecklistInput = {
  caseMatterId: string;
  actorName?: string | null;
  expectedCaseUpdatedAt?: string | null;
};

export type StartRequiredDocumentChecklistResult = {
  caseMatter: CaseMatterWithNextAction;
  createdCount: number;
  skippedCount: number;
};

export type CreateCaseTaskInput = {
  caseMatterId: string;
  title: string;
  details?: string | null;
  description?: string | null;
  status?: CaseTaskStatus;
  priority?: CaseTaskPriority;
  dueDate?: string | null;
  assignedTo?: string | null;
  actorName?: string | null;
  expectedCaseUpdatedAt?: string | null;
};

export type UpdateCaseTaskMetadataInput = {
  caseMatterId: string;
  taskId: string;
  title: string;
  details?: string | null;
  description?: string | null;
  priority: CaseTaskPriority;
  dueDate?: string | null;
  assignedTo?: string | null;
  actorName?: string | null;
  expectedUpdatedAt?: string | null;
};

export type UpdateCaseTaskStatusInput = {
  caseMatterId: string;
  taskId: string;
  status: CaseTaskStatus;
  statusChangeNote?: string | null;
  actorName?: string | null;
  expectedUpdatedAt?: string | null;
};

export type CreateSupplementRequestInput = {
  caseMatterId: string;
  title: string;
  description?: string | null;
  receivedAt?: string | null;
  dueDate?: string | null;
  requestedDocsJson?: string | null;
  responseNote?: string | null;
  actorName?: string | null;
  expectedCaseUpdatedAt?: string | null;
};

export type UpdateSupplementRequestMetadataInput = {
  caseMatterId: string;
  supplementRequestId: string;
  title: string;
  description?: string | null;
  receivedAt?: string | null;
  dueDate?: string | null;
  requestedDocsJson?: string | null;
  responseNote?: string | null;
  actorName?: string | null;
  expectedUpdatedAt?: string | null;
};

export type UpdateSupplementRequestStatusInput = {
  caseMatterId: string;
  supplementRequestId: string;
  status: SupplementStatus;
  statusChangeNote?: string | null;
  responseNote?: string | null;
  respondedAt?: string | null;
  actorName?: string | null;
  expectedUpdatedAt?: string | null;
};

export type UpdateCaseAccountingMemoInput = {
  caseMatterId: string;
  feeAmount?: number | null;
  feeStatus?: AccountingFeeStatus;
  paymentStatus?: AccountingPaymentStatus;
  paidAmount?: number | null;
  paidAt?: string | null;
  paymentMemo?: string | null;
  invoiceMemo?: string | null;
  ledgerMemo?: string | null;
  actorName?: string | null;
  expectedUpdatedAt?: string | null;
  expectedCaseUpdatedAt?: string | null;
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

export class RequiredDocumentStatusGuardError extends Error {
  blockers: string[];

  constructor(message: string, blockers: string[]) {
    super(message);
    this.name = "RequiredDocumentStatusGuardError";
    this.blockers = blockers;
  }
}

export class RequiredDocumentConcurrentUpdateError extends Error {
  currentUpdatedAt: string;

  constructor(message: string, currentUpdatedAt: string) {
    super(message);
    this.name = "RequiredDocumentConcurrentUpdateError";
    this.currentUpdatedAt = currentUpdatedAt;
  }
}

export class RequiredDocumentUpdateError extends Error {
  code:
    | "REQUIRED_DOCUMENT_NOT_FOUND"
    | "CASE_MATTER_MISMATCH"
    | "REQUIRED_DOCUMENT_NAME_EMPTY"
    | "REQUIRED_DOCUMENT_DUPLICATE"
    | "INVALID_DUE_DATE_FORMAT";

  constructor(
    code:
      | "REQUIRED_DOCUMENT_NOT_FOUND"
      | "CASE_MATTER_MISMATCH"
      | "REQUIRED_DOCUMENT_NAME_EMPTY"
      | "REQUIRED_DOCUMENT_DUPLICATE"
      | "INVALID_DUE_DATE_FORMAT",
    message: string
  ) {
    super(message);
    this.name = "RequiredDocumentUpdateError";
    this.code = code;
  }
}

export class RequiredDocumentCreateError extends Error {
  code:
    | "REQUIRED_DOCUMENT_NAME_EMPTY"
    | "REQUIRED_DOCUMENT_DUPLICATE"
    | "INVALID_DUE_DATE_FORMAT";

  constructor(
    code:
      | "REQUIRED_DOCUMENT_NAME_EMPTY"
      | "REQUIRED_DOCUMENT_DUPLICATE"
      | "INVALID_DUE_DATE_FORMAT",
    message: string
  ) {
    super(message);
    this.name = "RequiredDocumentCreateError";
    this.code = code;
  }
}

export class CaseTaskConcurrentUpdateError extends Error {
  currentUpdatedAt: string;

  constructor(message: string, currentUpdatedAt: string) {
    super(message);
    this.name = "CaseTaskConcurrentUpdateError";
    this.currentUpdatedAt = currentUpdatedAt;
  }
}

export class CaseTaskCreateError extends Error {
  code: "CASE_TASK_TITLE_EMPTY" | "INVALID_DUE_DATE_FORMAT";

  constructor(code: "CASE_TASK_TITLE_EMPTY" | "INVALID_DUE_DATE_FORMAT", message: string) {
    super(message);
    this.name = "CaseTaskCreateError";
    this.code = code;
  }
}

export class CaseTaskUpdateError extends Error {
  code: "CASE_TASK_NOT_FOUND" | "CASE_MATTER_MISMATCH" | "CASE_TASK_TITLE_EMPTY" | "INVALID_DUE_DATE_FORMAT";

  constructor(
    code: "CASE_TASK_NOT_FOUND" | "CASE_MATTER_MISMATCH" | "CASE_TASK_TITLE_EMPTY" | "INVALID_DUE_DATE_FORMAT",
    message: string
  ) {
    super(message);
    this.name = "CaseTaskUpdateError";
    this.code = code;
  }
}

export class SupplementRequestConcurrentUpdateError extends Error {
  currentUpdatedAt: string;

  constructor(message: string, currentUpdatedAt: string) {
    super(message);
    this.name = "SupplementRequestConcurrentUpdateError";
    this.currentUpdatedAt = currentUpdatedAt;
  }
}

export class SupplementRequestCreateError extends Error {
  code: "SUPPLEMENT_REQUEST_TITLE_EMPTY" | "INVALID_DUE_DATE_FORMAT" | "INVALID_RECEIVED_AT_FORMAT";

  constructor(
    code: "SUPPLEMENT_REQUEST_TITLE_EMPTY" | "INVALID_DUE_DATE_FORMAT" | "INVALID_RECEIVED_AT_FORMAT",
    message: string
  ) {
    super(message);
    this.name = "SupplementRequestCreateError";
    this.code = code;
  }
}

export class SupplementRequestUpdateError extends Error {
  code:
    | "SUPPLEMENT_REQUEST_NOT_FOUND"
    | "CASE_MATTER_MISMATCH"
    | "SUPPLEMENT_REQUEST_TITLE_EMPTY"
    | "INVALID_DUE_DATE_FORMAT"
    | "INVALID_RECEIVED_AT_FORMAT"
    | "INVALID_RESPONDED_AT_FORMAT";

  constructor(
    code:
      | "SUPPLEMENT_REQUEST_NOT_FOUND"
      | "CASE_MATTER_MISMATCH"
      | "SUPPLEMENT_REQUEST_TITLE_EMPTY"
      | "INVALID_DUE_DATE_FORMAT"
      | "INVALID_RECEIVED_AT_FORMAT"
      | "INVALID_RESPONDED_AT_FORMAT",
    message: string
  ) {
    super(message);
    this.name = "SupplementRequestUpdateError";
    this.code = code;
  }
}

export class CaseAccountingMemoConcurrentUpdateError extends Error {
  currentUpdatedAt: string;

  constructor(message: string, currentUpdatedAt: string) {
    super(message);
    this.name = "CaseAccountingMemoConcurrentUpdateError";
    this.currentUpdatedAt = currentUpdatedAt;
  }
}

export class CaseAccountingMemoUpdateError extends Error {
  code: "ACCOUNTING_MEMO_NOT_FOUND" | "CASE_MATTER_MISMATCH" | "INVALID_PAID_AT_FORMAT";

  constructor(
    code: "ACCOUNTING_MEMO_NOT_FOUND" | "CASE_MATTER_MISMATCH" | "INVALID_PAID_AT_FORMAT",
    message: string
  ) {
    super(message);
    this.name = "CaseAccountingMemoUpdateError";
    this.code = code;
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

function normalizeDocumentName(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

function normalizeTaskTitle(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

function normalizeSupplementTitle(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

function normalizeAccountingMemo(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeDocumentNameKey(value: string) {
  return normalizeDocumentName(value).toLocaleLowerCase("en-US");
}

function parseOptionalDueDate(raw?: string | null) {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new RequiredDocumentCreateError(
      "INVALID_DUE_DATE_FORMAT",
      "Invalid required document dueDate format."
    );
  }
  return parsed;
}

function parseOptionalRequiredDocumentUpdateDueDate(raw?: string | null) {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new RequiredDocumentUpdateError(
      "INVALID_DUE_DATE_FORMAT",
      "Invalid required document dueDate format."
    );
  }
  return parsed;
}

function parseOptionalCaseTaskCreateDueDate(raw?: string | null) {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new CaseTaskCreateError("INVALID_DUE_DATE_FORMAT", "Invalid case task dueDate format.");
  }
  return parsed;
}

function parseOptionalCaseTaskUpdateDueDate(raw?: string | null) {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new CaseTaskUpdateError("INVALID_DUE_DATE_FORMAT", "Invalid case task dueDate format.");
  }
  return parsed;
}

function parseSupplementCreateDate(
  raw: string | null | undefined,
  field: "dueDate" | "receivedAt"
) {
  if (!raw?.trim()) return field === "receivedAt" ? new Date() : null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new SupplementRequestCreateError(
      field === "receivedAt" ? "INVALID_RECEIVED_AT_FORMAT" : "INVALID_DUE_DATE_FORMAT",
      `Invalid supplement request ${field} format.`
    );
  }
  return parsed;
}

function parseOptionalSupplementUpdateDate(
  raw: string | null | undefined,
  field: "dueDate" | "receivedAt" | "respondedAt"
) {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    const code =
      field === "receivedAt"
        ? "INVALID_RECEIVED_AT_FORMAT"
        : field === "respondedAt"
          ? "INVALID_RESPONDED_AT_FORMAT"
          : "INVALID_DUE_DATE_FORMAT";
    throw new SupplementRequestUpdateError(
      code,
      `Invalid supplement request ${field} format.`
    );
  }
  return parsed;
}

function parseOptionalAccountingPaidAt(raw?: string | null) {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new CaseAccountingMemoUpdateError(
      "INVALID_PAID_AT_FORMAT",
      "Invalid accounting paidAt format."
    );
  }
  return parsed;
}

function sameOptionalDate(left: Date | null, right: Date | null) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.getTime() === right.getTime();
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

export async function listCaseMatters() {
  const caseMatters = await prisma.caseMatter.findMany({
    include: operationalInclude,
    orderBy: [{ updatedAt: "desc" }]
  });

  return caseMatters.map(attachNextAction);
}

export async function getCaseMatterById(caseMatterId: string) {
  const caseMatter = await prisma.caseMatter.findUnique({
    where: { id: caseMatterId },
    include: operationalInclude
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

export async function updateRequiredDocumentStatus(input: UpdateRequiredDocumentStatusInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.requiredDocument.findUnique({
      where: { id: input.requiredDocumentId },
      select: {
        id: true,
        caseId: true,
        name: true,
        status: true,
        updatedAt: true,
        requestedAt: true,
        receivedAt: true,
        reviewedAt: true
      }
    });

    if (!snapshot) {
      throw new RequiredDocumentUpdateError(
        "REQUIRED_DOCUMENT_NOT_FOUND",
        "Required document not found."
      );
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new RequiredDocumentUpdateError(
        "CASE_MATTER_MISMATCH",
        "Required document does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new RequiredDocumentConcurrentUpdateError(
        "Required document was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    if (snapshot.status !== input.status) {
      try {
        assertRequiredDocumentTransition(snapshot.status, input.status);
      } catch {
        const allowedTransitions = getAllowedRequiredDocumentTransitions(snapshot.status);
        throw new RequiredDocumentStatusGuardError(
          `Cannot change required document status from ${snapshot.status} to ${input.status}.`,
          [`Allowed next statuses: ${allowedTransitions.join(", ")}`]
        );
      }
    }

    const statusChangeNote = input.statusChangeNote?.trim() || null;
    const now = new Date();

    if (snapshot.status !== input.status) {
      await tx.requiredDocument.update({
        where: { id: snapshot.id },
        data: {
          status: input.status,
          requestedAt:
            input.status === "REQUESTED" ? snapshot.requestedAt ?? now : snapshot.requestedAt,
          receivedAt: input.status === "RECEIVED" ? snapshot.receivedAt ?? now : snapshot.receivedAt,
          reviewedAt:
            input.status === "IN_REVIEW" || input.status === "APPROVED" || input.status === "NEEDS_FIX"
              ? snapshot.reviewedAt ?? now
              : snapshot.reviewedAt
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.caseId,
          eventType: "REQUIRED_DOCUMENT_STATUS_CHANGED",
          actorName: input.actorName?.trim() || "system",
          message: statusChangeNote
            ? `Required document status changed: ${snapshot.name} (${snapshot.status} -> ${input.status}) (${statusChangeNote})`
            : `Required document status changed: ${snapshot.name} (${snapshot.status} -> ${input.status})`,
          payloadJson: JSON.stringify({
            requiredDocumentId: snapshot.id,
            requiredDocumentName: snapshot.name,
            previousStatus: snapshot.status,
            nextStatus: input.status,
            statusChangeNote
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.caseId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after required document status update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateRequiredDocumentMetadata(input: UpdateRequiredDocumentMetadataInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.requiredDocument.findUnique({
      where: { id: input.requiredDocumentId },
      select: {
        id: true,
        caseId: true,
        name: true,
        description: true,
        required: true,
        dueDate: true,
        updatedAt: true,
        caseMatter: {
          select: {
            updatedAt: true
          }
        }
      }
    });

    if (!snapshot) {
      throw new RequiredDocumentUpdateError(
        "REQUIRED_DOCUMENT_NOT_FOUND",
        "Required document not found."
      );
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new RequiredDocumentUpdateError(
        "CASE_MATTER_MISMATCH",
        "Required document does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new RequiredDocumentConcurrentUpdateError(
        "Required document was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
    if (
      expectedCaseUpdatedAt &&
      expectedCaseUpdatedAt.getTime() !== snapshot.caseMatter.updatedAt.getTime()
    ) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.caseMatter.updatedAt.toISOString()
      );
    }

    const name = normalizeDocumentName(input.name);
    if (!name) {
      throw new RequiredDocumentUpdateError(
        "REQUIRED_DOCUMENT_NAME_EMPTY",
        "Required document name must not be empty."
      );
    }

    if (normalizeDocumentNameKey(name) !== normalizeDocumentNameKey(snapshot.name)) {
      const existing = await tx.requiredDocument.findMany({
        where: {
          caseId: snapshot.caseId,
          id: {
            not: snapshot.id
          },
          status: {
            not: "NOT_APPLICABLE"
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      if (existing.some((item) => normalizeDocumentNameKey(item.name) === normalizeDocumentNameKey(name))) {
        throw new RequiredDocumentUpdateError(
          "REQUIRED_DOCUMENT_DUPLICATE",
          "A required document with the same name already exists for this case."
        );
      }
    }

    const description = input.description?.trim() || null;
    const dueDate = parseOptionalRequiredDocumentUpdateDueDate(input.dueDate);
    const changes: string[] = [];

    if (snapshot.name !== name) changes.push("name");
    if ((snapshot.description ?? null) !== description) changes.push("description");
    if (snapshot.required !== input.required) changes.push("required");
    if (!sameOptionalDate(snapshot.dueDate, dueDate)) changes.push("dueDate");

    if (changes.length > 0) {
      await tx.requiredDocument.update({
        where: { id: snapshot.id },
        data: {
          name,
          description,
          required: input.required,
          dueDate
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.caseId,
          eventType: "REQUIRED_DOCUMENT_METADATA_UPDATED",
          actorName: input.actorName?.trim() || "system",
          message: `Required document metadata updated: ${snapshot.name} (${changes.join(", ")})`,
          payloadJson: JSON.stringify({
            requiredDocumentId: snapshot.id,
            changedFields: changes,
            previous: {
              name: snapshot.name,
              description: snapshot.description,
              required: snapshot.required,
              dueDate: snapshot.dueDate?.toISOString() ?? null
            },
            next: {
              name,
              description,
              required: input.required,
              dueDate: dueDate?.toISOString() ?? null
            }
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.caseId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after required document metadata update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function createRequiredDocument(input: CreateRequiredDocumentInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
    if (expectedCaseUpdatedAt && expectedCaseUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const name = normalizeDocumentName(input.name);
    if (!name) {
      throw new RequiredDocumentCreateError(
        "REQUIRED_DOCUMENT_NAME_EMPTY",
        "Required document name must not be empty."
      );
    }

    const existing = await tx.requiredDocument.findFirst({
      where: {
        caseId: snapshot.id,
        name,
        status: {
          not: "NOT_APPLICABLE"
        }
      },
      select: {
        id: true
      }
    });

    if (existing) {
      throw new RequiredDocumentCreateError(
        "REQUIRED_DOCUMENT_DUPLICATE",
        "A required document with the same name already exists for this case."
      );
    }

    const dueDate = parseOptionalDueDate(input.dueDate);

    const created = await tx.requiredDocument.create({
      data: {
        caseId: snapshot.id,
        name,
        description: input.description?.trim() || null,
        required: input.required ?? true,
        status: "NEEDED",
        dueDate
      }
    });

    await tx.caseEvent.create({
      data: {
        caseId: snapshot.id,
        eventType: "REQUIRED_DOCUMENT_CREATED",
        actorName: input.actorName?.trim() || "system",
        message: `Required document created: ${created.name}`,
        payloadJson: JSON.stringify({
          requiredDocumentId: created.id,
          requiredDocumentName: created.name,
          required: created.required,
          dueDate: created.dueDate?.toISOString() ?? null
        })
      }
    });

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after required document creation."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function createCaseTask(input: CreateCaseTaskInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        inquiryId: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
    if (expectedCaseUpdatedAt && expectedCaseUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const title = normalizeTaskTitle(input.title);
    if (!title) {
      throw new CaseTaskCreateError("CASE_TASK_TITLE_EMPTY", "Case task title must not be empty.");
    }

    const dueDate = parseOptionalCaseTaskCreateDueDate(input.dueDate);
    const created = await tx.caseTask.create({
      data: {
        caseId: snapshot.id,
        inquiryId: snapshot.inquiryId,
        title,
        details: input.details?.trim() || null,
        description: input.description?.trim() || null,
        status: input.status ?? "TODO",
        priority: input.priority ?? "NORMAL",
        dueDate,
        assignedTo: input.assignedTo?.trim() || null,
        completedAt: input.status === "DONE" ? new Date() : null,
        source: "admin_case_task_panel"
      }
    });

    await tx.caseEvent.create({
      data: {
        caseId: snapshot.id,
        eventType: "CASE_TASK_CREATED",
        actorName: input.actorName?.trim() || "system",
        message: `Case task created: ${created.title}`,
        payloadJson: JSON.stringify({
          taskId: created.id,
          title: created.title,
          status: created.status,
          priority: created.priority,
          dueDate: created.dueDate?.toISOString() ?? null,
          assignedTo: created.assignedTo
        })
      }
    });

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after task creation."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateCaseTaskMetadata(input: UpdateCaseTaskMetadataInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseTask.findUnique({
      where: { id: input.taskId },
      select: {
        id: true,
        caseId: true,
        title: true,
        details: true,
        description: true,
        priority: true,
        dueDate: true,
        assignedTo: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseTaskUpdateError("CASE_TASK_NOT_FOUND", "Case task not found.");
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new CaseTaskUpdateError(
        "CASE_MATTER_MISMATCH",
        "Case task does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseTaskConcurrentUpdateError(
        "Case task was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const title = normalizeTaskTitle(input.title);
    if (!title) {
      throw new CaseTaskUpdateError("CASE_TASK_TITLE_EMPTY", "Case task title must not be empty.");
    }

    const details = input.details?.trim() || null;
    const description = input.description?.trim() || null;
    const assignedTo = input.assignedTo?.trim() || null;
    const dueDate = parseOptionalCaseTaskUpdateDueDate(input.dueDate);
    const changes: string[] = [];

    if (snapshot.title !== title) changes.push("title");
    if ((snapshot.details ?? null) !== details) changes.push("details");
    if ((snapshot.description ?? null) !== description) changes.push("description");
    if (snapshot.priority !== input.priority) changes.push("priority");
    if (!sameOptionalDate(snapshot.dueDate, dueDate)) changes.push("dueDate");
    if ((snapshot.assignedTo ?? null) !== assignedTo) changes.push("assignedTo");

    if (changes.length > 0) {
      await tx.caseTask.update({
        where: { id: snapshot.id },
        data: {
          title,
          details,
          description,
          priority: input.priority,
          dueDate,
          assignedTo
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: input.caseMatterId,
          eventType: "CASE_TASK_METADATA_UPDATED",
          actorName: input.actorName?.trim() || "system",
          message: `Case task metadata updated: ${snapshot.title} (${changes.join(", ")})`,
          payloadJson: JSON.stringify({
            taskId: snapshot.id,
            changedFields: changes,
            previous: {
              title: snapshot.title,
              details: snapshot.details,
              description: snapshot.description,
              priority: snapshot.priority,
              dueDate: snapshot.dueDate?.toISOString() ?? null,
              assignedTo: snapshot.assignedTo
            },
            next: {
              title,
              details,
              description,
              priority: input.priority,
              dueDate: dueDate?.toISOString() ?? null,
              assignedTo
            }
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, input.caseMatterId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after task metadata update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateCaseTaskStatus(input: UpdateCaseTaskStatusInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseTask.findUnique({
      where: { id: input.taskId },
      select: {
        id: true,
        caseId: true,
        title: true,
        status: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseTaskUpdateError("CASE_TASK_NOT_FOUND", "Case task not found.");
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new CaseTaskUpdateError(
        "CASE_MATTER_MISMATCH",
        "Case task does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseTaskConcurrentUpdateError(
        "Case task was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const statusChangeNote = input.statusChangeNote?.trim() || null;
    if (snapshot.status !== input.status) {
      const now = new Date();
      await tx.caseTask.update({
        where: { id: snapshot.id },
        data: {
          status: input.status,
          completedAt: input.status === "DONE" ? now : null
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: input.caseMatterId,
          eventType: "CASE_TASK_STATUS_CHANGED",
          actorName: input.actorName?.trim() || "system",
          message: statusChangeNote
            ? `Case task status changed: ${snapshot.title} (${snapshot.status} -> ${input.status}) (${statusChangeNote})`
            : `Case task status changed: ${snapshot.title} (${snapshot.status} -> ${input.status})`,
          payloadJson: JSON.stringify({
            taskId: snapshot.id,
            title: snapshot.title,
            previousStatus: snapshot.status,
            nextStatus: input.status,
            completedAt: input.status === "DONE" ? now.toISOString() : null,
            statusChangeNote
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, input.caseMatterId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after task status update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function createSupplementRequest(input: CreateSupplementRequestInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
    if (expectedCaseUpdatedAt && expectedCaseUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const title = normalizeSupplementTitle(input.title);
    if (!title) {
      throw new SupplementRequestCreateError(
        "SUPPLEMENT_REQUEST_TITLE_EMPTY",
        "Supplement request title must not be empty."
      );
    }

    const receivedAt = parseSupplementCreateDate(input.receivedAt, "receivedAt");
    const dueDate = parseSupplementCreateDate(input.dueDate, "dueDate");
    const created = await tx.supplementRequest.create({
      data: {
        caseId: snapshot.id,
        title,
        description: input.description?.trim() || null,
        receivedAt: receivedAt ?? new Date(),
        dueDate,
        requestedDocsJson: input.requestedDocsJson?.trim() || null,
        responseNote: input.responseNote?.trim() || null
      }
    });

    await tx.caseEvent.create({
      data: {
        caseId: snapshot.id,
        eventType: "SUPPLEMENT_REQUEST_CREATED",
        actorName: input.actorName?.trim() || "system",
        message: `Supplement request created: ${created.title}`,
        payloadJson: JSON.stringify({
          supplementRequestId: created.id,
          title: created.title,
          status: created.status,
          receivedAt: created.receivedAt.toISOString(),
          dueDate: created.dueDate?.toISOString() ?? null
        })
      }
    });

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after supplement request creation."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateSupplementRequestMetadata(input: UpdateSupplementRequestMetadataInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.supplementRequest.findUnique({
      where: { id: input.supplementRequestId },
      select: {
        id: true,
        caseId: true,
        title: true,
        description: true,
        receivedAt: true,
        dueDate: true,
        requestedDocsJson: true,
        responseNote: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new SupplementRequestUpdateError(
        "SUPPLEMENT_REQUEST_NOT_FOUND",
        "Supplement request not found."
      );
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new SupplementRequestUpdateError(
        "CASE_MATTER_MISMATCH",
        "Supplement request does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new SupplementRequestConcurrentUpdateError(
        "Supplement request was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const title = normalizeSupplementTitle(input.title);
    if (!title) {
      throw new SupplementRequestUpdateError(
        "SUPPLEMENT_REQUEST_TITLE_EMPTY",
        "Supplement request title must not be empty."
      );
    }

    const description = input.description?.trim() || null;
    const receivedAt =
      parseOptionalSupplementUpdateDate(input.receivedAt, "receivedAt") ?? snapshot.receivedAt;
    const dueDate = parseOptionalSupplementUpdateDate(input.dueDate, "dueDate");
    const requestedDocsJson = input.requestedDocsJson?.trim() || null;
    const responseNote = input.responseNote?.trim() || null;
    const changes: string[] = [];

    if (snapshot.title !== title) changes.push("title");
    if ((snapshot.description ?? null) !== description) changes.push("description");
    if (!sameOptionalDate(snapshot.receivedAt, receivedAt)) changes.push("receivedAt");
    if (!sameOptionalDate(snapshot.dueDate, dueDate)) changes.push("dueDate");
    if ((snapshot.requestedDocsJson ?? null) !== requestedDocsJson) changes.push("requestedDocsJson");
    if ((snapshot.responseNote ?? null) !== responseNote) changes.push("responseNote");

    if (changes.length > 0) {
      await tx.supplementRequest.update({
        where: { id: snapshot.id },
        data: {
          title,
          description,
          receivedAt,
          dueDate,
          requestedDocsJson,
          responseNote
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.caseId,
          eventType: "SUPPLEMENT_REQUEST_METADATA_UPDATED",
          actorName: input.actorName?.trim() || "system",
          message: `Supplement request metadata updated: ${snapshot.title} (${changes.join(", ")})`,
          payloadJson: JSON.stringify({
            supplementRequestId: snapshot.id,
            changedFields: changes,
            previous: {
              title: snapshot.title,
              description: snapshot.description,
              receivedAt: snapshot.receivedAt.toISOString(),
              dueDate: snapshot.dueDate?.toISOString() ?? null,
              requestedDocsJson: snapshot.requestedDocsJson,
              responseNote: snapshot.responseNote
            },
            next: {
              title,
              description,
              receivedAt: receivedAt.toISOString(),
              dueDate: dueDate?.toISOString() ?? null,
              requestedDocsJson,
              responseNote
            }
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.caseId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after supplement request metadata update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateSupplementRequestStatus(input: UpdateSupplementRequestStatusInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.supplementRequest.findUnique({
      where: { id: input.supplementRequestId },
      select: {
        id: true,
        caseId: true,
        title: true,
        status: true,
        responseNote: true,
        respondedAt: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new SupplementRequestUpdateError(
        "SUPPLEMENT_REQUEST_NOT_FOUND",
        "Supplement request not found."
      );
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new SupplementRequestUpdateError(
        "CASE_MATTER_MISMATCH",
        "Supplement request does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new SupplementRequestConcurrentUpdateError(
        "Supplement request was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const statusChangeNote = input.statusChangeNote?.trim() || null;
    const responseNote =
      input.responseNote === undefined || input.responseNote === null
        ? snapshot.responseNote ?? null
        : input.responseNote.trim() || null;
    const terminalWithResponse = input.status === "RESPONDED" || input.status === "CLOSED";
    const explicitRespondedAt = parseOptionalSupplementUpdateDate(input.respondedAt, "respondedAt");
    const nextRespondedAt = terminalWithResponse ? explicitRespondedAt ?? snapshot.respondedAt ?? new Date() : null;
    const changes: string[] = [];

    if (snapshot.status !== input.status) changes.push("status");
    if ((snapshot.responseNote ?? null) !== responseNote) changes.push("responseNote");
    if (!sameOptionalDate(snapshot.respondedAt, nextRespondedAt)) changes.push("respondedAt");

    if (changes.length > 0) {
      await tx.supplementRequest.update({
        where: { id: snapshot.id },
        data: {
          status: input.status,
          responseNote,
          respondedAt: nextRespondedAt
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.caseId,
          eventType: "SUPPLEMENT_REQUEST_STATUS_CHANGED",
          actorName: input.actorName?.trim() || "system",
          message: statusChangeNote
            ? `Supplement request status changed: ${snapshot.title} (${snapshot.status} -> ${input.status}) (${statusChangeNote})`
            : `Supplement request status changed: ${snapshot.title} (${snapshot.status} -> ${input.status})`,
          payloadJson: JSON.stringify({
            supplementRequestId: snapshot.id,
            title: snapshot.title,
            previousStatus: snapshot.status,
            nextStatus: input.status,
            responseNote,
            respondedAt: nextRespondedAt?.toISOString() ?? null,
            statusChangeNote
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.caseId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after supplement request status update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateCaseAccountingMemo(input: UpdateCaseAccountingMemoInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        updatedAt: true,
        accountingMemo: {
          select: {
            id: true,
            caseId: true,
            feeAmount: true,
            feeStatus: true,
            paymentStatus: true,
            paidAmount: true,
            paidAt: true,
            paymentMemo: true,
            invoiceMemo: true,
            ledgerMemo: true,
            updatedAt: true
          }
        }
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const existing = snapshot.accountingMemo;
    if (existing && existing.caseId !== input.caseMatterId) {
      throw new CaseAccountingMemoUpdateError(
        "CASE_MATTER_MISMATCH",
        "Accounting memo does not belong to the case matter."
      );
    }

    if (existing) {
      const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
      if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== existing.updatedAt.getTime()) {
        throw new CaseAccountingMemoConcurrentUpdateError(
          "Accounting memo was updated by another session. Reload and try again.",
          existing.updatedAt.toISOString()
        );
      }
    } else {
      const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
      if (expectedCaseUpdatedAt && expectedCaseUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
        throw new CaseMatterConcurrentUpdateError(
          "Case matter was updated by another session. Reload and try again.",
          snapshot.updatedAt.toISOString()
        );
      }
    }

    const next = {
      feeAmount: input.feeAmount ?? null,
      feeStatus: input.feeStatus ?? "UNSET",
      paymentStatus: input.paymentStatus ?? "UNSET",
      paidAmount: input.paidAmount ?? null,
      paidAt: parseOptionalAccountingPaidAt(input.paidAt),
      paymentMemo: normalizeAccountingMemo(input.paymentMemo),
      invoiceMemo: normalizeAccountingMemo(input.invoiceMemo),
      ledgerMemo: normalizeAccountingMemo(input.ledgerMemo)
    };

    const changes: string[] = [];
    if (!existing) {
      changes.push("created");
    } else {
      if ((existing.feeAmount ?? null) !== next.feeAmount) changes.push("feeAmount");
      if (existing.feeStatus !== next.feeStatus) changes.push("feeStatus");
      if (existing.paymentStatus !== next.paymentStatus) changes.push("paymentStatus");
      if ((existing.paidAmount ?? null) !== next.paidAmount) changes.push("paidAmount");
      if (!sameOptionalDate(existing.paidAt, next.paidAt)) changes.push("paidAt");
      if ((existing.paymentMemo ?? null) !== next.paymentMemo) changes.push("paymentMemo");
      if ((existing.invoiceMemo ?? null) !== next.invoiceMemo) changes.push("invoiceMemo");
      if ((existing.ledgerMemo ?? null) !== next.ledgerMemo) changes.push("ledgerMemo");
    }

    if (changes.length > 0) {
      const saved = existing
        ? await tx.caseAccountingMemo.update({
            where: { id: existing.id },
            data: next
          })
        : await tx.caseAccountingMemo.create({
            data: {
              caseId: snapshot.id,
              ...next
            }
          });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.id,
          eventType: "CASE_ACCOUNTING_UPDATED",
          actorName: input.actorName?.trim() || "system",
          message: `Case accounting updated: fee ${existing?.feeStatus ?? "UNSET"} -> ${saved.feeStatus}, payment ${existing?.paymentStatus ?? "UNSET"} -> ${saved.paymentStatus}`,
          payloadJson: JSON.stringify({
            accountingMemoId: saved.id,
            changedFields: changes,
            previous: existing
              ? {
                  feeAmount: existing.feeAmount,
                  feeStatus: existing.feeStatus,
                  paymentStatus: existing.paymentStatus,
                  paidAmount: existing.paidAmount,
                  paidAt: existing.paidAt?.toISOString() ?? null
                }
              : null,
            next: {
              feeAmount: saved.feeAmount,
              feeStatus: saved.feeStatus,
              paymentStatus: saved.paymentStatus,
              paidAmount: saved.paidAmount,
              paidAt: saved.paidAt?.toISOString() ?? null
            }
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after accounting memo update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function startRequiredDocumentChecklist(
  input: StartRequiredDocumentChecklistInput
): Promise<StartRequiredDocumentChecklistResult> {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        matterType: true,
        updatedAt: true,
        requiredDocuments: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
    if (expectedCaseUpdatedAt && expectedCaseUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const plan = buildRequiredDocumentChecklistStarterPlan(snapshot.matterType, snapshot.requiredDocuments);
    const { templates, toCreate } = plan;

    if (toCreate.length > 0) {
      await tx.requiredDocument.createMany({
        data: toCreate.map((item) => ({
          caseId: snapshot.id,
          name: item.name,
          description: item.description ?? null,
          required: item.required,
          status: "NEEDED"
        }))
      });
    }

    await tx.caseEvent.create({
      data: {
        caseId: snapshot.id,
        eventType: "REQUIRED_DOCUMENT_CHECKLIST_STARTED",
        actorName: input.actorName?.trim() || "system",
        message:
          toCreate.length > 0
            ? `Required document starter checklist created (${toCreate.length})`
            : "Required document starter checklist requested (no new items)",
        payloadJson: JSON.stringify({
          createdCount: toCreate.length,
          skippedCount: templates.length - toCreate.length,
          createdNames: toCreate.map((item) => item.name)
        })
      }
    });

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after checklist starter."
      );
    }

    return {
      caseMatter: attachNextAction(caseMatter),
      createdCount: toCreate.length,
      skippedCount: templates.length - toCreate.length
    };
  });
}
