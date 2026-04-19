import { prisma } from "@/lib/prisma/client";
import {
  buildAppendInquiryCommunicationUpdateData,
  type AppendInquiryCommunicationPayload
} from "@/lib/services/inquiry-communication-helpers";
import {
  buildInquiryAdminUpdateData,
  validateAndPrepareInquiryAdminUpdate,
  type UpdateInquiryAdminPayload
} from "@/lib/services/inquiry-admin-update-helpers";
import { syncInquiryConsultationSnapshot } from "@/lib/services/inquiry-consultation-sync-helpers";
import { parseInquiryCommunicationLogs } from "@/lib/services/inquiry-guard-helpers";
import type { InquiryStatus } from "@/types/inquiry";

export async function updateInquiryAdminFields(
  id: string,
  payload: UpdateInquiryAdminPayload
) {
  const current = await prisma.inquiry.findUnique({
    where: { id },
    select: {
      updatedAt: true,
      status: true,
      email: true,
      phone: true,
      description: true,
      requestedOutcome: true,
      hasPreparedDocuments: true,
      internalMemo: true,
      communicationLogs: true,
      lawbotSnapshotPayload: true,
      _count: {
        select: {
          quotes: true
        }
      }
    }
  });

  if (!current) {
    throw new Error("Inquiry not found.");
  }

  const { currentLogs, statusChangeEntry } = validateAndPrepareInquiryAdminUpdate(
    {
      ...current,
      status: current.status as InquiryStatus
    },
    payload
  );

  const updated = await prisma.inquiry.update({
    where: { id },
    data: buildInquiryAdminUpdateData(payload, currentLogs, statusChangeEntry)
  });

  try {
    await syncInquiryConsultationSnapshot(updated, {
      classificationReasonOverride: updated.internalMemo ?? updated.classificationReason
    });
  } catch (error) {
    console.error("Failed to refresh consultation Notion sync", error);
  }

  return updated;
}

export async function appendInquiryCommunicationLog(
  id: string,
  payload: AppendInquiryCommunicationPayload
) {
  const existing = await prisma.inquiry.findUniqueOrThrow({
    where: { id }
  });

  const currentLogs = parseInquiryCommunicationLogs(existing.communicationLogs);

  const updated = await prisma.inquiry.update({
    where: { id },
    data: buildAppendInquiryCommunicationUpdateData(payload, currentLogs)
  });

  try {
    await syncInquiryConsultationSnapshot(updated, {
      classificationReasonOverride: updated.internalMemo ?? updated.classificationReason
    });
  } catch (error) {
    console.error("Failed to refresh consultation Notion sync after communication log append", error);
  }

  return updated;
}

export type {
  AppendInquiryCommunicationPayload,
  UpdateInquiryAdminPayload
};
