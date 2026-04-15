import type {
  ClientRelationshipStatus,
  FollowUpActionStatus,
  FollowUpActionType,
  Prisma,
  PrismaClient
} from "@generated/prisma-client/client";

import {
  buildCaseClosureNoticeKo,
  buildReferralRequestKo,
  buildReengagementMessageKo,
  buildRelationshipFollowUpDraftKo,
  buildReviewRequestKo
} from "@/lib/message-templates/client-relationship";
import { prisma } from "@/lib/prisma/client";

type CaseRelationshipRecord = Prisma.CaseRecordGetPayload<{
  include: {
    inquiry: true;
    followUpActions: true;
  };
}>;

type FollowUpActionRecord = CaseRelationshipRecord["followUpActions"][number];
type ClientRelationshipTxDb = {
  followUpAction: Pick<PrismaClient["followUpAction"], "create" | "update">;
  caseRecord: Pick<PrismaClient["caseRecord"], "update">;
};

export type ClientRelationshipWorkspace = {
  caseId: string;
  caseNumber: string;
  inquiryId: string;
  currentStage: string;
  closure: {
    closedAt: string | null;
    closeReason: string | null;
    outcomeSummary: string | null;
    nextFollowUpDate: string | null;
  };
  relationship: {
    clientRelationshipStatus: ClientRelationshipStatus;
    reviewRequested: boolean;
    reviewCompleted: boolean;
    referralEligible: boolean;
    reengagementEligible: boolean;
    lastFollowUpAt: string | null;
  };
  followUpActions: Array<{
    id: string;
    type: FollowUpActionType;
    status: FollowUpActionStatus;
    title: string;
    note: string | null;
    dueDate: string | null;
    completedAt: string | null;
    createdAt: string;
    messageDraft: string;
  }>;
  messageDrafts: {
    closeNoticeKo: string;
    reviewRequestKo: string;
    referralRequestKo: string;
    reengagementKo: string;
  };
};

function serializeWorkspace(record: CaseRelationshipRecord): ClientRelationshipWorkspace {
  const input = {
    contactName: record.inquiry.contactName,
    caseNumber: record.caseNumber,
    closeReason: record.closeReason,
    outcomeSummary: record.outcomeSummary,
    nextFollowUpDate: record.nextFollowUpDate?.toISOString() ?? null,
    clientRelationshipStatus: record.clientRelationshipStatus
  };

  return {
    caseId: record.id,
    caseNumber: record.caseNumber,
    inquiryId: record.inquiryId,
    currentStage: record.currentStage,
    closure: {
      closedAt: record.closedAt?.toISOString() ?? null,
      closeReason: record.closeReason,
      outcomeSummary: record.outcomeSummary,
      nextFollowUpDate: record.nextFollowUpDate?.toISOString() ?? null
    },
    relationship: {
      clientRelationshipStatus: record.clientRelationshipStatus,
      reviewRequested: Boolean(record.reviewRequestedAt),
      reviewCompleted: Boolean(record.reviewCompletedAt),
      referralEligible: record.referralEligible,
      reengagementEligible: record.reengagementEligible,
      lastFollowUpAt: record.lastFollowUpAt?.toISOString() ?? null
    },
    followUpActions: record.followUpActions
      .slice()
      .sort((left: FollowUpActionRecord, right: FollowUpActionRecord) => {
        if (left.status !== right.status) {
          return left.status === "PENDING" ? -1 : 1;
        }

        if (left.dueDate && right.dueDate) {
          return left.dueDate.getTime() - right.dueDate.getTime();
        }

        if (left.dueDate) return -1;
        if (right.dueDate) return 1;
        return right.createdAt.getTime() - left.createdAt.getTime();
      })
      .map((action: FollowUpActionRecord) => ({
        id: action.id,
        type: action.type,
        status: action.status,
        title: action.title,
        note: action.note,
        dueDate: action.dueDate?.toISOString() ?? null,
        completedAt: action.completedAt?.toISOString() ?? null,
        createdAt: action.createdAt.toISOString(),
        messageDraft: action.messageDraft
      })),
    messageDrafts: {
      closeNoticeKo: buildCaseClosureNoticeKo(input),
      reviewRequestKo: buildReviewRequestKo(input),
      referralRequestKo: buildReferralRequestKo(input),
      reengagementKo: buildReengagementMessageKo(input)
    }
  };
}

async function getCaseRelationshipRecord(caseId: string) {
  return prisma.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      inquiry: true,
      followUpActions: true
    }
  });
}

function buildDefaultTitle(type: FollowUpActionType, caseNumber: string) {
  if (type === "REVIEW_REQUEST") return `${caseNumber} 후기 요청`;
  if (type === "REFERRAL_CHECK") return `${caseNumber} 추천 가능 고객 확인`;
  return `${caseNumber} 재의뢰 안부`;
}

