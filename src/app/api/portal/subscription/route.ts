import { NextResponse } from "next/server";
import {
  cancelSubscription,
  getSubscription,
  getUsage,
  PLANS,
  setSubscription,
} from "@/lib/services/ai-subscription-service";

function resolveUserId(req: Request): string | null {
  const url = new URL(req.url);
  const q = url.searchParams.get("userId") ?? url.searchParams.get("email");
  if (q) return q;
  const header = req.headers.get("x-portal-user") ?? req.headers.get("x-user-email");
  return header;
}

export async function GET(req: Request) {
  const userId = resolveUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 400 });
  const [sub, usage] = await Promise.all([getSubscription(userId), getUsage(userId)]);
  return NextResponse.json({
    ok: true,
    subscription: sub,
    usage,
    plans: PLANS,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { userId?: string; action?: "upgrade" | "cancel" }
    | null;
  const userId = body?.userId ?? resolveUserId(req);
  if (!userId || !body?.action) {
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
