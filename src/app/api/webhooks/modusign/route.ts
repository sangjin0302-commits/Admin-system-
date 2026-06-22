import { NextResponse } from "next/server";
import {
  applyWebhookStatus,
  verifyModusignWebhook,
} from "@/lib/services/e-signature-service";
import { notifyESignCompleted } from "@/lib/services/kakao-notification-service";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_MAP: Record<string, "SIGNED" | "REJECTED" | "EXPIRED"> = {
  document_signed: "SIGNED",
  document_completed: "SIGNED",
  document_rejected: "REJECTED",
  document_canceled: "REJECTED",
  document_expired: "EXPIRED",
};

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-modusign-signature");

  if (!verifyModusignWebhook(raw, signature)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  let payload: { event?: string; data?: { id?: string; documentId?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const eventName = (payload.event ?? "").toLowerCase();
  const mapped = STATUS_MAP[eventName];
  const externalId = payload.data?.id ?? payload.data?.documentId;

  if (!mapped || !externalId) {
    logger.warn(`[modusign-webhook] ignored event=${eventName} id=${externalId}`);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const updated = await applyWebhookStatus(externalId, mapped);

  // 알림톡 클로즈드 루프 — 서명 완료시 의뢰인에게 자동 발송
  if (mapped === "SIGNED" && updated) {
    try {
      const req = await prisma.eSignRequest.findUnique({
        where: { externalId },
        select: {
          documentTitle: true,
          signerName: true,
          caseId: true,
        },
      });
      if (req?.caseId) {
        const caseMatter = await prisma.caseMatter.findUnique({
          where: { id: req.caseId },
          select: { parties: { select: { phone: true }, take: 1 } },
        });
        const phone = caseMatter?.parties[0]?.phone;
        if (phone) {
          await notifyESignCompleted(
            phone,
            req.documentTitle,
            req.signerName,
            req.caseId
          );
        }
      }
    } catch (err) {
      logger.error("[modusign-webhook] alimtalk notify failed", err);
    }
  }

  logger.info(`[modusign-webhook] event=${eventName} id=${externalId} updated=${updated}`);
  return NextResponse.json({ ok: true, updated });
}
