import { ZodError } from "zod";
import { NextResponse } from "next/server";

import {
  consumeRateLimit,
  getClientIpFromHeaders,
  getEnvInt
} from "@/lib/security/rate-limit";
import { createInquiry } from "@/lib/services/inquiry-service";

const KO_BAD_REQUEST_DEFAULT = "\uC785\uB825 \uAC12\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
const KO_INTERNAL_ERROR =
  "\uBB38\uC758 \uC811\uC218\uB97C \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";
const KO_TOO_MANY_REQUESTS =
  "\uC694\uCCAD\uC774 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";
const KO_INVALID_CONTENT_TYPE =
  "JSON \uD615\uC2DD\uC73C\uB85C \uC694\uCCAD\uD574 \uC8FC\uC138\uC694.";
const KO_REQUEST_TOO_LARGE =
  "\uC694\uCCAD \uBCF8\uBB38\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4. \uC785\uB825 \uB0B4\uC6A9\uC744 \uC904\uC5EC \uC8FC\uC138\uC694.";

const RATE_LIMIT_WINDOW_MS = getEnvInt("PUBLIC_INTAKE_RATE_LIMIT_WINDOW_MS", 5 * 60 * 1000, 60_000, 3_600_000);
const RATE_LIMIT_MAX_REQUESTS = getEnvInt("PUBLIC_INTAKE_RATE_LIMIT_MAX_REQUESTS", 25, 5, 200);
const MAX_BODY_BYTES = getEnvInt("PUBLIC_INTAKE_MAX_BODY_BYTES", 64 * 1024, 8 * 1024, 512 * 1024);

function isJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.includes("application/json");
}

function isBodyTooLarge(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;
  const parsed = Number.parseInt(contentLength, 10);
  if (!Number.isFinite(parsed)) return false;
  return parsed > MAX_BODY_BYTES;
}

export async function POST(request: Request) {
  if (!isJsonRequest(request)) {
    return NextResponse.json({ error: KO_INVALID_CONTENT_TYPE }, { status: 415 });
  }

  if (isBodyTooLarge(request)) {
    return NextResponse.json({ error: KO_REQUEST_TOO_LARGE }, { status: 413 });
  }

  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "public-intake",
    key: clientIp,
    max: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: KO_TOO_MANY_REQUESTS },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSec),
          "X-RateLimit-Remaining": String(rateLimit.remaining)
        }
      }
    );
  }

  try {
    const payload = await request.json();
    const inquiry = await createInquiry(payload);

    return NextResponse.json(
      { inquiry },
      {
        status: 201,
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining)
        }
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? KO_BAD_REQUEST_DEFAULT }, { status: 400 });
    }

    console.error("Failed to create inquiry", error);
    return NextResponse.json({ error: KO_INTERNAL_ERROR }, { status: 500 });
  }
}
