import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmPayment } from "@/lib/services/payment-service";
import { notifyClient } from "@/lib/services/notify-orchestrator";
import { issueTaxInvoice } from "@/lib/services/tax-invoice-service";
import { prisma } from "@/lib/prisma/client";
import { captureError } from "@/lib/services/error-monitor-service";
import { requirePortalUser } from "@/lib/security/portal-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const confirmSchema = z.object({
  paymentKey: z.string().min(1).max(200),
  orderId: z.string().min(1).max(200),
  amount: z.number().int().positive().max(100_000_000),
});

export async function POST(req: Request) {
  // 인증 필수. 예전에는 누구나 임의의 orderId 로 호출해 사건을 "입금 완료"로
  // 바꾸고 실제 의뢰인에게 입금 확인 알림·세금계산서를 발생시킬 수 있었다.
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;

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

  // 이 주문이 정말 본인 것인지 확인한다. 주문은 checkout 에서 만들어지며
  // customerEmail 에 결제 요청 당시의 이메일이 남는다.
  const order = await prisma.payment.findUnique({
    where: { orderId },
    select: { customerEmail: true, amount: true },
  });
  if (!order) {
    return NextResponse.json({ ok: false, error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (
    !order.customerEmail ||
    order.customerEmail.trim().toLowerCase() !== authed.email.trim().toLowerCase()
  ) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
  // 승인 금액은 서버에 저장된 주문 금액과 일치해야 한다 — 본문 금액만 믿지 않는다.
  if (order.amount !== amount) {
    return NextResponse.json({ ok: false, error: "금액이 주문과 다릅니다." }, { status: 400 });
  }

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
          parties: {
            select: { phone: true, name: true, email: true, organization: true },
            take: 1,
          },
        },
      });
      const party = caseMatter?.parties[0];
      if (caseMatter?.title) {
        const amt = amount.toLocaleString("ko-KR") + "원";
        await notifyClient({
          phone: party?.phone,
          email: party?.email,
          templateId:
            process.env.SOLAPI_TEMPLATE_PAYMENT?.trim() || "payment_received",
          variables: { 사건명: caseMatter.title, 금액: amt },
          fallbackText: `[ETHOS] ${caseMatter.title} 입금 확인 — ${amt}`,
          emailSubject: `[ETHOS] ${caseMatter.title} 입금 확인`,
          emailHtml: `<p>${party?.name ?? "고객"}님, <strong>${caseMatter.title}</strong> 사건의 ${amt} 입금이 확인되었습니다. 감사합니다.</p>`,
          caseId,
        });
      }

      // 전자세금계산서 자동 발행 (바로빌 미설정 시 DRAFT만)
      const payment = await prisma.payment.findUnique({
        where: { orderId },
        select: { id: true },
      });
      if (party?.name && caseMatter?.title) {
        await issueTaxInvoice({
          paymentId: payment?.id,
          caseId,
          totalAmount: amount,
          customerName: party.name,
          customerEmail: party.email ?? undefined,
          itemName: `${caseMatter.title} 수임료`,
        });
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
