import { NextResponse } from "next/server";

import { consumeRateLimit, getClientIpFromHeaders, getEnvInt } from "@/lib/security/rate-limit";
import { saveMarketingSnapshot, verifyMarketingSyncToken } from "@/lib/services/marketing-sync-service";

const MARKETING_RATE_LIMIT_WINDOW_MS = getEnvInt("ADMIN_MARKETING_RATE_LIMIT_WINDOW_MS", 60_000, 10_000, 600_000);
const MARKETING_RATE_LIMIT_MAX_REQUESTS = getEnvInt("ADMIN_MARKETING_RATE_LIMIT_MAX_REQUESTS", 30, 5, 200);
const MARKETING_MAX_BODY_BYTES = getEnvInt("ADMIN_MARKETING_MAX_BODY_BYTES", 512 * 1024, 16 * 1024, 2 * 1024 * 1024);

function isPayloadTooLarge(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;
  const parsed = Number.parseInt(contentLength, 10);
  if (!Number.isFinite(parsed)) return false;
  return parsed > MARKETING_MAX_BODY_BYTES;
}

export async function POST(request: Request) {
  if (isPayloadTooLarge(request)) {
    return NextResponse.json({ ok: false, error: "요청 본문이 너무 큽니다." }, { status: 413 });
  }

  const ip = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "marketing-ingest",
    key: ip,
    max: MARKETING_RATE_LIMIT_MAX_REQUESTS,
    windowMs: MARKETING_RATE_LIMIT_WINDOW_MS
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많아 잠시 차단되었습니다." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec) } }
    );
  }

  const token = request.headers.get("x-admin-sync-token");
  if (!verifyMarketingSyncToken(token)) {
    return NextResponse.json({ ok: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ ok: false, error: "유효한 마케팅 스냅샷 본문이 필요합니다." }, { status: 400 });
    }

    const result = await saveMarketingSnapshot(payload);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("Failed to ingest marketing snapshot", error);
    return NextResponse.json(
      { ok: false, error: "마케팅 스냅샷 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
