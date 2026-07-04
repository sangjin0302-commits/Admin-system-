import { ZodError } from "zod";
import { NextResponse } from "next/server";

import {
  consumeRateLimit,
  getClientIpFromHeaders,
  getEnvInt
} from "@/lib/security/rate-limit";
import { getPublicIntakeControlSnapshot } from "@/lib/services/public-intake-control-service-safe-v3";
import { createInquiry } from "@/lib/services/inquiry-service";
import { getPublicTrackingCodeFromInquiry } from "@/lib/services/public-tracking-code-service";
import { logger } from "@/lib/utils/logger";

const KO_INVALID_JSON_SAFE =
  "\uC694\uCCAD \uBCF8\uBB38\uC774 \uC62C\uBC14\uB978 JSON \uD615\uC2DD\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uC785\uB825 \uB0B4\uC6A9\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
const KO_BAD_REQUEST_DEFAULT_SAFE =
  "\uC785\uB825 \uAC12\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
const KO_INTERNAL_ERROR_SAFE =
  "\uBB38\uC758 \uC811\uC218\uB97C \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";
const KO_TOO_MANY_REQUESTS_SAFE =
  "\uC694\uCCAD\uC774 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";
const KO_ORIGIN_REJECTED_SAFE =
  "\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uCD9C\uCC98 \uC694\uCCAD\uC774 \uCC28\uB2E8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
const KO_INVALID_CONTENT_TYPE_SAFE =
  "JSON \uD615\uC2DD\uC73C\uB85C \uC694\uCCAD\uD574 \uC8FC\uC138\uC694.";
const KO_REQUEST_TOO_LARGE_SAFE =
  "\uC694\uCCAD \uBCF8\uBB38\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4. \uC785\uB825 \uB0B4\uC6A9\uC744 \uC904\uC5EC \uC8FC\uC138\uC694.";
const KO_BLOCKED_AUTOMATION_SAFE =
  "\uC694\uCCAD \uD615\uC2DD\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.";

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
  received: true;
  message: string;
  trackingCode?: string;
};

