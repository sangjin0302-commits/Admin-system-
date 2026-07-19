/**
 * Payment service — Toss Payments integration with DB persistence.
 *
 * 환경변수 미설정 시 mock 모드 (개발용). Payment 모델로 모든 거래 영속화.
 *
 * Toss API:
 *  - POST /v1/payments                       (create payment)
 *  - POST /v1/payments/confirm               (confirm after redirect)
 *  - POST /v1/payments/:paymentKey/cancel    (full/partial cancel)
 *  - GET  /v1/payments/orders/:orderId       (lookup by orderId)
 */

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";
import { prisma } from "@/lib/prisma/client";

export interface PaymentRequest {
  orderId: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
  caseId?: string;
  successUrl?: string;
  failUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  receiptUrl?: string;
  error?: string;
}

export interface TossPaymentRecord {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  totalAmount: number;
  approvedAt?: string;
  receipt?: { url?: string };
}

const TOSS_BASE = "https://api.tosspayments.com";

function getSecretKey(): string | null {
  const k = process.env.TOSS_SECRET_KEY?.trim();
  return k && k.length > 0 ? k : null;
}

function authHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    "http://localhost:3000"
  );
}

export function isTossConnected(): boolean {
  return getSecretKey() !== null;
}

// ---------------------------------------------------------------------------
// Create session — Payment row 작성
// ---------------------------------------------------------------------------

export async function createPaymentSession(
  req: PaymentRequest
): Promise<{ paymentKey: string; checkoutUrl: string; isMock: boolean }> {
  const secretKey = getSecretKey();

  // DB 영속화 (REQUESTED 상태)
  await prisma.payment.create({
    data: {
      orderId: req.orderId,
      amount: req.amount,
      orderName: req.orderName,
      customerName: req.customerName,
      customerEmail: req.customerEmail,
      caseId: req.caseId,
      status: "REQUESTED",
    },
  }).catch((err) => {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      orderId: req.orderId,
    });
  });

  if (!secretKey) {
    logger.warn("[payment-service] TOSS_SECRET_KEY 미설정 — mock 세션 반환");
    const mockKey = `mock_${randomUUID()}`;
    return {
      paymentKey: mockKey,
      checkoutUrl: `${siteUrl()}/portal/payments/mock?orderId=${encodeURIComponent(
        req.orderId
      )}&amount=${req.amount}`,
      isMock: true,
    };
  }

  const successUrl = req.successUrl ?? `${siteUrl()}/portal/payments/success`;
  const failUrl = req.failUrl ?? `${siteUrl()}/portal/payments/fail`;

  const res = await fetch(`${TOSS_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(secretKey),
    },
    body: JSON.stringify({
      orderId: req.orderId,
      amount: req.amount,
      orderName: req.orderName,
      customerName: req.customerName,
      customerEmail: req.customerEmail,
      successUrl,
      failUrl,
      method: "카드",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error("[payment-service] Toss create error", res.status, body);
    captureError(new Error(`Toss create ${res.status}`), { body });
    await prisma.payment.updateMany({
      where: { orderId: req.orderId },
      data: { status: "FAILED", rawProviderJson: body },
    }).catch(() => undefined);
    throw new Error(`Toss Payments create error: ${res.status}`);
  }

  const data = await res.json();
  await prisma.payment.updateMany({
    where: { orderId: req.orderId },
    data: {
      paymentKey: data.paymentKey,
      rawProviderJson: JSON.stringify(data).slice(0, 4000),
    },
  }).catch(() => undefined);

  return {
    paymentKey: data.paymentKey,
    checkoutUrl: data.checkout?.url ?? successUrl,
    isMock: false,
  };
}

// ---------------------------------------------------------------------------
// Confirm payment (after Toss redirect) — Payment 상태 업데이트
// ---------------------------------------------------------------------------

export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<PaymentResult> {
  const secretKey = getSecretKey();

  if (!secretKey) {
    // 프로덕션에서 mock 승인을 내주면 안 된다. 예전에는 키가 없을 때 무조건
    // success:true 를 반환했고, 호출부(portal/payments/confirm)에 인증도 없어서
    // 아무나 사건을 "입금 완료"로 바꾸고 실제 의뢰인에게 입금 확인 알림까지
    // 발송시킬 수 있었다. 결제 수단이 미설정이면 실패로 처리한다.
    if (process.env.NODE_ENV === "production") {
      logger.error("[payment-service] confirm 거부 — TOSS_SECRET_KEY 미설정");
      return { success: false, error: "결제 수단이 설정되지 않았습니다." };
    }
    logger.warn("[payment-service] mock confirm (개발 환경 전용)");
    await prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: "CONFIRMED",
        paymentKey: paymentKey || `mock_${randomUUID()}`,
        approvedAt: new Date(),
      },
    }).catch(() => undefined);
    return { success: true, transactionId: `mock_txn_${randomUUID()}` };
  }

  try {
    const res = await fetch(`${TOSS_BASE}/v1/payments/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(secretKey),
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      await prisma.payment.updateMany({
        where: { orderId },
        data: {
          status: "FAILED",
          rawProviderJson: JSON.stringify(body).slice(0, 4000),
        },
      }).catch(() => undefined);
      return {
        success: false,
        error: body.message ?? `결제 승인 실패 (${res.status})`,
      };
    }

    const data = await res.json();
    await prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: "CONFIRMED",
        paymentKey: data.paymentKey ?? paymentKey,
        receiptUrl: data.receipt?.url,
        method: data.method,
        approvedAt: data.approvedAt ? new Date(data.approvedAt) : new Date(),
        rawProviderJson: JSON.stringify(data).slice(0, 4000),
      },
    }).catch(() => undefined);

    return {
      success: true,
      transactionId: data.transactionKey ?? data.paymentKey ?? paymentKey,
      receiptUrl: data.receipt?.url,
    };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류",
    };
  }
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

