/**
 * API 키 인증 미들웨어 — x-api-key 헤더 검증 + 인메모리 레이트리밋 + 사용량 기록.
 */

import { NextResponse } from "next/server";
import { validateApiKey, recordUsage, type ApiProductId, type ValidationResult } from "@/lib/services/api-marketplace-service";

// 인메모리 slidingtimeslot 레이트리밋 (개발/저부하 용도) — 프로세스 재시작 시 리셋됩니다.
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_MIN = 60;
const rateStore = new Map<string, number[]>();

function checkRate(keyId: string): boolean {
  const now = Date.now();
  const arr = (rateStore.get(keyId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT_PER_MIN) {
    rateStore.set(keyId, arr);
    return false;
  }
  arr.push(now);
  rateStore.set(keyId, arr);
  return true;
}

export interface AuthorizedRequest {
  keyId: string;
  userId: string;
  productId: ApiProductId;
  remainingQuota: number;
}

/**
 * 라우트 핸들러에서 사용:
 *   const auth = await requireApiKey(req, "lawbot-analyze");
 *   if (!auth.ok) return auth.response;
 *   // ...auth.value 사용
 */
export async function requireApiKey(
  req: Request,
  expectedProduct?: ApiProductId
): Promise<{ ok: true; value: AuthorizedRequest; onFinish: (ok: boolean, latencyMs?: number) => Promise<void> } | { ok: false; response: NextResponse }> {
  const rawKey = req.headers.get("x-api-key");
  const result: ValidationResult = await validateApiKey(rawKey);
  if (!result.ok || !result.key || !result.product) {
    const status = result.reason === "MISSING" ? 401 : result.reason === "QUOTA_EXCEEDED" ? 429 : 403;
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: result.reason ?? "UNAUTHORIZED" }, { status }),
    };
  }
  if (expectedProduct && result.product.id !== expectedProduct) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "PRODUCT_MISMATCH" }, { status: 403 }),
    };
  }
  if (!checkRate(result.key.id)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "RATE_LIMITED" }, { status: 429 }),
    };
  }
  return {
    ok: true,
    value: {
      keyId: result.key.id,
      userId: result.key.userId,
      productId: result.product.id,
      remainingQuota: result.remainingQuota ?? 0,
    },
    onFinish: async (ok: boolean, latencyMs?: number) => {
      await recordUsage(result.key!.id, result.product!.id, ok, latencyMs).catch(() => undefined);
    },
  };
}
