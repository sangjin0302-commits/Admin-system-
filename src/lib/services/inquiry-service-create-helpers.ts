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