type IntakeAvailabilityResponse = {
  ok: true;
  available: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  retryAfterSec: number | null;
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

export function toPublicInquiryResponse(inquiry: CreatedInquiryRecord): PublicInquiryResponse {
  const trackingCode = getPublicTrackingCodeFromInquiry(inquiry);
  return {
    received: true,
    message: "\uC811\uC218\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2F4\uB2F9\uC790\uAC00 \uD655\uC778 \uD6C4 \uC5F0\uB77D\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.",
    ...(trackingCode ? { trackingCode } : {})
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
    retryAfterSec: control.maintenanceMode ? control.retryAfterSec : null
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
    return jsonWithRequestId({ error: KO_ORIGIN_REJECTED_SAFE }, 403, requestId);
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
    return jsonWithRequestId({ error: KO_INVALID_CONTENT_TYPE_SAFE }, 415, requestId);
  }

  if (isBodyTooLarge(request)) {
    return jsonWithRequestId({ error: KO_REQUEST_TOO_LARGE_SAFE }, 413, requestId);
  }

  const clientIp = getClientIpFromHeaders(request.headers);

  // Upstash 분산 rate limit 우선, 없으면 in-memory fallback
  try {
    const { checkIntakeLimit, isUpstashConfigured } = await import("@/lib/security/upstash-ratelimit");
    if (isUpstashConfigured()) {
      const r = await checkIntakeLimit(clientIp);
      if (!r.ok) {
        return jsonWithRequestId(
          { error: KO_TOO_MANY_REQUESTS_SAFE },
          429,
          requestId,
          { "X-RateLimit-Remaining": "0", "X-RateLimit-Provider": "upstash" }
        );
      }
    }
  } catch {
    // Upstash 실패 → in-memory로 계속
  }

  const rateLimit = consumeRateLimit({
    namespace: "public-intake",
    key: clientIp,
    max: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS
  });
  if (!rateLimit.allowed) {
    return jsonWithRequestId(
      { error: KO_TOO_MANY_REQUESTS_SAFE },
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
      return jsonWithRequestId({ error: KO_REQUEST_TOO_LARGE_SAFE }, 413, requestId);
    }

    const payload = rawBody ? JSON.parse(rawBody) : {};
    if (getHoneypotValue(payload)) {
      return jsonWithRequestId({ error: KO_BLOCKED_AUTOMATION_SAFE }, 400, requestId);
    }

    const inquiry = await createInquiry(payload);

    const deduplicated = inquiry.createdAt.getTime() < requestStartedAt;
    if (!deduplicated) {
      import("@/lib/services/email-notification-service").then((mod) =>
        mod.sendNewInquiryNotification({
          name: String(payload.name ?? ""),
          email: String(payload.email ?? ""),
          phone: String(payload.phone ?? ""),
          inquiryType: String(payload.inquiryType ?? ""),
          message: String(payload.message ?? ""),
        }).catch(() => {})
      );
      // 카카오 알림톡 (고객 접수 확인)
      import("@/lib/services/kakao-notification-service").then((mod) => {
        if (mod.isAlimtalkConnected() && inquiry.phone) {
          mod.notifyInquiryReceived(
            inquiry.phone,
            inquiry.contactName || "고객님",
            inquiry.publicTrackingCode || inquiry.id.slice(0, 8)
          ).catch((err) => logger.warn("[intake] kakao notify failed", err));
        }
      }).catch(() => undefined);
      // 영업시간 외 자동 응대 (Claude Haiku)
      import("@/lib/services/after-hours-ai-service").then(async (mod) => {
        try {
          if (!(await mod.shouldTriggerAfterHours())) return;
          const siteMod = await import("@/lib/services/site-settings").catch(() => null);
          const kakaoUrl = siteMod
            ? await siteMod.getSiteSetting("contact.kakaoUrl").catch(() => "")
            : "";
          const reply = await mod.generateAfterHoursResponse({
            contactName: String(payload.name ?? inquiry.contactName ?? ""),
            inquiryType: String(payload.inquiryType ?? inquiry.inquiryType ?? ""),
            message: String(payload.message ?? ""),
            kakaoUrl: kakaoUrl || undefined,
          });
          // Send via email if configured
          if (inquiry.email) {
            const emailMod = await import("@/lib/services/email-notification-service").catch(() => null);
            const send = (emailMod as unknown as { sendAfterHoursAutoReply?: (a: { to: string; subject: string; body: string }) => Promise<unknown>; sendPlainEmail?: (a: { to: string; subject: string; body: string }) => Promise<unknown> } | null);
            if (send?.sendAfterHoursAutoReply) {
              await send.sendAfterHoursAutoReply({ to: inquiry.email, subject: reply.subject, body: reply.body }).catch(() => undefined);
            } else if (send?.sendPlainEmail) {
              await send.sendPlainEmail({ to: inquiry.email, subject: reply.subject, body: reply.body }).catch(() => undefined);
            }
          }
          // Stash for success page display
          try {
            await (await import("@/lib/prisma/client")).prisma.siteSetting.upsert({
              where: { key: `intake.afterHours.${inquiry.id}` },
              create: {
                key: `intake.afterHours.${inquiry.id}`,
                value: JSON.stringify({ subject: reply.subject, body: reply.body, nextOpenAt: reply.nextOpenAt, usedAi: reply.usedAi }),
              },
              update: { value: JSON.stringify({ subject: reply.subject, body: reply.body, nextOpenAt: reply.nextOpenAt, usedAi: reply.usedAi }) },
            });
          } catch { /* best-effort */ }
        } catch (err) {
          logger.warn("[intake] after-hours auto-reply failed", err);
        }
      }).catch(() => undefined);
      // 텔레그램 알림 (Jean 개인 봇)
      import("@/lib/services/telegram-notify").then((mod) => {
        const lines = [
          `이름: ${String(payload.name ?? "—")}`,
          `이메일: ${String(payload.email ?? "—")}`,
          `전화: ${String(payload.phone ?? "—")}`,
          `분야: ${String(payload.inquiryType ?? "—")}`,
          `내용: ${String(payload.message ?? "").slice(0, 200)}`
        ];
        return mod.sendTelegramAlert({
          kind: "inquiry",
          title: "신규 문의 접수",
          lines,
          url: process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/inquiries/${inquiry.id}`
            : undefined
        }).catch(() => undefined);
      }).catch(() => undefined);
    }
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
      return jsonWithRequestId({ error: KO_INVALID_JSON_SAFE }, 400, requestId);
    }

    if (error instanceof ZodError) {
      return jsonWithRequestId(
        { error: error.issues[0]?.message ?? KO_BAD_REQUEST_DEFAULT_SAFE },
        400,
        requestId
      );
    }

    logger.error("Failed to create inquiry", { requestId, error });
    return jsonWithRequestId({ error: KO_INTERNAL_ERROR_SAFE }, 500, requestId);
  }
}
