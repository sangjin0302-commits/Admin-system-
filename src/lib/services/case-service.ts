import type { CaseStage, ClientRelationshipStatus, Prisma } from "@generated/prisma-client/client";

import { ensureCaseDocumentChecklist } from "@/lib/case-documents/service";
import { documentStorage } from "@/lib/document-storage";
import {
  buildCaseStatusUpdateKo,
  buildContractDocumentGuideKo,
  buildMissingDocumentsRequestKo,
  buildSupplementRequestKo
} from "@/lib/message-templates/case-flow";
import { prisma } from "@/lib/prisma/client";
import type { InquiryType } from "@/types/inquiry";

type CaseRecordWithRelations = Prisma.CaseRecordGetPayload<{
  include: {
    inquiry: true;
    documents: {
      include: {
        files: true;
      };
    };
    stageLogs: true;
  };
}>;

type CaseDocumentRecord = CaseRecordWithRelations["documents"][number];
type CaseDocumentFileRecord = CaseDocumentRecord["files"][number];
type CaseStageLogRecord = CaseRecordWithRelations["stageLogs"][number];

export type CaseWorkspaceSnapshot = {
  id: string;
  caseNumber: string;
  inquiryId: string;
  currentStage: CaseStage;
  dueDate: string | null;
  internalMemo: string | null;
  deadlines: Array<{
    key: "dueDate" | "filingDeadline" | "supplementDeadline" | "stayExpirationDate" | "internalDeadline";
    label: string;
    value: string | null;
    status: "NONE" | "OK" | "DUE_SOON" | "OVERDUE";
    daysRemaining: number | null;
  }>;
  documents: Array<{
    id: string;
    documentType: string;
    label: string;
    isRequired: boolean;
    isReceived: boolean;
    hasCurrentFile: boolean;
    fileCount: number;
    receivedAt: string | null;
    note: string | null;
    sortOrder: number;
    files: Array<{
      id: string;
      originalFilename: string;
      storedFilename: string;
      mimeType: string;
      size: number;
      uploadedAt: string;
      note: string | null;
      isCurrentVersion: boolean;
      versionNumber: number;
    }>;
  }>;
  stageLogs: Array<{
    id: string;
    fromStage: CaseStage | null;
    toStage: CaseStage;
    note: string | null;
    createdAt: string;
  }>;
  documentSummary: {
    requiredCount: number;
    receivedRequiredCount: number;
    missingCount: number;
    missingDocuments: string[];
  };
  messageDrafts: {
    contractDocumentGuideKo: string;
    missingDocumentsRequestKo: string;
    statusUpdateKo: string;
    supplementRequestKo: string;
  };
};

const DUE_SOON_DAYS = 3;

