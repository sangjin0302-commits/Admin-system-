import type {
  CaseMatterStatus,
  InquiryStatus,
  InquiryType,
  Prisma,
  RiskLevel,
  UrgencyLevel
} from "@generated/prisma-client/client";

import {
  deriveCaseMatterNextAction
} from "@/lib/services/case-matter-next-action-helpers";

import {
  CaseAccountingMemoUpdateError,
  CaseTaskCreateError,
  CaseTaskUpdateError,
  RequiredDocumentCreateError,
  RequiredDocumentUpdateError,
  SupplementRequestCreateError,
  SupplementRequestUpdateError,
  type CaseMatterWithNextAction
} from "./case-matter-types";

export const operationalInclude = {
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
  adminAppealDetail: {
    select: {
      id: true,
      appealType: true,
      disposingAgency: true,
      reviewingAgency: true,
      dispositionContent: true,
      dispositionDate: true,
      noticeReceivedDate: true,
      filingDeadline: true,
      filedAt: true,
      hearingDate: true,
      decisionExpectedDate: true,
      decisionReceivedDate: true,
      result: true,
      resultSummary: true,
      groundsSummary: true,
      evidenceSummary: true,
      caseNoOfficial: true,
      deadlineVerifiedAt: true,
      verifiedBy: true,
      updatedAt: true
    }
  },
  contractDetail: {
    select: {
      id: true,
      contractType: true,
      counterpartyName: true,
      counterpartyContact: true,
      contractDate: true,
      contractAmount: true,
      contractSummary: true,
      disputeContent: true,
      investigationStatus: true,
      investigationScope: true,
      reportDueDate: true,
      reportDeliveredAt: true,
      keyFindings: true,
      legalBasisSummary: true,
      updatedAt: true
    }
  },
  licenseDetail: {
    select: {
      id: true,
      permitType: true,
      targetAgency: true,
      applicationNo: true,
      businessName: true,
      businessAddress: true,
      applicationDate: true,
      reviewDeadline: true,
      approvalDate: true,
      expiryDate: true,
      stage: true,
      requirementsSummary: true,
      missingRequirements: true,
      supplementContent: true,
      supplementDueDate: true,
      conditionsSummary: true,
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

export type CaseMatterOperationalRecord = Prisma.CaseMatterGetPayload<{
  include: typeof operationalInclude;
}>;

export function inferMatterTypeFromInquiry(inquiryType: InquiryType) {
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

export function inferCaseMatterStatus(inquiryStatus: InquiryStatus): CaseMatterStatus {
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

export function inferPriority(urgency: UrgencyLevel) {
  if (urgency === "CRITICAL") return "URGENT" as const;
  if (urgency === "HIGH") return "HIGH" as const;
  if (urgency === "LOW") return "LOW" as const;
  return "NORMAL" as const;
}

export function inferRiskLevel(urgency: UrgencyLevel): RiskLevel {
  if (urgency === "CRITICAL") return "CRITICAL";
  if (urgency === "HIGH") return "HIGH";
  if (urgency === "LOW") return "LOW";
  return "NORMAL";
}

export function attachNextAction(caseMatter: CaseMatterOperationalRecord): CaseMatterWithNextAction {
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

export function normalizeDocumentName(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

export function normalizeTaskTitle(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

export function normalizeSupplementTitle(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

export function normalizeAccountingMemo(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeDocumentNameKey(value: string) {
  return normalizeDocumentName(value).toLocaleLowerCase("en-US");
}

export function parseOptionalDueDate(raw?: string | null) {
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

export function parseOptionalRequiredDocumentUpdateDueDate(raw?: string | null) {
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

export function parseOptionalCaseTaskCreateDueDate(raw?: string | null) {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new CaseTaskCreateError("INVALID_DUE_DATE_FORMAT", "Invalid case task dueDate format.");
  }
  return parsed;
}

export function parseOptionalCaseTaskUpdateDueDate(raw?: string | null) {
  if (!raw?.trim()) return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new CaseTaskUpdateError("INVALID_DUE_DATE_FORMAT", "Invalid case task dueDate format.");
  }
  return parsed;
}

export function parseSupplementCreateDate(
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

export function parseOptionalSupplementUpdateDate(
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

export function parseOptionalAccountingPaidAt(raw?: string | null) {
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

export function sameOptionalDate(left: Date | null, right: Date | null) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.getTime() === right.getTime();
}

export async function getCaseMatterOperationalByIdTx(
  tx: Prisma.TransactionClient,
  caseMatterId: string
): Promise<CaseMatterOperationalRecord | null> {
  return tx.caseMatter.findUnique({
    where: { id: caseMatterId },
    include: operationalInclude
  });
}

export function normalizeExpectedUpdatedAt(raw?: string | null) {
  if (!raw?.trim()) return null;
  const expectedDate = new Date(raw);
  const expectedMs = expectedDate.getTime();
  if (!Number.isFinite(expectedMs)) {
    throw new Error("Invalid expectedUpdatedAt format.");
  }
  return expectedDate;
}
