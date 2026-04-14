import type {
  CaseStage,
  Prisma,
  SubmissionPackageStatus,
  SupplementRequestStatus
} from "@generated/prisma-client/client";

import {
  buildDeadlineInternalAlertKo,
  buildSubmissionCompletedKo,
  buildSupplementReceivedKo,
  buildSupplementResubmissionKo
} from "@/lib/message-templates/submission-flow";
import { prisma } from "@/lib/prisma/client";
import { generateSubmissionPackageNumber } from "@/lib/submission-utils/package-number";

type DeadlineStatus = "NONE" | "OK" | "DUE_SOON" | "OVERDUE";

type CaseWithSubmissionRelations = Prisma.CaseRecordGetPayload<{
  include: {
    inquiry: true;
    documents: {
      include: {
        files: true;
      };
    };
    submissionPackages: {
      include: {
        items: {
          include: {
            caseDocumentFile: true;
            caseDocumentItem: true;
          };
        };
      };
    };
    supplementRequests: {
      include: {
        submissionPackage: true;
        items: {
          include: {
            caseDocumentItem: true;
          };
        };
      };
    };
  };
}>;

export type SubmissionWorkspaceSnapshot = {
  caseId: string;
  caseNumber: string;
  currentStage: CaseStage;
  deadlines: Array<{
    key: "dueDate" | "filingDeadline" | "supplementDeadline" | "stayExpirationDate" | "internalDeadline";
    label: string;
    value: string | null;
    status: DeadlineStatus;
    daysRemaining: number | null;
  }>;
  checklist: {
    requiredCount: number;
    receivedRequiredCount: number;
    missingDocuments: string[];
    submittableDocuments: Array<{
      caseDocumentItemId: string;
      label: string;
      documentType: string;
      currentFileId: string;
      currentFilename: string;
      currentVersionNumber: number;
    }>;
  };
  submissionPackages: Array<{
    id: string;
    packageNumber: string;
    packageLabel: string | null;
    submittedTo: string | null;
    submittedAt: string | null;
    status: SubmissionPackageStatus;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    items: Array<{
      id: string;
      caseDocumentItemId: string;
      caseDocumentFileId: string;
      labelSnapshot: string;
      versionNumberSnapshot: number;
      filenameSnapshot: string;
      documentTypeSnapshot: string;
    }>;
  }>;
  supplementRequests: Array<{
    id: string;
    submissionPackageId: string | null;
    submissionPackageNumber: string | null;
    requestedAt: string;
    dueDate: string | null;
    requestedBy: string | null;
    summary: string;
    status: SupplementRequestStatus;
    note: string | null;
    relatedItems: Array<{
      id: string;
      caseDocumentItemId: string;
      labelSnapshot: string;
    }>;
  }>;
  messageDrafts: {
    submissionCompletedKo: string;
    supplementReceivedKo: string;
    supplementResubmissionKo: string;
    deadlineAlertInternalKo: string;
  };
};

const DUE_SOON_DAYS = 3;

