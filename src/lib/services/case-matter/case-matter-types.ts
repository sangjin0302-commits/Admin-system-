import type {
  AccountingFeeStatus,
  AccountingPaymentStatus,
  CaseMatterStatus,
  CaseTaskPriority,
  CaseTaskStatus,
  Prisma,
  RequiredDocumentStatus,
  SupplementStatus
} from "@generated/prisma-client/client";

import type { CaseMatterNextAction } from "@/lib/services/case-matter-next-action-helpers";

import type { operationalInclude } from "./_internal";

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
  category?: string | null;
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
