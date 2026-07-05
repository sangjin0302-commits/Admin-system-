import { NextResponse } from "next/server";
import {
  cancelVip,
  getPlan,
  getVipPlans,
  subscribeVip,
  type VipPlan,
} from "@/lib/services/vip-membership-service";

function resolveUserId(req: Request, body?: { userId?: string }): string | null {
  if (body?.userId) return body.userId;
  const url = new URL(req.url);
  const q = url.searchParams.get("userId") ?? url.searchParams.get("email");
  if (q) return q;
  return req.headers.get("x-portal-user") ?? req.headers.get("x-user-email");
}

export async function GET(req: Request) {
  const userId = resolveUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 400 });
  const [plans, membership] = await Promise.all([getVipPlans(), getPlan(userId)]);
  return NextResponse.json({ ok: true, plans, membership });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { userId?: string; plan?: VipPlan; action?: "subscribe" | "cancel" | "upgrade" | "downgrade" }
    | null;
  const userId = resolveUserId(req, body ?? undefined);
  if (!userId || !body?.action) {
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
