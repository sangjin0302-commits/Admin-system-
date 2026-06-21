import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmPayment } from "@/lib/services/payment-service";
import { notifyPaymentReceived } from "@/lib/services/kakao-notification-service";
import { prisma } from "@/lib/prisma/client";
import { captureError } from "@/lib/services/error-monitor-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const confirmSchema = z.object({
  paymentKey: z.string().min(1).max(200),
  orderId: z.string().min(1).max(200),
  amount: z.number().int().positive().max(100_000_000),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "invalid body" },
      { status: 400 }
    );
  }

  const { paymentKey, orderId, amount } = parsed.data;
  const result = await confirmPayment(paymentKey, orderId, amount);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "결제 승인 실패" },
      { status: 402 }
    );
  }

  // orderId 컨벤션: CASE-<caseId>-<suffix>
  const caseIdMatch = orderId.match(/^CASE-([^-]+)-/);
  const caseId = caseIdMatch?.[1];

  if (caseId) {
    try {
      await prisma.caseAccountingMemo.updateMany({
        where: { caseId },
        data: {
          paymentStatus: "PAID",
          paidAmount: amount,
          paidAt: new Date(),
          paymentMemo: `Toss confirm · paymentKey=${paymentKey}`,
        },
      });

      // 알림톡 클로즈드 루프 — 의뢰인에게 입금 확인 자동 발송
      const caseMatter = await prisma.caseMatter.findUnique({
        where: { id: caseId },
        select: {
          title: true,
          parties: { select: { phone: true }, take: 1 },
        },
      });
      const phone = caseMatter?.parties[0]?.phone;
      if (phone && caseMatter?.title) {
        await notifyPaymentReceived(phone, caseMatter.title, amount, caseId);
      }
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)), {
        caseId,
        paymentKey,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    transactionId: result.transactionId,
    receiptUrl: result.receiptUrl,
  });
}
