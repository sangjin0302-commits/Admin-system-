import { NextResponse } from "next/server";
import {
  applyWebhookStatus,
  verifyModusignWebhook,
} from "@/lib/services/e-signature-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_MAP: Record<string, "signed" | "rejected" | "expired"> = {
  document_signed: "signed",
  document_completed: "signed",
  document_rejected: "rejected",
  document_canceled: "rejected",
  document_expired: "expired",
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

  const updated = applyWebhookStatus(externalId, mapped);
  logger.info(`[modusign-webhook] event=${eventName} id=${externalId} updated=${updated}`);
  return NextResponse.json({ ok: true, updated });
}
