/**
 * Payment service — Toss Payments integration.
 *
 * Reads TOSS_SECRET_KEY from env. When the key is absent the service
 * returns mock/development data so the admin UI remains functional
 * without a live payments account.
 *
 * Endpoints used (Toss Payments v1):
 *  - POST /v1/payments                       (create payment)
 *  - POST /v1/payments/confirm               (confirm after redirect)
 *  - POST /v1/payments/:paymentKey/cancel    (full/partial cancel)
 *  - GET  /v1/payments/orders/:orderId       (lookup by orderId)
 *
 * Webhook signature verification is provided via verifyTossWebhook().
 */

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentRequest {
  orderId: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
  /** Optional success/fail redirect URLs (otherwise we use NEXT_PUBLIC_SITE_URL). */
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

// ---------------------------------------------------------------------------
// Create session (returns mock-friendly fields)
// ---------------------------------------------------------------------------

export async function createPaymentSession(
  req: PaymentRequest
): Promise<{ paymentKey: string; checkoutUrl: string; isMock: boolean }> {
  const secretKey = getSecretKey();

  if (!secretKey) {
    logger.warn(
      "[payment-service] TOSS_SECRET_KEY 미설정 — 개발용 mock 데이터를 반환합니다."
    );
    const mockKey = `mock_${randomUUID()}`;
    return {
      paymentKey: mockKey,
      checkoutUrl: `${siteUrl()}/portal/payments/mock?orderId=${encodeURIComponent(req.orderId)}&amount=${req.amount}`,
      isMock: true,
    };
  }

  const successUrl =
    req.successUrl ?? `${siteUrl()}/portal/payments/success`;
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
    throw new Error(`Toss Payments create error: ${res.status}`);
  }

  const data = await res.json();
  return {
    paymentKey: data.paymentKey,
    checkoutUrl: data.checkout?.url ?? successUrl,
    isMock: false,
  };
}

// ---------------------------------------------------------------------------
// Confirm payment (after Toss redirect)
// ---------------------------------------------------------------------------

export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<PaymentResult> {
  const secretKey = getSecretKey();

  if (!secretKey) {
    logger.warn(
      "[payment-service] TOSS_SECRET_KEY 미설정 — mock 결제 승인을 반환합니다."
    );
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
      return {
        success: false,
        error: body.message ?? `결제 승인 실패 (${res.status})`,
      };
    }

    const data = await res.json();
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
// Cancel payment (full or partial)
// ---------------------------------------------------------------------------

export async function cancelPayment(
  paymentKey: string,
  reason: string,
  cancelAmount?: number
): Promise<PaymentResult> {
  const secretKey = getSecretKey();
  if (!secretKey) {
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
// Lookup by orderId
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
// Webhook signature verification
//   Toss sends a `tosspayments-webhook-signature` header (sha256 HMAC of raw body)
//   when TOSS_WEBHOOK_SECRET is registered.
// ---------------------------------------------------------------------------

export function verifyTossWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // No secret configured — accept (but log warning). For prod set the env.
    logger.warn(
      "[payment-service] TOSS_WEBHOOK_SECRET 미설정 — 웹훅 시그니처 검증을 건너뜁니다."
    );
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

export function isTossConnected(): boolean {
  return getSecretKey() !== null;
}
