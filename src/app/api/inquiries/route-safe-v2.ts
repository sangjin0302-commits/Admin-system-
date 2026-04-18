import { ZodError } from "zod";
import { NextResponse } from "next/server";

import {
  consumeRateLimit,
  getClientIpFromHeaders,
  getEnvInt
} from "@/lib/security/rate-limit";
import { getPublicIntakeControlSnapshot } from "@/lib/services/public-intake-control-service-safe-v3";
import { createInquiry } from "@/lib/services/inquiry-service";
import type { InquiryType, UrgencyLevel } from "@/types/inquiry";

const KO_INVALID_JSON =
  "요청 본문이 올바른 JSON 형식이 아닙니다. 입력 내용을 다시 확인해 주세요.";
const KO_BAD_REQUEST_DEFAULT = "입력 값을 다시 확인해 주세요.";
const KO_INTERNAL_ERROR =
  "문의 접수를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const KO_TOO_MANY_REQUESTS =
  "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
const KO_ORIGIN_REJECTED =
  "허용되지 않은 출처 요청이 차단되었습니다.";
const KO_INVALID_CONTENT_TYPE =
  "JSON 형식으로 요청해 주세요.";
const KO_REQUEST_TOO_LARGE =
  "요청 본문이 너무 큽니다. 입력 내용을 줄여 주세요.";
const KO_BLOCKED_AUTOMATION =
  "요청 형식을 다시 확인해 주세요.";

const RATE_LIMIT_WINDOW_MS = getEnvInt(
  "PUBLIC_INTAKE_RATE_LIMIT_WINDOW_MS",
  5 * 60 * 1000,
  60_000,
  3_600_000
);
const RATE_LIMIT_MAX_REQUESTS = getEnvInt(
  "PUBLIC_INTAKE_RATE_LIMIT_MAX_REQUESTS",
  25,
  5,
  200
);
const MAX_BODY_BYTES = getEnvInt(
  "PUBLIC_INTAKE_MAX_BODY_BYTES",
  64 * 1024,
  8 * 1024,
  512 * 1024
);
const ENABLE_HONEYPOT = getEnvBoolean("PUBLIC_INTAKE_ENABLE_HONEYPOT", true);
const REQUIRE_SAME_ORIGIN = getEnvBoolean("PUBLIC_INTAKE_REQUIRE_SAME_ORIGIN", true);
const ALLOW_MISSING_ORIGIN = getEnvBoolean("PUBLIC_INTAKE_ALLOW_MISSING_ORIGIN", false);
const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.PUBLIC_INTAKE_ALLOWED_ORIGINS);

type PublicInquiryResponse = {
  id: string;
  inquiryType: InquiryType;
  urgencyLevel: UrgencyLevel;
  generatedSummary: string;
  generatedGuidance: string;
  generatedReceiptMessage: string;
  consultationRequired: boolean;
  riskComplexityHint?: string | null;
};

type IntakeAvailabilityResponse = {
  ok: true;
  available: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  retryAfterSec: number | null;
  controlSource: "env" | "db";
  updatedAt: string | null;
  updatedBy: string | null;
};

type CreatedInquiryRecord = Awaited<ReturnType<typeof createInquiry>>;

function getEnvBoolean(name: string, defaultValue: boolean) {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function parseAllowedOrigins(raw: string | undefined) {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
      .map((entry) => {
        if (!entry.includes("://")) {
          return entry;
        }

        try {
          return new URL(entry).origin.toLowerCase();
        } catch {
          return entry;
        }
      })
  );
}

function getRequestHost(request: Request) {
  return (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host
  ).toLowerCase();
}

