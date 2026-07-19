import { NextResponse } from "next/server";
import {
  cancelSubscription,
  getSubscription,
  getUsage,
  PLANS,
  setSubscription,
} from "@/lib/services/ai-subscription-service";
import { portalUserKey, requirePortalUser } from "@/lib/security/portal-auth";

// 신원은 세션에서만 얻는다. 예전에는 ?userId=/x-portal-user 헤더를 그대로 믿어서
// 아무나 남의 구독을 조회·해지하거나 결제 없이 pro 등급을 받을 수 있었다.

export async function GET() {
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;
  const userId = portalUserKey(authed);
  const [sub, usage] = await Promise.all([getSubscription(userId), getUsage(userId)]);
  return NextResponse.json({
    ok: true,
    subscription: sub,
    usage,
    plans: PLANS,
  });
}

export async function POST(req: Request) {
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;
  const userId = portalUserKey(authed);

  // 본문의 userId 는 무시한다 — 대상은 언제나 로그인한 본인이다.
  const body = (await req.json().catch(() => null)) as { action?: "upgrade" | "cancel" } | null;
  if (!body?.action) {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }
  if (body.action === "cancel") {
    await cancelSubscription(userId);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "upgrade") {
    await setSubscription({
      userId,
      tier: "pro",
      startedAt: new Date().toISOString(),
      renewsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
