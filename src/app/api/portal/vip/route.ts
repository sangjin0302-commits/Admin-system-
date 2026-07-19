import { NextResponse } from "next/server";
import {
  cancelVip,
  getPlan,
  getVipPlans,
  subscribeVip,
  type VipPlan,
} from "@/lib/services/vip-membership-service";
import { portalUserKey, requirePortalUser } from "@/lib/security/portal-auth";

// 신원은 세션에서만 얻는다. 예전에는 ?userId=/x-portal-user 헤더/본문 userId 를
// 그대로 믿어서 아무나 남의 VIP 멤버십을 해지하거나 결제 없이 platinum 을 받을 수 있었다.

export async function GET() {
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;
  const userId = portalUserKey(authed);
  const [plans, membership] = await Promise.all([getVipPlans(), getPlan(userId)]);
  return NextResponse.json({ ok: true, plans, membership });
}

export async function POST(req: Request) {
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;
  const userId = portalUserKey(authed);

  // 본문의 userId 는 무시한다 — 대상은 언제나 로그인한 본인이다.
  const body = (await req.json().catch(() => null)) as
    | { plan?: VipPlan; action?: "subscribe" | "cancel" | "upgrade" | "downgrade" }
    | null;
  if (!body?.action) {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }
  if (body.action === "cancel") {
    await cancelVip(userId);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "subscribe" || body.action === "upgrade" || body.action === "downgrade") {
    if (!body.plan || !["silver", "gold", "platinum"].includes(body.plan)) {
      return NextResponse.json({ ok: false, error: "INVALID_PLAN" }, { status: 400 });
    }
    const record = await subscribeVip(userId, body.plan);
    return NextResponse.json({ ok: true, membership: record });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