function toStartOfDay(date: Date) {
  const cloned = new Date(date);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

function getDeadlineStatus(value: Date | null) {
  if (!value) {
    return {
      status: "NONE" as const,
      daysRemaining: null
    };
  }

  const diffMs = toStartOfDay(value).getTime() - toStartOfDay(new Date()).getTime();
  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (daysRemaining < 0) {
    return { status: "OVERDUE" as const, daysRemaining };
  }
  if (daysRemaining <= DUE_SOON_DAYS) {
    return { status: "DUE_SOON" as const, daysRemaining };
  }

  return { status: "OK" as const, daysRemaining };
}

function serializeCaseWorkspace(record: CaseRecordWithRelations) {
  const documents = record.documents.sort(
    (a: CaseDocumentRecord, b: CaseDocumentRecord) => a.sortOrder - b.sortOrder
  );
  const documentSnapshots = documents.map((doc: CaseDocumentRecord) => {
    const files = doc.files
      .slice()
      .sort(
        (a: CaseDocumentFileRecord, b: CaseDocumentFileRecord) =>
          b.versionNumber - a.versionNumber || b.uploadedAt.getTime() - a.uploadedAt.getTime()
      )
      .map((file: CaseDocumentFileRecord) => ({
        id: file.id,
        originalFilename: file.originalFilename,
        storedFilename: file.storedFilename,
        mimeType: file.mimeType,
        size: file.size,
        uploadedAt: file.uploadedAt.toISOString(),
        note: file.note,
        isCurrentVersion: file.isCurrentVersion,
        versionNumber: file.versionNumber
      }));

    const hasCurrentFile = files.some((file: { isCurrentVersion: boolean }) => file.isCurrentVersion);
    return {
      id: doc.id,
      documentType: doc.documentType,
      label: doc.label,
      isRequired: doc.isRequired,
      isReceived: doc.isReceived || hasCurrentFile,
      hasCurrentFile,
      fileCount: files.length,
      receivedAt: doc.receivedAt ? doc.receivedAt.toISOString() : null,
      note: doc.note,
      sortOrder: doc.sortOrder,
      files
    };
  });
  const required = documentSnapshots.filter((doc: (typeof documentSnapshots)[number]) => doc.isRequired);
  const receivedRequired = required.filter((doc: (typeof required)[number]) => doc.isReceived);
  const missingDocuments = required
    .filter((doc: (typeof required)[number]) => !doc.isReceived)
    .map((doc: (typeof required)[number]) => doc.label);

  const messageInput = {
    contactName: record.inquiry.contactName,
    caseNumber: record.caseNumber,
    inquiryType: record.inquiry.inquiryType as InquiryType,
    currentStage: record.currentStage as import("@/types/case").CaseStage,
    requiredCount: required.length,
    receivedCount: receivedRequired.length,
    missingDocuments
  };

  return {
    id: record.id,
    caseNumber: record.caseNumber,
    inquiryId: record.inquiryId,
    currentStage: record.currentStage,
    dueDate: record.dueDate ? record.dueDate.toISOString() : null,
    internalMemo: record.internalMemo,
    deadlines: [
      { key: "dueDate", label: "일반 예정일", value: record.dueDate },
      { key: "filingDeadline", label: "제출 마감", value: record.filingDeadline },
      { key: "supplementDeadline", label: "보완 마감", value: record.supplementDeadline },
      { key: "stayExpirationDate", label: "체류 만료일", value: record.stayExpirationDate },
      { key: "internalDeadline", label: "내부 마감", value: record.internalDeadline }
    ].map((deadline) => {
      const status = getDeadlineStatus(deadline.value);
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
    }),
    documents: documentSnapshots,
    stageLogs: record.stageLogs
      .sort((a: CaseStageLogRecord, b: CaseStageLogRecord) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 12)
      .map((log: CaseStageLogRecord) => ({
        id: log.id,
        fromStage: log.fromStage,
        toStage: log.toStage,
        note: log.note,
        createdAt: log.createdAt.toISOString()
      })),
    documentSummary: {
      requiredCount: required.length,
      receivedRequiredCount: receivedRequired.length,
      missingCount: missingDocuments.length,
      missingDocuments
    },
    messageDrafts: {
      contractDocumentGuideKo: buildContractDocumentGuideKo(messageInput),
      missingDocumentsRequestKo: buildMissingDocumentsRequestKo(messageInput),
      statusUpdateKo: buildCaseStatusUpdateKo(messageInput),
      supplementRequestKo: buildSupplementRequestKo(messageInput)
    }
  } satisfies CaseWorkspaceSnapshot;
}

async function getCaseRecordByIdOrThrow(caseId: string) {
  return prisma.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      inquiry: true,
      documents: {
        include: {
          files: true
        }
      },
      stageLogs: true
    }
  });
}

