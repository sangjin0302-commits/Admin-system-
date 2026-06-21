import { NextResponse } from "next/server";
import { verifyTossWebhook } from "@/lib/services/payment-service";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TOSS_STATUS_MAP: Record<string, "PAID" | "CANCELED" | "PENDING" | "FAILED"> = {
  DONE: "PAID",
  PARTIAL_CANCELED: "PAID",
  CANCELED: "CANCELED",
  EXPIRED: "FAILED",
  ABORTED: "FAILED",
  WAITING_FOR_DEPOSIT: "PENDING",
  IN_PROGRESS: "PENDING",
  READY: "PENDING",
};

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("tosspayments-webhook-signature");

  if (!verifyTossWebhook(raw, signature)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  let payload: {
    eventType?: string;
    data?: {
      orderId?: string;
      paymentKey?: string;
      status?: string;
      totalAmount?: number;
      approvedAt?: string;
    };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const data = payload.data ?? {};
  const orderId = data.orderId;
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "missing orderId" }, { status: 400 });
  }

  const status = data.status ? TOSS_STATUS_MAP[data.status] ?? "PENDING" : "PENDING";

  try {
    // orderId 컨벤션: CASE-<caseId> 형식 또는 자유 — 매칭 가능한 메모만 업데이트
    const caseId = orderId.startsWith("CASE-") ? orderId.slice(5) : null;
    if (caseId) {
      await prisma.caseAccountingMemo.updateMany({
        where: { caseId },
        data: {
          paymentStatus: status === "PAID" ? "PAID" : status === "CANCELED" ? "REFUNDED" : "UNPAID",
          paidAmount: status === "PAID" ? data.totalAmount ?? undefined : undefined,
          paidAt: status === "PAID" && data.approvedAt ? new Date(data.approvedAt) : undefined,
          paymentMemo: `Toss ${payload.eventType ?? data.status ?? "WEBHOOK"} · paymentKey=${data.paymentKey ?? "n/a"}`,
        },
      });
    }

    logger.info(`[toss-webhook] orderId=${orderId} status=${data.status}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), { orderId });
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
