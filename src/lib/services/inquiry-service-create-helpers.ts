import { prisma } from "@/lib/prisma/client";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry-safe";
import { dispatchInitialClientMessage } from "@/lib/services/client-message-service";
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
  buildPublicTrackingCommunicationLogEntry,
  generatePublicTrackingCode,
  getKoreaMonthRange
} from "@/lib/services/public-tracking-code-service";

async function getNextPublicTrackingMonthlySequence(createdAt: Date) {
  const monthRange = getKoreaMonthRange(createdAt);
  const existingCount = await prisma.inquiry.count({
    where: {
      createdAt: {
        gte: monthRange.start,
        lt: monthRange.end
      }
    }
  });

  return existingCount + 1;
}

async function buildAvailablePublicTrackingCode(input: CreateInquiryInput, createdAt: Date) {
  const monthlySequence = await getNextPublicTrackingMonthlySequence(createdAt);

  // This first phase stores the public code in communicationLogs for schema compatibility.
  // The random check code and retry reduce collision risk, but /track should move this to
  // a dedicated unique indexed column before public lookup is enabled.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const trackingCode = generatePublicTrackingCode({
      category: input.category,
      createdAt,
      monthlySequence
    });
    const existing = await prisma.inquiry.findFirst({
      where: {
        communicationLogs: {
          contains: trackingCode
        }
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return trackingCode;
    }
  }

  throw new Error("Failed to allocate public tracking code.");
}

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
    const createdAt = new Date();
    const publicTrackingCode = await buildAvailablePublicTrackingCode(input, createdAt);
    const publicTrackingLog = buildPublicTrackingCommunicationLogEntry(publicTrackingCode, createdAt);

    const created = await prisma.inquiry.create({
      data: {
        ...buildCreateInquiryData(input, derived),
        createdAt,
        communicationLogs: JSON.stringify([publicTrackingLog])
      }
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
