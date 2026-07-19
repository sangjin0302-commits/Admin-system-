import { NextResponse } from "next/server";
import { verifyTossWebhook } from "@/lib/services/payment-service";
import { issueTaxInvoice } from "@/lib/services/tax-invoice-service";
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
    // orderId 컨벤션은 `CASE-<caseId>-<suffix>` 다(payments/checkout, create-session).
    // 예전에는 slice(5) 로 잘라 "<caseId>-<suffix>" 가 나왔고, 그런 caseId 는
    // 존재하지 않아 updateMany 가 0건만 맞췄다 — 실제 웹훅이 아무것도 기록하지 못했다.
    // confirm 라우트가 쓰는 정규식과 동일하게 맞춘다.
    const caseId = orderId.match(/^CASE-([^-]+)-/)?.[1] ?? null;
    if (caseId) {
      await prisma.caseAccountingMemo.updateMany({
        where: { caseId },
        data: {
          // 이미 PAID 인 건을 진행 중 상태(WAITING_FOR_DEPOSIT 등) 웹훅이 뒤늦게
          // 덮어 UNPAID 로 되돌리지 않도록, 확정 상태일 때만 값을 바꾼다.
          paymentStatus: status === "PAID" ? "PAID" : status === "CANCELED" ? "REFUNDED" : undefined,
          paidAmount: status === "PAID" ? data.totalAmount ?? undefined : undefined,
          paidAt: status === "PAID" && data.approvedAt ? new Date(data.approvedAt) : undefined,
          paymentMemo: `Toss ${payload.eventType ?? data.status ?? "WEBHOOK"} · paymentKey=${data.paymentKey ?? "n/a"}`,
        },
      });
    }

    // 결제 확인(PAID) 시 세금계산서 자동 발행 (fire-and-forget)
    if (status === "PAID") {
      const payment = await prisma.payment
        .findUnique({ where: { orderId } })
        .catch(() => null);

      if (payment) {
        // 사업자번호가 있는 경우에만 세금계산서 발행
        // Payment 모델에 사업자번호 필드가 없으므로 Inquiry의 isCorporateRequest +
        // organizationName 으로 B2B 여부 판별, TaxInvoice에 customerBusinessNo 기록
        // 현재는 caseId 연결된 Inquiry에서 조회
        // Payment.caseId 에는 CaseMatter 의 id 가 들어간다(payments/confirm 참고).
        // 예전에는 그 값으로 Inquiry 를 직접 조회해 항상 null 이 나왔고,
        // B2B 세금계산서가 단 한 건도 발행되지 않았다. CaseMatter 를 거쳐 간다.
        const caseMatter = payment.caseId
          ? await prisma.caseMatter
              .findUnique({
                where: { id: payment.caseId },
                select: { inquiryId: true },
              })
              .catch(() => null)
          : null;
        const inquiry = caseMatter?.inquiryId
          ? await prisma.inquiry
              .findFirst({
                where: {
                  id: caseMatter.inquiryId,
                  isCorporateRequest: true,
                },
                select: {
                  organizationName: true,
                  contactName: true,
                  email: true,
                },
              })
              .catch(() => null)
          : null;

        // B2B 법인/사업자 요청인 경우에만 세금계산서 발행
        if (inquiry) {
          issueTaxInvoice({
            paymentId: payment.id,
            caseId: payment.caseId ?? undefined,
            totalAmount: payment.amount,
            customerName: inquiry.organizationName ?? inquiry.contactName ?? payment.customerName ?? "고객",
            customerEmail: inquiry.email ?? payment.customerEmail ?? undefined,
            itemName: payment.orderName,
          }).catch((err) => {
            logger.warn("[toss-webhook] tax invoice auto-issue failed", err);
            captureError(err instanceof Error ? err : new Error(String(err)), {
              orderId,
              context: "auto-tax-invoice",
            });
          });
        }
      }
    }

    logger.info(`[toss-webhook] orderId=${orderId} status=${data.status}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), { orderId });
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
