import { NextResponse } from "next/server";

import {
  consumeRateLimit,
  getClientIpFromHeaders,
  getEnvInt
} from "@/lib/security/rate-limit";
import {
  lookupPublicTrackingStatus,
  PUBLIC_TRACKING_NOT_FOUND_MESSAGE,
  validatePublicTrackingLookupInput
} from "@/lib/services/public-tracking-lookup-service";
import { logger } from "@/lib/utils/logger";

const KO_INVALID_JSON =
  "\uC694\uCCAD \uBCF8\uBB38\uC774 \uC62C\uBC14\uB978 JSON \uD615\uC2DD\uC774 \uC544\uB2D9\uB2C8\uB2E4.";
const KO_INTERNAL_ERROR =
  "\uC811\uC218 \uC815\uBCF4\uB97C \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";
const KO_TOO_MANY_REQUESTS =
  "\uC694\uCCAD\uC774 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";

const RATE_LIMIT_WINDOW_MS = getEnvInt(
  "PUBLIC_TRACK_RATE_LIMIT_WINDOW_MS",
  5 * 60 * 1000,
  60_000,
  3_600_000
);
const RATE_LIMIT_MAX_REQUESTS = getEnvInt(
  "PUBLIC_TRACK_RATE_LIMIT_MAX_REQUESTS",
  20,
  5,
  200
);

function jsonNoStore(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  const mergedHeaders = new Headers(headers);
  mergedHeaders.set("Cache-Control", "no-store");
  return NextResponse.json(body, { status, headers: mergedHeaders });
}

function isJsonParseError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === "SyntaxError" || error.message.toLowerCase().includes("json");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "public-track",
    key: clientIp,
    max: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS
  });

  if (!rateLimit.allowed) {
    return jsonNoStore({ error: KO_TOO_MANY_REQUESTS }, 429, {
      "Retry-After": String(rateLimit.retryAfterSec),
      "X-RateLimit-Remaining": String(rateLimit.remaining)
    });
  }

  try {
    const payload = await request.json();
    const validation = validatePublicTrackingLookupInput(
      isPlainObject(payload) ? payload : {}
    );

    if (!validation.ok) {
      return jsonNoStore({ error: validation.error }, validation.status);
    }

    const result = await lookupPublicTrackingStatus({
      trackingCode: validation.trackingCode,
      phoneLast4: validation.phoneLast4
    });

    if (!result) {
      return jsonNoStore({ error: PUBLIC_TRACKING_NOT_FOUND_MESSAGE }, 404);
    }

    return jsonNoStore(result, 200, {
      "X-RateLimit-Remaining": String(rateLimit.remaining)
    });
  } catch (error) {
    if (isJsonParseError(error)) {
      return jsonNoStore({ error: KO_INVALID_JSON }, 400);
    }

    logger.error("Failed to lookup public tracking status");
    return jsonNoStore({ error: KO_INTERNAL_ERROR }, 500);
  }
}
