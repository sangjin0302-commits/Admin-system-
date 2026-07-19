import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  PLANS,
  setSubscription,
} from "@/lib/services/ai-subscription-service";
import { portalUserKey, requirePortalUser } from "@/lib/security/portal-auth";

/**
 * Create a Pro subscription order. Real payment goes through Toss;
 * this endpoint provisions the record and returns an orderId that the
 * client can hand to the existing payment session flow.
 */
export async function POST() {
  // 인증 필수. 예전에는 본문에 아무 이메일이나 적으면 그 사람 앞으로 유료 pro
  // 구독이 즉시 활성화됐다 — 결제도, 로그인도 없이.
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;
  const userId = portalUserKey(authed);

  const plan = PLANS.pro;
  const orderId = `AISUB-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;

  // 결제 확인 전에는 등급을 올리지 않는다. 프로덕션에서 선지급 없이 tier 를
  // 올려버리면 주문만 만들고 결제를 포기해도 유료 기능이 열린다.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({
      ok: true,
      orderId,
      plan,
      pending: true,
      message: "결제 완료 후 이용권이 활성화됩니다.",
    });
  }

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