function inferRelationshipStatus(type: FollowUpActionType): ClientRelationshipStatus {
  if (type === "REVIEW_REQUEST") return "REVIEW_REQUESTED";
  if (type === "REFERRAL_CHECK") return "REFERRAL_POTENTIAL";
  return "FOLLOW_UP_NEEDED";
}

export async function getClientRelationshipWorkspaceForInquiry(inquiryId: string) {
  const record = await prisma.caseRecord.findFirst({
    where: { inquiryId },
    include: {
      inquiry: true,
      followUpActions: true
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  if (!record) {
    return null;
  }

  return serializeWorkspace(record);
}

export async function updateClientRelationship(
  caseId: string,
  input: {
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
  }
) {
  const current = await prisma.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    select: {
      closedAt: true,
      reviewRequestedAt: true,
      reviewCompletedAt: true
    }
  });

  await prisma.caseRecord.update({
    where: { id: caseId },
    data: {
      closedAt:
        input.closedAt !== undefined ? input.closedAt : current.closedAt,
      closeReason: input.closeReason !== undefined ? input.closeReason || null : undefined,
      outcomeSummary: input.outcomeSummary !== undefined ? input.outcomeSummary || null : undefined,
      nextFollowUpDate: input.nextFollowUpDate !== undefined ? input.nextFollowUpDate : undefined,
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

  return serializeWorkspace(await getCaseRelationshipRecord(caseId));
}

export async function createCaseFollowUpAction(
  caseId: string,
  input: {
    type: FollowUpActionType;
    dueDate?: Date | null;
    note?: string;
    title?: string;
  }
) {
  const record = await getCaseRelationshipRecord(caseId);
  const messageDraft = buildRelationshipFollowUpDraftKo(input.type, {
    contactName: record.inquiry.contactName,
    caseNumber: record.caseNumber,
    closeReason: record.closeReason,
    outcomeSummary: record.outcomeSummary,
    nextFollowUpDate: input.dueDate?.toISOString() ?? record.nextFollowUpDate?.toISOString() ?? null,
    clientRelationshipStatus: record.clientRelationshipStatus
  });

  await prisma.$transaction(async (tx) => {
    const db = tx as unknown as ClientRelationshipTxDb;
    await db.followUpAction.create({
      data: {
        caseId,
        type: input.type,
        title: input.title?.trim() || buildDefaultTitle(input.type, record.caseNumber),
        note: input.note?.trim() || null,
        dueDate: input.dueDate ?? null,
        messageDraft
      }
    });

    await db.caseRecord.update({
      where: { id: caseId },
      data: {
        nextFollowUpDate:
          input.dueDate ?? record.nextFollowUpDate,
        clientRelationshipStatus: inferRelationshipStatus(input.type),
        reviewRequestedAt:
          input.type === "REVIEW_REQUEST"
            ? record.reviewRequestedAt ?? new Date()
            : undefined,
        referralEligible:
          input.type === "REFERRAL_CHECK" ? true : undefined,
        reengagementEligible:
          input.type === "REENGAGEMENT" ? true : undefined,
        lastFollowUpAt: new Date()
      }
    });
  });

  return serializeWorkspace(await getCaseRelationshipRecord(caseId));
}

export async function updateCaseFollowUpAction(
  caseId: string,
  followUpId: string,
  input: {
    status?: FollowUpActionStatus;
    dueDate?: Date | null;
    note?: string;
    title?: string;
  }
) {
  const record = await getCaseRelationshipRecord(caseId);
  const action = record.followUpActions.find((item: FollowUpActionRecord) => item.id === followUpId);

  if (!action) {
    throw new Error("해당 후속조치를 찾을 수 없습니다.");
  }

  await prisma.$transaction(async (tx) => {
    const db = tx as unknown as ClientRelationshipTxDb;
    await db.followUpAction.update({
      where: { id: followUpId },
      data: {
        status: input.status ?? undefined,
        dueDate: input.dueDate !== undefined ? input.dueDate : undefined,
        note: input.note !== undefined ? input.note.trim() || null : undefined,
        title: input.title !== undefined ? input.title.trim() || action.title : undefined,
        completedAt:
          input.status === "COMPLETED"
            ? action.completedAt ?? new Date()
            : input.status === "PENDING"
              ? null
              : undefined
      }
    });

    if (input.status === "COMPLETED") {
      await db.caseRecord.update({
        where: { id: caseId },
        data: {
          lastFollowUpAt: new Date(),
          reviewCompletedAt:
            action.type === "REVIEW_REQUEST" ? new Date() : undefined,
          clientRelationshipStatus:
            action.type === "REENGAGEMENT" ? "RETURNING_CLIENT" : undefined
        }
      });
    }

    if (input.dueDate !== undefined) {
      await db.caseRecord.update({
        where: { id: caseId },
        data: { nextFollowUpDate: input.dueDate }
      });
    }
  });

  return serializeWorkspace(await getCaseRelationshipRecord(caseId));
}