function toStartOfDay(date: Date) {
  const cloned = new Date(date);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

function getDeadlineInfo(value: Date | null) {
  if (!value) {
    return { status: "NONE" as const, daysRemaining: null };
  }

  const daysRemaining = Math.ceil(
    (toStartOfDay(value).getTime() - toStartOfDay(new Date()).getTime()) / (24 * 60 * 60 * 1000)
  );
  if (daysRemaining < 0) return { status: "OVERDUE" as const, daysRemaining };
  if (daysRemaining <= DUE_SOON_DAYS) return { status: "DUE_SOON" as const, daysRemaining };
  return { status: "OK" as const, daysRemaining };
}

function serializeWorkspace(record: CaseWithSubmissionRelations): SubmissionWorkspaceSnapshot {
  const deadlines = [
    { key: "dueDate", label: "일반 예정일", value: record.dueDate },
    { key: "filingDeadline", label: "제출 마감", value: record.filingDeadline },
    { key: "supplementDeadline", label: "보완 마감", value: record.supplementDeadline },
    { key: "stayExpirationDate", label: "체류 만료일", value: record.stayExpirationDate },
    { key: "internalDeadline", label: "내부 마감", value: record.internalDeadline }
  ].map((deadline) => {
    const status = getDeadlineInfo(deadline.value);
    return {
      key: deadline.key as
        | "dueDate"
        | "filingDeadline"
        | "supplementDeadline"
        | "stayExpirationDate"
        | "internalDeadline",
      label: deadline.label,
      value: deadline.value ? deadline.value.toISOString() : null,
      status: status.status,
      daysRemaining: status.daysRemaining
    };
  });

  const submittableDocuments = record.documents
    .map((doc) => {
      const currentFile =
        doc.files.find((file) => file.isCurrentVersion) ??
        doc.files
          .slice()
          .sort((a, b) => b.versionNumber - a.versionNumber || b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
      if (!currentFile) return null;

      return {
        caseDocumentItemId: doc.id,
        label: doc.label,
        documentType: doc.documentType,
        currentFileId: currentFile.id,
        currentFilename: currentFile.originalFilename,
        currentVersionNumber: currentFile.versionNumber
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => left.label.localeCompare(right.label, "ko-KR"));

  const required = record.documents.filter((doc) => doc.isRequired);
  const receivedRequired = required.filter((doc) => doc.isReceived || doc.files.some((file) => file.isCurrentVersion));
  const missingDocuments = required
    .filter((doc) => !doc.isReceived && !doc.files.some((file) => file.isCurrentVersion))
    .map((doc) => doc.label);

  const submissionPackages = record.submissionPackages
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((pkg) => ({
      id: pkg.id,
      packageNumber: pkg.packageNumber,
      packageLabel: pkg.packageLabel,
      submittedTo: pkg.submittedTo,
      submittedAt: pkg.submittedAt ? pkg.submittedAt.toISOString() : null,
      status: pkg.status,
      note: pkg.note,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
      items: pkg.items.map((item) => ({
        id: item.id,
        caseDocumentItemId: item.caseDocumentItemId,
        caseDocumentFileId: item.caseDocumentFileId,
        labelSnapshot: item.labelSnapshot,
        versionNumberSnapshot: item.versionNumberSnapshot,
        filenameSnapshot: item.filenameSnapshot,
        documentTypeSnapshot: item.documentTypeSnapshot
      }))
    }));

  const supplementRequests = record.supplementRequests
    .slice()
    .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
    .map((request) => ({
      id: request.id,
      submissionPackageId: request.submissionPackageId,
      submissionPackageNumber: request.submissionPackage?.packageNumber ?? null,
      requestedAt: request.requestedAt.toISOString(),
      dueDate: request.dueDate ? request.dueDate.toISOString() : null,
      requestedBy: request.requestedBy,
      summary: request.summary,
      status: request.status,
      note: request.note,
      relatedItems: request.items
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          id: item.id,
          caseDocumentItemId: item.caseDocumentItemId,
          labelSnapshot: item.labelSnapshot
        }))
    }));

  const nextDeadline = deadlines
    .filter((deadline) => deadline.status !== "NONE" && deadline.value)
    .sort((left, right) => new Date(left.value!).getTime() - new Date(right.value!).getTime())[0];
  const latestPackage = submissionPackages[0];
  const openSupplement = supplementRequests.find((request) => request.status !== "RESOLVED");

  const messageInput = {
    contactName: record.inquiry.contactName,
    caseNumber: record.caseNumber,
    currentStage: record.currentStage as import("@/types/case").CaseStage,
    packageNumber: latestPackage?.packageNumber,
    submittedTo: latestPackage?.submittedTo ?? undefined,
    supplementSummary: openSupplement?.summary,
    missingDocuments,
    nextDeadlineLabel: nextDeadline?.label,
    nextDeadlineDate: nextDeadline?.value ?? undefined
  };

  return {
    caseId: record.id,
    caseNumber: record.caseNumber,
    currentStage: record.currentStage,
    deadlines,
    checklist: {
      requiredCount: required.length,
      receivedRequiredCount: receivedRequired.length,
      missingDocuments,
      submittableDocuments
    },
    submissionPackages,
    supplementRequests,
    messageDrafts: {
      submissionCompletedKo: buildSubmissionCompletedKo(messageInput),
      supplementReceivedKo: buildSupplementReceivedKo(messageInput),
      supplementResubmissionKo: buildSupplementResubmissionKo(messageInput),
      deadlineAlertInternalKo: buildDeadlineInternalAlertKo(messageInput)
    }
  };
}

async function getCaseWithRelations(caseId: string) {
  return prisma.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      inquiry: true,
      documents: {
        include: {
          files: true
        }
      },
      submissionPackages: {
        include: {
          items: {
            include: {
              caseDocumentFile: true,
              caseDocumentItem: true
            }
          }
        }
      },
      supplementRequests: {
        include: {
          submissionPackage: true,
          items: {
            include: {
              caseDocumentItem: true
            }
          }
        }
      }
    }
  });
}