function getOriginCandidate(request: Request) {
  const origin = request.headers.get("origin")?.trim();
  if (origin) return origin;

  const referer = request.headers.get("referer")?.trim();
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(originCandidate: string, request: Request) {
  let origin: URL;
  try {
    origin = new URL(originCandidate);
  } catch {
    return false;
  }

  const originHost = origin.host.toLowerCase();
  if (originHost === getRequestHost(request)) {
    return true;
  }

  if (ALLOWED_ORIGINS.has("*")) {
    return true;
  }

  return (
    ALLOWED_ORIGINS.has(origin.origin.toLowerCase()) ||
    ALLOWED_ORIGINS.has(originHost)
  );
}

function isSameOriginAllowed(request: Request) {
  if (!REQUIRE_SAME_ORIGIN) return true;

  const originCandidate = getOriginCandidate(request);
  if (!originCandidate) {
    return ALLOW_MISSING_ORIGIN;
  }

  return isAllowedOrigin(originCandidate, request);
}

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

function isJsonParseError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === "SyntaxError" || error.message.toLowerCase().includes("json");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getHoneypotValue(payload: unknown) {
  if (!ENABLE_HONEYPOT || !isPlainObject(payload)) {
    return "";
  }

  const raw = payload.website;
  if (typeof raw === "string") {
    return raw.trim();
  }
  if (typeof raw === "number") {
    return String(raw).trim();
  }
  return "";
}

function toPublicInquiryResponse(inquiry: CreatedInquiryRecord): PublicInquiryResponse {
  return {
    id: inquiry.id,
    inquiryType: inquiry.inquiryType as InquiryType,
    urgencyLevel: inquiry.urgencyLevel as UrgencyLevel,
    generatedSummary: inquiry.generatedSummary,
    generatedGuidance: inquiry.generatedGuidance,
    generatedReceiptMessage: inquiry.generatedReceiptMessage,
    consultationRequired: inquiry.consultationRequired,
    riskComplexityHint: inquiry.riskComplexityHint
  };
}

function withRequestId(headers: HeadersInit | undefined, requestId: string) {
  const merged = new Headers(headers);
  merged.set("X-Request-Id", requestId);
  if (!merged.has("Cache-Control")) {
    merged.set("Cache-Control", "no-store");
  }
  return merged;
}

function jsonWithRequestId(
  body: Record<string, unknown>,
  status: number,
  requestId: string,
  headers?: HeadersInit
) {
  return NextResponse.json(
    { ...body, requestId },
    {
      status,
      headers: withRequestId(headers, requestId)
    }
  );
}

function buildIntakeAvailability(
  control: Awaited<ReturnType<typeof getPublicIntakeControlSnapshot>>
): IntakeAvailabilityResponse {
  return {
    ok: true,
    available: !control.maintenanceMode,
    maintenanceMode: control.maintenanceMode,
    maintenanceMessage: control.maintenanceMode ? control.maintenanceMessage : null,
    retryAfterSec: control.maintenanceMode ? control.retryAfterSec : null,
    controlSource: control.source,
    updatedAt: control.updatedAt,
    updatedBy: control.updatedBy
  };
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const control = await getPublicIntakeControlSnapshot();
  return jsonWithRequestId(buildIntakeAvailability(control), 200, requestId);
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const requestStartedAt = Date.now();

  if (!isSameOriginAllowed(request)) {
    return jsonWithRequestId({ error: KO_ORIGIN_REJECTED }, 403, requestId);
  }

  const intakeControl = await getPublicIntakeControlSnapshot();
  if (intakeControl.maintenanceMode) {
    return jsonWithRequestId(
      { error: intakeControl.maintenanceMessage },
      503,
      requestId,
      { "Retry-After": String(intakeControl.retryAfterSec) }
    );
  }

  if (!isJsonRequest(request)) {
    return jsonWithRequestId({ error: KO_INVALID_CONTENT_TYPE }, 415, requestId);
  }

  if (isBodyTooLarge(request)) {
    return jsonWithRequestId({ error: KO_REQUEST_TOO_LARGE }, 413, requestId);
  }

  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "public-intake",
    key: clientIp,
    max: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS
  });
  if (!rateLimit.allowed) {
    return jsonWithRequestId(
      { error: KO_TOO_MANY_REQUESTS },
      429,
      requestId,
      {
        "Retry-After": String(rateLimit.retryAfterSec),
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      }
    );
  }

  try {
    const rawBody = await request.text();
    const bodySizeBytes = new TextEncoder().encode(rawBody).length;
    if (bodySizeBytes > MAX_BODY_BYTES) {
      return jsonWithRequestId({ error: KO_REQUEST_TOO_LARGE }, 413, requestId);
    }

    const payload = rawBody ? JSON.parse(rawBody) : {};
    if (getHoneypotValue(payload)) {
      return jsonWithRequestId({ error: KO_BLOCKED_AUTOMATION }, 400, requestId);
    }

    const inquiry = await createInquiry(payload);

    const deduplicated = inquiry.createdAt.getTime() < requestStartedAt;
    return jsonWithRequestId(
      { inquiry: toPublicInquiryResponse(inquiry), deduplicated },
      201,
      requestId,
      {
        "X-Intake-Deduplicated": deduplicated ? "1" : "0",
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      }
    );
  } catch (error) {
    if (isJsonParseError(error)) {
      return jsonWithRequestId({ error: KO_INVALID_JSON }, 400, requestId);
    }

    if (error instanceof ZodError) {
      return jsonWithRequestId(
        { error: error.issues[0]?.message ?? KO_BAD_REQUEST_DEFAULT },
        400,
        requestId
      );
    }

    console.error("Failed to create inquiry", { requestId, error });
    return jsonWithRequestId({ error: KO_INTERNAL_ERROR }, 500, requestId);
  }
}