export async function getCaseWorkspaceForInquiry(inquiryId: string) {
  const record = await prisma.caseRecord.findFirst({
    where: { inquiryId },
    include: {
      inquiry: true,
      documents: {
        include: {
          files: true
        }
      },
      stageLogs: true
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  if (!record) {
    return null;
  }

  await ensureCaseDocumentChecklist(prisma, record.id, record.inquiry.inquiryType as InquiryType);
  const refreshed = await getCaseRecordByIdOrThrow(record.id);
  return serializeCaseWorkspace(refreshed);
}

export async function updateCaseStage(
  caseId: string,
  input: {
    stage: CaseStage;
    dueDate?: Date | null;
    filingDeadline?: Date | null;
    supplementDeadline?: Date | null;
    stayExpirationDate?: Date | null;
    internalDeadline?: Date | null;
    internalMemo?: string;
    closedAt?: Date | null;
    closeReason?: string;
    outcomeSummary?: string;
    nextFollowUpDate?: Date | null;
    clientRelationshipStatus?: ClientRelationshipStatus;
    reviewRequested?: boolean;
    reviewCompleted?: boolean;
    referralEligible?: boolean;
    reengagementEligible?: boolean;
    lastFollowUpAt?: Date | null;
    logNote?: string;
  }
) {
  await prisma.$transaction(async (tx) => {
    const current = await tx.caseRecord.findUniqueOrThrow({
      where: { id: caseId },
      select: {
        currentStage: true,
        closedAt: true,
        reviewRequestedAt: true,
        reviewCompletedAt: true
      }
    });

    const isClosingStage = input.stage === "COMPLETED" || input.stage === "CLOSED";

    await tx.caseRecord.update({
      where: { id: caseId },
      data: {
        currentStage: input.stage,
        dueDate: input.dueDate ?? null,
        filingDeadline: input.filingDeadline ?? null,
        supplementDeadline: input.supplementDeadline ?? null,
        stayExpirationDate: input.stayExpirationDate ?? null,
        internalDeadline: input.internalDeadline ?? null,
        internalMemo: input.internalMemo ?? null,
        closedAt:
          input.closedAt !== undefined
            ? input.closedAt
            : isClosingStage
              ? current.closedAt ?? new Date()
              : current.closedAt,
        closeReason: input.closeReason !== undefined ? input.closeReason || null : undefined,
        outcomeSummary: input.outcomeSummary !== undefined ? input.outcomeSummary || null : undefined,
        nextFollowUpDate:
          input.nextFollowUpDate !== undefined ? input.nextFollowUpDate : undefined,
        clientRelationshipStatus: input.clientRelationshipStatus ?? undefined,
        reviewRequestedAt:
          input.reviewRequested === undefined
            ? undefined
            : input.reviewRequested
              ? current.reviewRequestedAt ?? new Date()
              : null,
        reviewCompletedAt:
          input.reviewCompleted === undefined
            ? undefined
            : input.reviewCompleted
              ? current.reviewCompletedAt ?? new Date()
              : null,
        referralEligible:
          input.referralEligible !== undefined ? input.referralEligible : undefined,
        reengagementEligible:
          input.reengagementEligible !== undefined ? input.reengagementEligible : undefined,
        lastFollowUpAt:
          input.lastFollowUpAt !== undefined ? input.lastFollowUpAt : undefined
      }
    });

    if (current.currentStage !== input.stage || input.logNote?.trim()) {
      await tx.caseStageLog.create({
        data: {
          caseId,
          fromStage: current.currentStage,
          toStage: input.stage,
          note: input.logNote?.trim() || null
        }
      });
    }
  });

  return serializeCaseWorkspace(await getCaseRecordByIdOrThrow(caseId));
}

export async function updateCaseDocumentItem(
  caseId: string,
  itemId: string,
  input: {
    isReceived?: boolean;
    note?: string;
  }
) {
  const item = await prisma.caseDocumentItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { id: true, caseId: true, isReceived: true }
  });

  if (item.caseId !== caseId) {
    throw new Error("문서 항목과 사건 정보가 일치하지 않습니다.");
  }

  const nextIsReceived = input.isReceived ?? item.isReceived;
  await prisma.caseDocumentItem.update({
    where: { id: itemId },
    data: {
      isReceived: nextIsReceived,
      receivedAt: nextIsReceived ? (item.isReceived ? undefined : new Date()) : null,
      note: input.note !== undefined ? input.note || null : undefined
    }
  });

  return serializeCaseWorkspace(await getCaseRecordByIdOrThrow(caseId));
}

const MAX_CASE_FILE_SIZE = 20 * 1024 * 1024;

function assertUploadFile(file: File) {
  if (!file || file.size === 0) {
    throw new Error("업로드할 파일을 선택해 주세요.");
  }

  if (file.size > MAX_CASE_FILE_SIZE) {
    throw new Error("파일 크기는 20MB 이하만 업로드할 수 있습니다.");
  }
}

export async function uploadCaseDocumentFile(
  caseId: string,
  itemId: string,
  input: {
    file: File;
    note?: string;
  }
) {
  assertUploadFile(input.file);

  const item = await prisma.caseDocumentItem.findUniqueOrThrow({
    where: { id: itemId },
    include: {
      case: {
        include: {
          inquiry: true
        }
      }
    }
  });

  if (item.caseId !== caseId) {
    throw new Error("문서 항목과 사건 정보가 일치하지 않습니다.");
  }

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const saved = await documentStorage.save({
    caseId,
    documentItemId: itemId,
    originalFilename: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    bytes
  });

  try {
    await prisma.$transaction(async (tx) => {
      const currentMax = await tx.caseDocumentFile.aggregate({
        where: { caseDocumentItemId: itemId },
        _max: { versionNumber: true }
      });
      const nextVersion = (currentMax._max.versionNumber ?? 0) + 1;

      await tx.caseDocumentFile.updateMany({
        where: { caseDocumentItemId: itemId, isCurrentVersion: true },
        data: { isCurrentVersion: false }
      });

      await tx.caseDocumentFile.create({
        data: {
          caseId,
          caseDocumentItemId: itemId,
          originalFilename: input.file.name,
          storedFilename: saved.storedFilename,
          storagePath: saved.storagePath,
          mimeType: input.file.type || "application/octet-stream",
          size: saved.size,
          note: input.note?.trim() || null,
          isCurrentVersion: true,
          versionNumber: nextVersion
        }
      });

      await tx.caseDocumentItem.update({
        where: { id: itemId },
        data: {
          isReceived: true,
          receivedAt: new Date()
        }
      });
    });
  } catch (error) {
    await documentStorage.remove(saved.storagePath).catch(() => undefined);
    throw error;
  }

  return serializeCaseWorkspace(await getCaseRecordByIdOrThrow(caseId));
}

export async function deleteCaseDocumentFile(caseId: string, itemId: string, fileId: string) {
  const target = await prisma.caseDocumentFile.findUniqueOrThrow({
    where: { id: fileId },
    select: {
      id: true,
      caseId: true,
      caseDocumentItemId: true,
      storagePath: true,
      isCurrentVersion: true
    }
  });

  if (target.caseId !== caseId || target.caseDocumentItemId !== itemId) {
    throw new Error("파일 정보와 사건/문서 항목이 일치하지 않습니다.");
  }

  const submissionLinkedCount = await prisma.submissionPackageItem.count({
    where: { caseDocumentFileId: fileId }
  });

  if (submissionLinkedCount > 0) {
    throw new Error("제출 패키지에 포함된 파일은 삭제할 수 없습니다. 새 버전을 업로드해 주세요.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.caseDocumentFile.delete({ where: { id: fileId } });

    if (target.isCurrentVersion) {
      const latest = await tx.caseDocumentFile.findFirst({
        where: { caseDocumentItemId: itemId },
        orderBy: [{ versionNumber: "desc" }, { uploadedAt: "desc" }]
      });

      if (latest) {
        await tx.caseDocumentFile.update({
          where: { id: latest.id },
          data: { isCurrentVersion: true }
        });
        await tx.caseDocumentItem.update({
          where: { id: itemId },
          data: { isReceived: true }
        });
      } else {
        await tx.caseDocumentItem.update({
          where: { id: itemId },
          data: {
            isReceived: false,
            receivedAt: null
          }
        });
      }
    }
  });

  await documentStorage.remove(target.storagePath).catch(() => undefined);
  return serializeCaseWorkspace(await getCaseRecordByIdOrThrow(caseId));
}

export async function setCurrentCaseDocumentFile(caseId: string, itemId: string, fileId: string) {
  const target = await prisma.caseDocumentFile.findUniqueOrThrow({
    where: { id: fileId },
    select: {
      id: true,
      caseId: true,
      caseDocumentItemId: true
    }
  });

  if (target.caseId !== caseId || target.caseDocumentItemId !== itemId) {
    throw new Error("파일 정보와 사건/문서 항목이 일치하지 않습니다.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.caseDocumentFile.updateMany({
      where: { caseDocumentItemId: itemId, isCurrentVersion: true },
      data: { isCurrentVersion: false }
    });

    await tx.caseDocumentFile.update({
      where: { id: fileId },
      data: { isCurrentVersion: true }
    });

    await tx.caseDocumentItem.update({
      where: { id: itemId },
      data: {
        isReceived: true,
        receivedAt: new Date()
      }
    });
  });

  return serializeCaseWorkspace(await getCaseRecordByIdOrThrow(caseId));
}

