import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { chat, getThread, relayToTelegram } from "@/lib/services/vip-concierge-bot";
import { getPlan } from "@/lib/services/vip-membership-service";
import { logger } from "@/lib/utils/logger";
import { portalUserKey, requirePortalUser } from "@/lib/security/portal-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 신원은 세션에서만 얻는다. 예전에는 ?clientId=/x-portal-user 헤더/본문 clientId 를
// 그대로 믿어서, 남의 이메일만 알면 그 사람의 VIP 상담 내역 전체를 읽고
// 그 사람 이름으로 텔레그램에 메시지를 흘려보낼 수 있었다.

// 간이 IP 기반 rate limit (30초당 12회)
const RATE_MAP = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 30_000;
const MAX_PER_WINDOW = 12;

function checkRate(key: string): boolean {
  const now = Date.now();
  const entry = RATE_MAP.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    RATE_MAP.set(key, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) return false;
  return true;
}

export async function GET() {
  if (!(await isFeatureEnabled("vip_concierge_bot"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 403 });
  }
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;
  const clientId = portalUserKey(authed);
  const membership = await getPlan(clientId);
  if (!membership) return NextResponse.json({ ok: false, error: "NOT_VIP" }, { status: 403 });
  const thread = await getThread(clientId);
  return NextResponse.json({ ok: true, plan: membership.plan, thread: thread.slice(-20) });
}

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("vip_concierge_bot"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 403 });
  }
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;
  const clientId = portalUserKey(authed);

  // 본문의 clientId 는 무시한다 — 대화 주체는 언제나 로그인한 본인이다.
  const body = (await req.json().catch(() => null)) as { message?: string } | null;
  if (!body?.message) {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }
  const rateKey = `${clientId}:${req.headers.get("x-forwarded-for") ?? "unknown"}`;
  if (!checkRate(rateKey)) {
    return NextResponse.json({ ok: false, error: "RATE_LIMIT" }, { status: 429 });
  }
  const membership = await getPlan(clientId);
  if (!membership) {
    return NextResponse.json({ ok: false, error: "NOT_VIP" }, { status: 403 });
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        send("start", { plan: membership.plan });
        const { reply, usedFallback } = await chat(clientId, body.message ?? "");
        // stream reply in chunks
        const CHUNK = 60;
        for (let i = 0; i < reply.length; i += CHUNK) {
          send("delta", { text: reply.slice(i, i + CHUNK) });
        }
        send("done", { fallback: usedFallback });
        relayToTelegram(clientId, reply).catch((err) => logger.warn("[concierge] telegram relay err", err));
        controller.close();
      } catch (err) {
        logger.warn("[concierge] stream error", err);
        send("error", { message: "internal" });
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
