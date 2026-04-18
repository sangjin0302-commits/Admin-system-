import { createAdminRequestContext } from "@/lib/http/admin-api";
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
  const api = createAdminRequestContext("admin.marketing.ingest.post");
  if (isPayloadTooLarge(request)) {
    return api.error(413, "요청 본문이 너무 큽니다.", { code: "PAYLOAD_TOO_LARGE" });
  }

  const ip = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "marketing-ingest",
    key: ip,
    max: MARKETING_RATE_LIMIT_MAX_REQUESTS,
    windowMs: MARKETING_RATE_LIMIT_WINDOW_MS
  });

  if (!rateLimit.allowed) {
    return api.error(
      429,
      "요청이 너무 많아 잠시 차단되었습니다.",
      {
        code: "RATE_LIMITED",
        headers: {
          "Retry-After": String(rateLimit.retryAfterSec)
        }
      }
    );
  }

  const token = request.headers.get("x-admin-sync-token");
  if (!verifyMarketingSyncToken(token)) {
    return api.error(401, "인증되지 않은 요청입니다.", { code: "UNAUTHORIZED_TOKEN" });
  }

  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object") {
      return api.error(400, "유효한 마케팅 스냅샷 본문이 필요합니다.", { code: "INVALID_BODY" });
    }

    const result = await saveMarketingSnapshot(payload);
    return api.ok({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    api.logError(error);
    return api.error(500, "마케팅 스냅샷 저장에 실패했습니다.", {
      code: "SAVE_MARKETING_SNAPSHOT_FAILED"
    });
  }
}
