/**
 * Payment service — Toss Payments integration.
 *
 * Reads TOSS_SECRET_KEY from env. When the key is absent the service
 * returns mock/development data so the admin UI remains functional
 * without a live payments account.
 */

import { randomUUID } from "crypto";
import { logger } from "@/lib/utils/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentRequest {
  orderId: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Create session
// ---------------------------------------------------------------------------

export async function createPaymentSession(
  req: PaymentRequest
): Promise<{ paymentKey: string; checkoutUrl: string }> {
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    logger.warn(
      "[payment-service] TOSS_SECRET_KEY 미설정 — 개발용 mock 데이터를 반환합니다."
    );
    const mockKey = `mock_${randomUUID()}`;
    return {
      paymentKey: mockKey,
      checkoutUrl: `https://mock-checkout.example.com/${mockKey}`,
    };
  }

  const encodedKey = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch("https://api.tosspayments.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedKey}`,
    },
    body: JSON.stringify({
      orderId: req.orderId,
      amount: req.amount,
      orderName: req.orderName,
      customerName: req.customerName,
      customerEmail: req.customerEmail,
      method: "카드",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error("[payment-service] Toss API error", res.status, body);
    throw new Error(`Toss Payments API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    paymentKey: data.paymentKey,
    checkoutUrl: data.checkout?.url ?? "",
  };
}

// ---------------------------------------------------------------------------
// Confirm payment
// ---------------------------------------------------------------------------

export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<PaymentResult> {
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    logger.warn(
      "[payment-service] TOSS_SECRET_KEY 미설정 — mock 결제 승인을 반환합니다."
    );
    return { success: true, transactionId: `mock_txn_${randomUUID()}` };
  }

  const encodedKey = Buffer.from(`${secretKey}:`).toString("base64");

  try {
    const res = await fetch(
      `https://api.tosspayments.com/v1/payments/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${encodedKey}`,
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        success: false,
        error: body.message ?? `결제 승인 실패 (${res.status})`,
      };
    }

    const data = await res.json();
    return { success: true, transactionId: data.transactionKey ?? paymentKey };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류",
    };
  }
}
