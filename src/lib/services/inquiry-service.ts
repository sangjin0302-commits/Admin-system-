import type { Prisma } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { dispatchInitialClientMessage } from "@/lib/services/client-message-service";
import {
  buildAppendInquiryCommunicationUpdateData,
  type AppendInquiryCommunicationPayload
} from "@/lib/services/inquiry-communication-helpers";
import {
  InquiryConcurrentUpdateError,
  buildInquiryAdminUpdateData,
  validateAndPrepareInquiryAdminUpdate,
  type UpdateInquiryAdminPayload
} from "@/lib/services/inquiry-admin-update-helpers";
import { syncInquiryConsultationSnapshot } from "@/lib/services/inquiry-consultation-sync-helpers";
import {
  INTAKE_DEDUP_WINDOW_MS,
  buildIntakeDedupKey,
  getInflightInquiryCreateMap
} from "@/lib/services/inquiry-create-dedup-helpers";
import {
  buildCreateInquiryData,
  buildFinalizedMessageArtifacts,
  evaluateCreateInquiryInput,
  type CreateInquiryInput
} from "@/lib/services/inquiry-create-helpers";
import {
  buildInquiryListWhere,
  sortInquiriesByUrgency,
  type InquiryListFilters
} from "@/lib/services/inquiry-list-helpers";
import {
  buildInquiryMessagePreviewSetForInquiry,
  type InquiryMessagePreviewInput
} from "@/lib/services/inquiry-message-preview-helpers";
import {
  InquiryStatusGuardError,
  buildInquiryStatusGuardPreview,
  parseInquiryCommunicationLogs,
  type InquiryCommunicationChannel,
  type InquiryCommunicationLogEntry,
  type InquiryStatusGuardPreview,
  type StatusChangeSource,
  type StatusTransitionGuardContext
} from "@/lib/services/inquiry-guard-helpers";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry-safe";
import type {
  AdminSort,
  InquiryStatus,
  InquiryType
} from "@/types/inquiry";

export { InquiryStatusGuardError, buildInquiryStatusGuardPreview, parseInquiryCommunicationLogs };
export { InquiryConcurrentUpdateError };
export type {
  InquiryCommunicationChannel,
  InquiryCommunicationLogEntry,
  InquiryStatusGuardPreview,
  StatusChangeSource,
  StatusTransitionGuardContext
};

type PersistLawbotSnapshotInput = {
  inquiryId: string;
  status: string;
  summary: string;
  payload: {
    input_summary?: string;
    practical_use_status?: string;
    confidence_score?: number;
    confidence_label?: string;
    match_reason?: string;
    research_goal?: string;
    review_required_reasons?: string[];
    critical_missing_facts?: string[];
    priority_actions?: string[];
    risk_flags?: string[];
    practical_checklist?: string[];
    document_checklist?: string[];
  };
};

export async function createInquiry(payload: unknown) {
  const input: CreateInquiryInput = parseCreateInquiryInput(payload);
  const dedupKey = buildIntakeDedupKey({
    email: input.email,
    title: input.title,
    description: input.description
  });
  const inflightMap = getInflightInquiryCreateMap();
  const existingInflight = inflightMap.get(dedupKey);
  if (existingInflight) {
    return (await existingInflight) as Awaited<ReturnType<typeof prisma.inquiry.create>>;
  }

  const creationPromise = (async () => {
    const dedupStart = new Date(Date.now() - INTAKE_DEDUP_WINDOW_MS);
    const existingRecentInquiry = await prisma.inquiry.findFirst({
      where: {
        email: input.email,
        title: input.title,
        description: input.description,
        createdAt: {
          gte: dedupStart
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    if (existingRecentInquiry) {
      return existingRecentInquiry;
    }

    const derived = evaluateCreateInquiryInput(input);

    const created = await prisma.inquiry.create({
      data: buildCreateInquiryData(input, derived)
    });
    const artifacts = await buildFinalizedMessageArtifacts(created, derived.messageInputDraft);

    const updated = await prisma.inquiry.update({
      where: { id: created.id },
      data: {
        generatedGuidance: artifacts.guidance,
        generatedReceiptMessage: artifacts.receiptMessage
      }
    });

    await dispatchInitialClientMessage({
      inquiryId: updated.id,
      preview: artifacts.preview
    });

    try {
      await syncInquiryConsultationSnapshot(updated, {
        classificationReasonOverride: updated.classificationReason
      });
    } catch (error) {
      console.error("Failed to sync consultation to Notion", error);
    }

    return updated;
  })();

  inflightMap.set(dedupKey, creationPromise);
  try {
    return await creationPromise;
  } finally {
    if (inflightMap.get(dedupKey) === creationPromise) {
      inflightMap.delete(dedupKey);
    }
  }
}

export async function listInquiries(filters: InquiryListFilters = {}) {
  const inquiries = await prisma.inquiry.findMany({
    where: buildInquiryListWhere(filters),
    orderBy: [{ createdAt: "desc" }]
  });

  if (filters.sort === "urgency") {
    return sortInquiriesByUrgency(inquiries);
  }

  return inquiries;
}

export async function getInquiryById(id: string) {
  return prisma.inquiry.findUnique({
    where: { id }
  });
}

export async function persistLawbotSnapshot(input: PersistLawbotSnapshotInput) {
  return prisma.inquiry.update({
    where: { id: input.inquiryId },
    data: {
      lawbotLastAnalyzedAt: new Date(),
      lawbotSnapshotVersion: 1,
      lawbotSnapshotStatus: input.status,
      lawbotSnapshotSummary: input.summary,
      lawbotSnapshotPayload: JSON.stringify(input.payload)
    }
  });
}

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

export function getInquiryMessagePreviewSet(inquiry: InquiryMessagePreviewInput) {
  return buildInquiryMessagePreviewSetForInquiry(inquiry);
}

export type InquiryRecord = Awaited<ReturnType<typeof getInquiryById>>;

