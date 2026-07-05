import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { chat, getThread, relayToTelegram } from "@/lib/services/vip-concierge-bot";
import { getPlan } from "@/lib/services/vip-membership-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveClientId(req: Request, body?: { clientId?: string }): string | null {
  if (body?.clientId) return body.clientId.trim().toLowerCase();
  const url = new URL(req.url);
  const q = url.searchParams.get("clientId") ?? url.searchParams.get("email");
  if (q) return q.trim().toLowerCase();
  const header = req.headers.get("x-portal-user") ?? req.headers.get("x-user-email");
  return header ? header.trim().toLowerCase() : null;
}

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

export async function GET(req: Request) {
  if (!(await isFeatureEnabled("vip_concierge_bot"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 403 });
  }
  const clientId = resolveClientId(req);
  if (!clientId) return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 400 });
  const membership = await getPlan(clientId);
  if (!membership) return NextResponse.json({ ok: false, error: "NOT_VIP" }, { status: 403 });
  const thread = await getThread(clientId);
  return NextResponse.json({ ok: true, plan: membership.plan, thread: thread.slice(-20) });
}

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("vip_concierge_bot"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as { clientId?: string; message?: string } | null;
  const clientId = resolveClientId(req, body ?? undefined);
  if (!clientId || !body?.message) {
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