export async function cancelPayment(
  paymentKey: string,
  reason: string,
  cancelAmount?: number
): Promise<PaymentResult> {
  const secretKey = getSecretKey();
  if (!secretKey) {
    await prisma.payment.updateMany({
      where: { paymentKey },
      data: {
        status: cancelAmount ? "PARTIAL_CANCELED" : "CANCELED",
        cancelReason: reason,
        canceledAt: new Date(),
      },
    }).catch(() => undefined);
    return { success: true, transactionId: `mock_cancel_${randomUUID()}` };
  }

  try {
    const res = await fetch(
      `${TOSS_BASE}/v1/payments/${encodeURIComponent(paymentKey)}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(secretKey),
        },
        body: JSON.stringify({
          cancelReason: reason,
          ...(cancelAmount ? { cancelAmount } : {}),
        }),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        success: false,
        error: body.message ?? `결제 취소 실패 (${res.status})`,
      };
    }

    const data = await res.json();
    await prisma.payment.updateMany({
      where: { paymentKey },
      data: {
        status: cancelAmount ? "PARTIAL_CANCELED" : "CANCELED",
        cancelReason: reason,
        canceledAt: new Date(),
        rawProviderJson: JSON.stringify(data).slice(0, 4000),
      },
    }).catch(() => undefined);

    return { success: true, transactionId: data.lastTransactionKey ?? paymentKey };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류",
    };
  }
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export async function getPaymentByOrderId(
  orderId: string
): Promise<TossPaymentRecord | null> {
  const secretKey = getSecretKey();
  if (!secretKey) return null;
  try {
    const res = await fetch(
      `${TOSS_BASE}/v1/payments/orders/${encodeURIComponent(orderId)}`,
      { headers: { Authorization: authHeader(secretKey) } }
    );
    if (!res.ok) return null;
    return (await res.json()) as TossPaymentRecord;
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    return null;
  }
}

// ---------------------------------------------------------------------------
// DB listings (admin UI)
// ---------------------------------------------------------------------------

export async function listPayments(limit = 100) {
  try {
    return await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}

export async function getPaymentStats() {
  try {
    const [confirmed, requested, canceled, failed] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "CONFIRMED" },
      }),
      prisma.payment.count({ where: { status: "REQUESTED" } }),
      prisma.payment.count({
        where: { status: { in: ["CANCELED", "PARTIAL_CANCELED"] } },
      }),
      prisma.payment.count({ where: { status: "FAILED" } }),
    ]);
    return {
      confirmedAmount: Number(confirmed._sum.amount ?? 0),
      confirmedCount: confirmed._count,
      pendingCount: requested,
      canceledCount: canceled,
      failedCount: failed,
    };
  } catch {
    return {
      confirmedAmount: 0,
      confirmedCount: 0,
      pendingCount: 0,
      canceledCount: 0,
      failedCount: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

export function verifyTossWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    logger.warn("[payment-service] TOSS_WEBHOOK_SECRET 미설정 — 시그니처 검증 건너뜀");
    return true;
  }
  if (!signature) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
