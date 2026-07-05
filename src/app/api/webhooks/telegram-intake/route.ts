/**
 * Telegram bot webhook — 인바운드 메시지를 자동 접수 봇으로 전달.
 *
 * 환경변수:
 *   TELEGRAM_INTAKE_SECRET       — Telegram setWebhook 시 지정한 secret_token.
 *                                   요청 헤더 X-Telegram-Bot-Api-Secret-Token 과 대조.
 */

import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("messenger_intake_bot"))) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const rl = rateLimit(`tg-intake:${clientIp(req)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const secret = process.env.TELEGRAM_INTAKE_SECRET?.trim();
  const sent = req.headers.get("x-telegram-bot-api-secret-token")?.trim();
  if (!secret || sent !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const update = body as {
    message?: { text?: string; from?: { first_name?: string; username?: string } };
    edited_message?: { text?: string };
  };
  const text = update.message?.text ?? update.edited_message?.text ?? "";
  if (!text) {
    return NextResponse.json({ ok: true, skipped: "no_text" });
  }

  try {
    const result = await processIncomingMessage("telegram", text);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    logger.error("[telegram-intake] 처리 실패", err);
    return NextResponse.json({ ok: false, error: "process_failed" }, { status: 500 });
  }
}
