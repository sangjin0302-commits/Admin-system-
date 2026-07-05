/**
 * Kakao 채널 webhook — 인바운드 메시지를 자동 접수 봇으로 전달.
 *
 * 환경변수:
 *   KAKAO_INTAKE_SIGNING_SECRET — HMAC-SHA256(body) 를 헤더 X-Kakao-Signature 로 검증.
 *                                  (없으면 요청 거부)
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { rateLimit } from "@/lib/services/rate-limiter";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { processIncomingMessage } from "@/lib/services/message-intake-bot";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function verifySignature(secret: string, body: string, provided: string): boolean {
  try {
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(provided.replace(/^sha256=/, ""), "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("messenger_intake_bot"))) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const rl = rateLimit(`kakao-intake:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const secret = process.env.KAKAO_INTAKE_SIGNING_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
  }

  const raw = await req.text();
  const sig = req.headers.get("x-kakao-signature")?.trim() ?? "";
  if (!sig || !verifySignature(secret, raw, sig)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  // Kakao 챗봇 스킬 payload — userRequest.utterance 가 사용자 발화
  const payload = body as {
    userRequest?: { utterance?: string };
    message?: { content?: string };
    text?: string;
  };
  const text =
    payload.userRequest?.utterance ??
    payload.message?.content ??
    payload.text ??
    "";
  if (!text) {
    return NextResponse.json({ ok: true, skipped: "no_text" });
  }

  try {
    const result = await processIncomingMessage("kakao", text);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    logger.error("[kakao-intake] 처리 실패", err);
    return NextResponse.json({ ok: false, error: "process_failed" }, { status: 500 });
  }
}