export async function updateCaseDocumentFileNote(
  caseId: string,
  itemId: string,
  fileId: string,
  note?: string
) {
  const target = await prisma.caseDocumentFile.findUniqueOrThrow({
    where: { id: fileId },
    select: {
      id: true,
      caseId: true,
      caseDocumentItemId: true
    }
  });

  if (target.caseId !== caseId || target.caseDocumentItemId !== itemId) {
    throw new Error("파일 정보와 사건/문서 항목이 일치하지 않습니다.");
  }

  await prisma.caseDocumentFile.update({
    where: { id: fileId },
    data: { note: note?.trim() || null }
  });

  return serializeCaseWorkspace(await getCaseRecordByIdOrThrow(caseId));
}

export async function readCaseDocumentFile(caseId: string, itemId: string, fileId: string) {
  const target = await prisma.caseDocumentFile.findUniqueOrThrow({
    where: { id: fileId },
    select: {
      id: true,
      caseId: true,
      caseDocumentItemId: true,
      originalFilename: true,
      mimeType: true,
      storagePath: true
    }
  });

  if (target.caseId !== caseId || target.caseDocumentItemId !== itemId) {
    throw new Error("파일 정보와 사건/문서 항목이 일치하지 않습니다.");
  }

  const fileBuffer = await documentStorage.read(target.storagePath);
  return {
    originalFilename: target.originalFilename,
    mimeType: target.mimeType,
    fileBuffer
  };
}
