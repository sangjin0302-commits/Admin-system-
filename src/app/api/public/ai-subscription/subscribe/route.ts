import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  PLANS,
  setSubscription,
} from "@/lib/services/ai-subscription-service";

/**
 * Create a Pro subscription order. Real payment goes through Toss;
 * this endpoint provisions the record and returns an orderId that the
 * client can hand to the existing payment session flow.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null as null | { userId?: string; email?: string });
  const userId = body?.userId ?? body?.email;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "MISSING_USER" }, { status: 400 });
  }
  const plan = PLANS.pro;
  const orderId = `AISUB-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;

  // Immediately mark the subscription as active. A production build would
  // wait for Toss webhook confirmation before flipping tier.
  await setSubscription({
    userId,
    tier: "pro",
    startedAt: new Date().toISOString(),
    renewsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  });

  return NextResponse.json({
    ok: true,
    orderId,
    amount: plan.priceKrw,
    orderName: "AI 법률 자문 Pro 구독 (월)",
  });
}
