import { Prisma } from "@generated/prisma-client/client";

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
  getKoreaMonthRange,
  normalizePhoneLast4
} from "@/lib/services/public-tracking-code-service";
import { broadcastAdminEvent } from "@/app/api/admin/events/route";
import { logger } from "@/lib/utils/logger";

function isPublicTrackingCodeCollision(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    String(error.meta?.target ?? "").includes("publicTrackingCode")
  );
}

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

  // The monthly sequence is count-based, so concurrent submissions can race on the same
  // sequence. The unique publicTrackingCode field plus random check code/retry keeps the
  // allocation fail-closed until a stronger transactional sequence allocator is added.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const trackingCode = generatePublicTrackingCode({
      category: input.category,
      createdAt,
      monthlySequence
    });
    const existing = await prisma.inquiry.findFirst({
      where: {
        OR: [
          { publicTrackingCode: trackingCode },
          {
            communicationLogs: {
              contains: trackingCode
            }
          }
        ]
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
    const publicTrackingPhoneLast4 = normalizePhoneLast4(input.phone);
    let created: Awaited<ReturnType<typeof prisma.inquiry.create>> | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const createdAt = new Date();
      const publicTrackingCode = await buildAvailablePublicTrackingCode(input, createdAt);
      const publicTrackingLog = buildPublicTrackingCommunicationLogEntry(publicTrackingCode, createdAt);

      try {
        created = await prisma.inquiry.create({
          data: {
            ...buildCreateInquiryData(input, derived),
            createdAt,
            publicTrackingCode,
            publicTrackingPhoneLast4,
            publicTrackingIssuedAt: createdAt,
            communicationLogs: JSON.stringify([publicTrackingLog])
          }
        });
        break;
      } catch (error) {
        if (!isPublicTrackingCodeCollision(error) || attempt === 4) {
          throw error;
        }
      }
    }

    if (!created) {
      throw new Error("Failed to create inquiry with public tracking code.");
    }
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
      logger.error("Failed to sync consultation to Notion", error);
    }

    // Broadcast real-time SSE event to admin clients
    try {
      broadcastAdminEvent({
        type: "inquiry_new",
        data: { name: updated.contactName, category: updated.intakeCategory },
        timestamp: new Date().toISOString(),
      });
    } catch {
      // SSE broadcast is best-effort
    }

    // Webhook dispatch (fire-and-forget)
    try {
      const { dispatchWebhook } = await import("@/lib/services/webhook-dispatch-service");
      dispatchWebhook("inquiry.created", {
        id: updated.id,
        name: updated.contactName,
        category: updated.intakePracticeArea ?? updated.intakeCategory,
      }).catch((err) => logger.warn("[webhook] inquiry.created dispatch error", err));
    } catch {
      // webhook dispatch is best-effort
    }

    // 자동 lawbot 분석 (best-effort, await 안 함 — 응답 지연 방지)
    if (process.env.LAWBOT_BRIDGE_BASE_URL) {
      const { autoAnalyzeInquiryWithLawbot } = await import("@/lib/services/auto-lawbot-analysis");
      autoAnalyzeInquiryWithLawbot({
        inquiryId: updated.id,
        factInput: `${updated.title}\n${updated.description}`,
        intakeCategoryKey: updated.intakeCategory
      }).catch((err) => logger.warn("[auto-lawbot] background error", err));
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