async function updateCaseStage(tx: Prisma.TransactionClient, caseId: string, stage: CaseStage, note?: string) {
  const current = await tx.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    select: { currentStage: true }
  });

  if (current.currentStage !== stage) {
    await tx.caseRecord.update({
      where: { id: caseId },
      data: { currentStage: stage }
    });
  }

  if (current.currentStage !== stage || note?.trim()) {
    await tx.caseStageLog.create({
      data: {
        caseId,
        fromStage: current.currentStage,
        toStage: stage,
        note: note?.trim() || null
      }
    });
  }
}

export async function getSubmissionWorkspace(caseId: string) {
  return serializeWorkspace(await getCaseWithRelations(caseId));
}

export async function createSubmissionPackage(
  caseId: string,
  input: {
    packageLabel?: string;
    submittedTo?: string;
    note?: string;
    status?: SubmissionPackageStatus;
    selectedDocumentItemIds?: string[];
  }
) {
  const record = await getCaseWithRelations(caseId);
  const selectedIds =
    input.selectedDocumentItemIds && input.selectedDocumentItemIds.length > 0
      ? new Set(input.selectedDocumentItemIds)
      : null;

  const targetDocuments = record.documents.filter((doc) =>
    selectedIds ? selectedIds.has(doc.id) : doc.files.some((file) => file.isCurrentVersion)
  );
  if (targetDocuments.length === 0) {
    throw new Error("제출 패키지에 포함할 문서를 선택해 주세요.");
  }

  const status = input.status ?? "DRAFT";
  const shouldSetSubmittedAt = status === "SUBMITTED" || status === "RESUBMITTED";
  const items = targetDocuments.map((doc) => {
    const currentFile =
      doc.files.find((file) => file.isCurrentVersion) ??
      doc.files
        .slice()
        .sort((a, b) => b.versionNumber - a.versionNumber || b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
    if (!currentFile) {
      throw new Error(`"${doc.label}" 문서에 제출 가능한 파일이 없습니다.`);
    }

    return {
      caseDocumentItemId: doc.id,
      caseDocumentFileId: currentFile.id,
      labelSnapshot: doc.label,
      versionNumberSnapshot: currentFile.versionNumber,
      documentTypeSnapshot: doc.documentType,
      filenameSnapshot: currentFile.originalFilename
    };
  });

  await prisma.$transaction(async (tx) => {
    const packageNumber = generateSubmissionPackageNumber(caseNumberOrFallback(record.caseNumber), record.submissionPackages.length + 1);
    await tx.submissionPackage.create({
      data: {
        caseId,
        packageNumber,
        packageLabel: input.packageLabel?.trim() || null,
        submittedTo: input.submittedTo?.trim() || null,
        submittedAt: shouldSetSubmittedAt ? new Date() : null,
        status,
        note: input.note?.trim() || null,
        items: {
          create: items
        }
      }
    });

    if (status === "SUBMITTED" || status === "RESUBMITTED") {
      await updateCaseStage(tx, caseId, "SUBMITTED", `제출 패키지 생성 (${packageNumber})`);
    }
  });

  return serializeWorkspace(await getCaseWithRelations(caseId));
}

export async function updateSubmissionPackage(
  caseId: string,
  packageId: string,
  input: {
    status?: SubmissionPackageStatus;
    packageLabel?: string;
    submittedTo?: string;
    submittedAt?: Date | null;
    note?: string;
  }
) {
  await prisma.$transaction(async (tx) => {
    const target = await tx.submissionPackage.findUniqueOrThrow({
      where: { id: packageId },
      select: { caseId: true, status: true, submittedAt: true, packageNumber: true }
    });

    if (target.caseId !== caseId) {
      throw new Error("사건과 제출 패키지 정보가 일치하지 않습니다.");
    }

    const nextStatus = input.status ?? target.status;
    const shouldSetSubmittedAt = nextStatus === "SUBMITTED" || nextStatus === "RESUBMITTED";

    await tx.submissionPackage.update({
      where: { id: packageId },
      data: {
        status: nextStatus,
        packageLabel: input.packageLabel !== undefined ? input.packageLabel.trim() || null : undefined,
        submittedTo: input.submittedTo !== undefined ? input.submittedTo.trim() || null : undefined,
        submittedAt:
          input.submittedAt !== undefined
            ? input.submittedAt
            : shouldSetSubmittedAt && !target.submittedAt
              ? new Date()
              : undefined,
        note: input.note !== undefined ? input.note.trim() || null : undefined
      }
    });

    if (nextStatus === "SUBMITTED" || nextStatus === "RESUBMITTED") {
      await updateCaseStage(tx, caseId, "SUBMITTED", `제출 상태 변경 (${target.packageNumber})`);
    } else if (nextStatus === "SUPPLEMENT_REQUESTED") {
      await updateCaseStage(tx, caseId, "SUPPLEMENT_REQUESTED", `보완 상태 변경 (${target.packageNumber})`);
    }
  });

  return serializeWorkspace(await getCaseWithRelations(caseId));
}

export async function createSupplementRequest(
  caseId: string,
  input: {
    submissionPackageId?: string;
    dueDate?: Date | null;
    requestedBy?: string;
    summary: string;
    note?: string;
    relatedDocumentItemIds: string[];
  }
) {
  await prisma.$transaction(async (tx) => {
    const record = await tx.caseRecord.findUniqueOrThrow({
      where: { id: caseId },
      include: { documents: true }
    });

    const selectedSet = new Set(input.relatedDocumentItemIds);
    const relatedDocs = record.documents
      .filter((doc) => selectedSet.has(doc.id))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    let submissionPackageId: string | null = null;
    if (input.submissionPackageId) {
      const targetPackage = await tx.submissionPackage.findUniqueOrThrow({
        where: { id: input.submissionPackageId },
        select: { id: true, caseId: true }
      });
      if (targetPackage.caseId !== caseId) {
        throw new Error("보완 요청과 제출 패키지 정보가 일치하지 않습니다.");
      }
      submissionPackageId = targetPackage.id;
    }

    await tx.supplementRequest.create({
      data: {
        caseId,
        submissionPackageId,
        dueDate: input.dueDate ?? null,
        requestedBy: input.requestedBy?.trim() || null,
        summary: input.summary.trim(),
        note: input.note?.trim() || null,
        status: "OPEN",
        items: {
          create: relatedDocs.map((doc, index) => ({
            caseDocumentItemId: doc.id,
            labelSnapshot: doc.label,
            sortOrder: index
          }))
        }
      }
    });

    if (submissionPackageId) {
      await tx.submissionPackage.update({
        where: { id: submissionPackageId },
        data: { status: "SUPPLEMENT_REQUESTED" }
      });
    }

    await tx.caseRecord.update({
      where: { id: caseId },
      data: {
        supplementDeadline: input.dueDate ?? undefined
      }
    });
    await updateCaseStage(tx, caseId, "SUPPLEMENT_REQUESTED", `보완 요청 등록: ${input.summary.trim()}`);
  });

  return serializeWorkspace(await getCaseWithRelations(caseId));
}

export async function updateSupplementRequest(
  caseId: string,
  supplementRequestId: string,
  input: {
    status?: SupplementRequestStatus;
    dueDate?: Date | null;
    summary?: string;
    note?: string;
  }
) {
  await prisma.$transaction(async (tx) => {
    const target = await tx.supplementRequest.findUniqueOrThrow({
      where: { id: supplementRequestId },
      select: { caseId: true, status: true }
    });

    if (target.caseId !== caseId) {
      throw new Error("사건과 보완 요청 정보가 일치하지 않습니다.");
    }

    const nextStatus = input.status ?? target.status;
    await tx.supplementRequest.update({
      where: { id: supplementRequestId },
      data: {
        status: nextStatus,
        dueDate: input.dueDate !== undefined ? input.dueDate : undefined,
        summary: input.summary !== undefined ? input.summary.trim() : undefined,
        note: input.note !== undefined ? input.note.trim() || null : undefined
      }
    });

    if (input.dueDate !== undefined) {
      await tx.caseRecord.update({
        where: { id: caseId },
        data: { supplementDeadline: input.dueDate }
      });
    }

    if (nextStatus === "RESOLVED") {
      await updateCaseStage(tx, caseId, "UNDER_REVIEW", "보완 요청 해결");
    } else {
      await updateCaseStage(tx, caseId, "SUPPLEMENT_REQUESTED");
    }
  });

  return serializeWorkspace(await getCaseWithRelations(caseId));
}

function caseNumberOrFallback(caseNumber: string) {
  return caseNumber && caseNumber.trim().length > 0 ? caseNumber : "CASE";
}
