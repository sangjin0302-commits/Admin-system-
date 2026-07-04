import { NextResponse } from "next/server";

import {
  consumeRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { logger } from "@/lib/utils/logger";

const ALLOWED_DEPTHS = new Set([25, 50, 75, 100]);
const MAX_SLUG_LEN = 200;
const MAX_READ_TIME_MS = 1000 * 60 * 60 * 6; // 6h ceiling for sanity

export async function POST(req: Request) {
  try {
    try {
      const ip = getClientIpFromHeaders(req.headers);
      const rl = consumeRateLimit({
        namespace: "blog-scroll",
        key: ip,
        max: 60,
        windowMs: 60_000,
      });
      if (!rl.allowed) {
        return new NextResponse(null, { status: 429 });
      }
    } catch {
      // ignore rate-limit failures
    }

    const body = await req.json().catch(() => ({}));
    const slugRaw = typeof body?.slug === "string" ? body.slug.trim() : "";
    const depthRaw = typeof body?.depth === "number" ? body.depth : Number(body?.depth);
    const readTimeMsRaw =
      typeof body?.readTimeMs === "number"
        ? body.readTimeMs
        : Number(body?.readTimeMs);

    const slug = slugRaw.slice(0, MAX_SLUG_LEN).replace(/[^a-zA-Z0-9\-_./가-힣]/g, "");
    if (!slug) {
      return new NextResponse(null, { status: 400 });
    }
    if (!ALLOWED_DEPTHS.has(depthRaw)) {
      return new NextResponse(null, { status: 400 });
    }
    const readTimeMs = Number.isFinite(readTimeMsRaw)
      ? Math.max(0, Math.min(MAX_READ_TIME_MS, Math.round(readTimeMsRaw)))
      : 0;

    // No BlogAnalytics model exists — log for now.
    logger.info("[blog-scroll]", {
      slug,
      depth: depthRaw,
      readTimeMs,
      ts: new Date().toISOString(),
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
